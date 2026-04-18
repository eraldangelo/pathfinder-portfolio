#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const ExcelJS = require('exceljs');
const { admin, getFirestore } = require('../../config/firebase-admin-utils.cjs');
const { HEADERS } = require('./constants.cjs');
const { parseArgs } = require('./parseArgs.cjs');
const {
  buildDuplicateKey,
  collectExistingArchiveByDuplicateKey,
  ensureParentDir,
  resolveDuplicateReportPath,
} = require('./duplicateUtils.cjs');
const { buildArchiveLeadPayload } = require('./payloadBuilder.cjs');
const { normalizeKey, toCellString, toDate } = require('./valueUtils.cjs');
const { indexHeaders } = require('./worksheetUtils.cjs');

const main = async () => {
  const options = parseArgs();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(path.resolve(options.file));
  const worksheet = workbook.getWorksheet(options.sheet) || workbook.worksheets[0];
  if (!worksheet) throw new Error(`Worksheet "${options.sheet}" not found.`);

  const headerMap = indexHeaders(worksheet);
  const requiredHeaders = [HEADERS.fullName, HEADERS.timestamp, HEADERS.preferredCourse, HEADERS.discoverySource];
  requiredHeaders.forEach((header) => {
    if (!headerMap.has(normalizeKey(header))) throw new Error(`Missing required header: ${header}`);
  });

  const db = getFirestore();
  let batch = options.apply ? db.batch() : null;
  let queuedWrites = 0;

  const stats = {
    scanned: 0,
    skippedEmpty: 0,
    skippedExcluded: 0,
    queued: 0,
    written: 0,
    samples: [],
  };

  const excludedNameKeys = new Set(options.excludeNames.map((name) => normalizeKey(name)));
  const candidateRows = [];

  const commit = async () => {
    if (!options.apply || !queuedWrites) return;
    await batch.commit();
    stats.written += queuedWrites;
    queuedWrites = 0;
    batch = db.batch();
  };

  for (let rowNumber = options.fromRow; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    if (stats.scanned >= options.limit) break;
    const row = worksheet.getRow(rowNumber);
    const read = (header) => row.getCell(headerMap.get(normalizeKey(header)) || -1).value;

    const fullName = toCellString(read(HEADERS.fullName));
    const email = toCellString(read(HEADERS.email)).toLowerCase();
    const mobile = toCellString(read(HEADERS.mobile));
    if (!fullName && !email && !mobile) {
      stats.skippedEmpty += 1;
      continue;
    }

    stats.scanned += 1;
    const timestamp = toDate(read(HEADERS.timestamp)) || new Date();
    const archiveYear = String(options.defaultYear || timestamp.getFullYear());

    const { payload, preferredCourses, discoverySources } = buildArchiveLeadPayload({ read, timestamp, admin });

    if (excludedNameKeys.has(normalizeKey(payload.fullName))) {
      stats.skippedExcluded += 1;
      continue;
    }

    if (stats.samples.length < options.sampleSize) {
      stats.samples.push({ row: rowNumber, fullName: payload.fullName, preferredCourses, discoverySources });
    }

    candidateRows.push({
      row: rowNumber,
      archiveYear,
      timestamp,
      payload,
      duplicateKey: buildDuplicateKey(payload),
    });
  }

  const importedByDuplicateKey = new Map();
  candidateRows.forEach((entry) => {
    const existing = importedByDuplicateKey.get(entry.duplicateKey) || [];
    existing.push(entry);
    importedByDuplicateKey.set(entry.duplicateKey, existing);
  });

  const existingArchiveByDuplicateKey = await collectExistingArchiveByDuplicateKey(db);

  const duplicateEntries = [];
  importedByDuplicateKey.forEach((rows, duplicateKey) => {
    const existingDocs = existingArchiveByDuplicateKey.get(duplicateKey) || [];
    if (rows.length <= 1 && existingDocs.length === 0) return;
    const first = rows[0];
    duplicateEntries.push({
      duplicateKey,
      fullName: first.payload.fullName,
      email: first.payload.email,
      phoneCountryCode: first.payload.phoneCountryCode,
      phoneNumber: first.payload.phoneNumber,
      importCount: rows.length,
      importRows: rows.map((row) => row.row),
      existingArchiveCount: existingDocs.length,
      existingArchivePaths: existingDocs.map((doc) => doc.path),
    });
  });

  duplicateEntries.sort((a, b) => {
    const severityA = a.importCount + a.existingArchiveCount;
    const severityB = b.importCount + b.existingArchiveCount;
    if (severityA !== severityB) return severityB - severityA;
    return a.fullName.localeCompare(b.fullName);
  });

  if (options.apply) {
    for (const row of candidateRows) {
      const ref = db.collection('archives').doc(row.archiveYear).collection('leads').doc();
      batch.set(ref, { ...row.payload, leadDocPath: ref.path }, { merge: true });
      const statusRef = ref.collection('status').doc();
      batch.set(statusRef, {
        id: statusRef.id,
        status: 'Archived',
        archivedYear: Number(row.archiveYear),
        archivedAt: admin.firestore.Timestamp.fromDate(row.timestamp),
        archivedReason: '2025migration',
      });
      queuedWrites += 1;
      stats.queued += 1;
      if (queuedWrites >= options.batchSize) await commit();
    }
  }

  await commit();

  const duplicateReportPath = resolveDuplicateReportPath(options.duplicateReport);
  ensureParentDir(duplicateReportPath);
  fs.writeFileSync(
    duplicateReportPath,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        mode: options.apply ? 'apply' : 'dry-run',
        sourceFile: path.resolve(options.file),
        sheet: worksheet.name,
        rowsScanned: stats.scanned,
        rowsSkippedEmpty: stats.skippedEmpty,
        rowsSkippedExcluded: stats.skippedExcluded,
        importCandidates: candidateRows.length,
        duplicateCount: duplicateEntries.length,
        duplicates: duplicateEntries,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  console.log(`Mode: ${options.apply ? 'APPLY' : 'DRY RUN'}`);
  console.log(`File: ${path.resolve(options.file)}`);
  console.log(`Sheet: ${worksheet.name}`);
  console.log(`Rows scanned: ${stats.scanned}`);
  console.log(`Rows skipped (empty): ${stats.skippedEmpty}`);
  console.log(`Rows skipped (excluded names): ${stats.skippedExcluded}`);
  console.log(`Import candidates: ${candidateRows.length}`);
  console.log(`Duplicate groups (same name+email+phone): ${duplicateEntries.length}`);
  console.log(`Rows queued: ${stats.queued}`);
  console.log(`Rows written: ${stats.written}`);
  console.log(`Duplicate report: ${duplicateReportPath}`);

  if (duplicateEntries.length > 0) {
    console.log('\nDuplicate list preview:');
    duplicateEntries.slice(0, 50).forEach((entry) => {
      console.log(
        `- ${entry.fullName} | ${entry.email || '(no email)'} | ${entry.phoneCountryCode}${entry.phoneNumber} | import=${entry.importCount} rows [${entry.importRows.join(', ')}] | existing=${entry.existingArchiveCount}`,
      );
    });
  }

  console.log('\nSample parsing:');
  stats.samples.forEach((sample) => {
    console.log(
      `- row ${sample.row} | ${sample.fullName} | courses=[${sample.preferredCourses.join(' | ')}] | sources=[${sample.discoverySources.join(' | ')}]`,
    );
  });
};

main().catch((error) => {
  console.error(`Import failed: ${error.message || String(error)}`);
  process.exit(1);
});