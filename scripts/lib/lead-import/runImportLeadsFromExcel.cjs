#!/usr/bin/env node
const path = require('node:path');
const ExcelJS = require('exceljs');
const { admin, getFirestore } = require('../../config/firebase-admin-utils.cjs');
const { HEADERS } = require('./constants.cjs');
const { parseArgs } = require('./parseArgs.cjs');
const {
  indexHeaders,
  resolveHeaderColumn,
  formatHeaderLabel,
  buildNamePhoneKey,
} = require('./utils.cjs');
const { parseLeadRow } = require('./rowParser.cjs');
const { buildLeadDocPayload, buildNoteDocs, buildStatusDocs } = require('./payloadBuilder.cjs');
const { buildPersonnelDirectory } = require('./personnelResolver.cjs');
const {
  collectExistingLeadsByDuplicateKey,
  buildDuplicateEntries,
  writeDuplicateReport,
} = require('./duplicateUtils.cjs');

const requiredHeaders = [
  HEADERS.timestamp,
  HEADERS.fullName,
  HEADERS.branch,
  HEADERS.mobile,
  HEADERS.email,
  HEADERS.preferredCourse,
  HEADERS.discoverySource,
  HEADERS.adminRemarks,
  HEADERS.counsellorNotes,
];

const main = async () => {
  const options = parseArgs();
  const workbook = new ExcelJS.Workbook();
  const sourceFile = path.resolve(options.file);
  await workbook.xlsx.readFile(sourceFile);
  const worksheet = workbook.getWorksheet(options.sheet) || workbook.worksheets[0];
  if (!worksheet) throw new Error(`Worksheet "${options.sheet}" not found.`);

  const headerMap = indexHeaders(worksheet);
  requiredHeaders.forEach((header) => {
    if (!resolveHeaderColumn(headerMap, header)) {
      throw new Error(`Missing required header: ${formatHeaderLabel(header)}`);
    }
  });

  const db = getFirestore();
  const directory = await buildPersonnelDirectory(db);
  const {
    byDuplicateKey: existingByDuplicateKey,
    byNameEmailKey: existingByNameEmailKey,
    byNamePhoneKey: existingByNamePhoneKey,
  } =
    await collectExistingLeadsByDuplicateKey(db);

  const stats = {
    scanned: 0,
    skippedEmpty: 0,
    skippedExistingDuplicate: 0,
    skippedImportDuplicate: 0,
    importCandidates: 0,
    rowsToImport: 0,
    rowsWritten: 0,
    writeOpsWritten: 0,
    personalLeadTagged: 0,
    adminNoteRows: 0,
    counsellorNoteRows: 0,
  };

  const samples = [];
  const candidates = [];
  const importRowsByDuplicateKey = new Map();

  for (let rowNumber = options.fromRow; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    if (stats.scanned >= options.limit) break;
    const row = worksheet.getRow(rowNumber);
    const parsed = parseLeadRow({ row, headerMap, directory });

    if (!parsed) {
      stats.skippedEmpty += 1;
      continue;
    }

    stats.scanned += 1;
    stats.importCandidates += 1;

    if (parsed.payload.referredByStaff) stats.personalLeadTagged += 1;
    if (parsed.payload.adminRemarks) stats.adminNoteRows += 1;
    if (parsed.payload.counsellorNotes) stats.counsellorNoteRows += 1;

    if (samples.length < options.sampleSize) {
      samples.push({
        row: parsed.rowNumber,
        fullName: parsed.payload.fullName,
        endorsedTo: parsed.payload.assignedCounsellor || '(none)',
        referredStaffName: parsed.payload.referredStaffName || '(none)',
        adminStatus: parsed.payload.adminStatus || '(none)',
        consultationStatus: parsed.payload.consultationStatus || '(none)',
      });
    }

    const existingRows = importRowsByDuplicateKey.get(parsed.duplicateKey) || [];
    existingRows.push(parsed);
    importRowsByDuplicateKey.set(parsed.duplicateKey, existingRows);
    candidates.push(parsed);
  }

  const duplicateEntries = buildDuplicateEntries({
    importRowsByDuplicateKey,
    existingByDuplicateKey,
    existingByNameEmailKey,
    existingByNamePhoneKey,
  });

  const seenInImport = new Set();
  const rowsToImport = [];
  for (const rowEntry of candidates) {
    const duplicateKey = rowEntry.duplicateKey;
    if (seenInImport.has(duplicateKey)) {
      stats.skippedImportDuplicate += 1;
      continue;
    }

    const existsInDb = (existingByDuplicateKey.get(duplicateKey) || []).length > 0;
    const existsByNameEmail =
      (existingByNameEmailKey.get(rowEntry.duplicateNameEmailKey || '') || []).length > 0;
    const existsByNamePhone =
      (existingByNamePhoneKey.get(
        buildNamePhoneKey({
          fullName: rowEntry.payload.fullName,
          phoneCountryCode: rowEntry.payload.phoneCountryCode,
          phoneNumber: rowEntry.payload.phoneNumber,
        }),
      ) || []).length > 0;
    if ((existsInDb || existsByNameEmail || existsByNamePhone) && !options.includeExisting) {
      stats.skippedExistingDuplicate += 1;
      continue;
    }

    seenInImport.add(duplicateKey);
    rowsToImport.push(rowEntry);
  }

  stats.rowsToImport = rowsToImport.length;

  let batch = options.apply ? db.batch() : null;
  let queuedOps = 0;

  const commit = async () => {
    if (!options.apply || queuedOps === 0) return;
    await batch.commit();
    stats.writeOpsWritten += queuedOps;
    queuedOps = 0;
    batch = db.batch();
  };

  const importedAt = new Date();

  for (const rowEntry of rowsToImport) {
    if (!options.apply) continue;

    const leadRef = db.collection('leads').doc();
    const leadPayload = buildLeadDocPayload({
      rowEntry,
      admin,
      fileName: path.basename(sourceFile),
      importedAt,
    });

    batch.set(leadRef, leadPayload, { merge: true });
    queuedOps += 1;

    const statusDocs = buildStatusDocs({ leadId: leadRef.id, rowEntry, admin });
    statusDocs.forEach((entry) => {
      batch.set(leadRef.collection('status').doc(entry.id), entry.data, { merge: true });
      queuedOps += 1;
    });

    const noteDocs = buildNoteDocs({ leadId: leadRef.id, rowEntry, admin });
    noteDocs.forEach((entry) => {
      batch.set(leadRef.collection('notes').doc(entry.id), entry.data, { merge: true });
      queuedOps += 1;
    });

    stats.rowsWritten += 1;
    if (queuedOps >= options.batchSize) await commit();
  }

  await commit();

  const duplicateReportPath = writeDuplicateReport({
    duplicateReport: options.duplicateReport,
    sourceFile,
    sheet: worksheet.name,
    mode: options.apply ? 'apply' : 'dry-run',
    stats,
    duplicateEntries,
  });

  console.log(`Mode: ${options.apply ? 'APPLY' : 'DRY RUN'}`);
  console.log(`File: ${sourceFile}`);
  console.log(`Sheet: ${worksheet.name}`);
  console.log(`Rows scanned: ${stats.scanned}`);
  console.log(`Rows skipped (empty): ${stats.skippedEmpty}`);
  console.log(`Rows skipped (existing duplicate): ${stats.skippedExistingDuplicate}`);
  console.log(`Rows skipped (duplicate in import): ${stats.skippedImportDuplicate}`);
  console.log(`Import candidates: ${stats.importCandidates}`);
  console.log(`Rows to import: ${stats.rowsToImport}`);
  console.log(`Rows written: ${stats.rowsWritten}`);
  console.log(`Write ops written: ${stats.writeOpsWritten}`);
  console.log(`Personal leads tagged: ${stats.personalLeadTagged}`);
  console.log(`Admin notes created (rows): ${stats.adminNoteRows}`);
  console.log(`Counsellor notes created (rows): ${stats.counsellorNoteRows}`);
  console.log(`Duplicate report: ${duplicateReportPath}`);

  if (duplicateEntries.length > 0) {
    console.log('\nDuplicate list preview:');
    duplicateEntries.slice(0, 20).forEach((entry) => {
      console.log(
        `- ${entry.fullName} | ${entry.email || '(no email)'} | ${entry.phoneCountryCode}${entry.phoneNumber} | import=${entry.importCount} rows [${entry.importRows.join(', ')}] | existing=${entry.existingCount}`,
      );
    });
  }

  console.log('\nSample parsing:');
  samples.forEach((sample) => {
    console.log(
      `- row ${sample.row} | ${sample.fullName} | endorsed=${sample.endorsedTo} | referrer=${sample.referredStaffName} | admin=${sample.adminStatus} | consult=${sample.consultationStatus}`,
    );
  });
};

main().catch((error) => {
  console.error(`Import failed: ${error.message || String(error)}`);
  process.exit(1);
});
