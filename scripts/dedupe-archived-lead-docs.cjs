#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { getFirestore } = require('./config/firebase-admin-utils.cjs');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const options = {
    apply: false,
    dryRun: true,
    limit: Number.POSITIVE_INFINITY,
    sampleSize: 25,
    reportPath: null,
  };

  for (const arg of args) {
    if (arg === '--apply') {
      options.apply = true;
      options.dryRun = false;
      continue;
    }
    if (arg === '--dry-run') {
      options.apply = false;
      options.dryRun = true;
      continue;
    }
    if (arg.startsWith('--limit=')) {
      const value = Number(arg.split('=')[1]);
      if (Number.isFinite(value) && value > 0) {
        options.limit = Math.floor(value);
      }
      continue;
    }
    if (arg.startsWith('--sample-size=')) {
      const value = Number(arg.split('=')[1]);
      if (Number.isFinite(value) && value > 0) {
        options.sampleSize = Math.floor(value);
      }
      continue;
    }
    if (arg.startsWith('--report=')) {
      const value = String(arg.split('=')[1] || '').trim();
      if (value) options.reportPath = value;
      continue;
    }
  }

  return options;
};

const isYearlyArchiveLeadPath = (docPath) =>
  String(docPath || '').startsWith('archives/');

const toMillis = (value) => {
  if (!value) return 0;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? 0 : value.getTime();
  if (typeof value.toDate === 'function') {
    try {
      const parsed = value.toDate();
      return parsed instanceof Date && !Number.isNaN(parsed.getTime()) ? parsed.getTime() : 0;
    } catch {
      return 0;
    }
  }
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
};

const leadCompletenessScore = (data) => {
  const fields = [
    'fullName',
    'name',
    'email',
    'emailAddress',
    'phoneNumber',
    'mobileNumber',
    'branch',
    'referredStaffBranch',
    'assignedCounsellor',
    'currentLocation',
    'dob',
    'dateOfBirth',
    'caseId',
  ];

  return fields.reduce((score, field) => {
    const hasValue = String(data?.[field] ?? '').trim() !== '';
    return score + (hasValue ? 1 : 0);
  }, 0);
};

const choosePreferredLeadDoc = (currentDoc, incomingDoc) => {
  const currentPath = String(currentDoc?.ref?.path || '');
  const incomingPath = String(incomingDoc?.ref?.path || '');

  const currentIsYearly = isYearlyArchiveLeadPath(currentPath);
  const incomingIsYearly = isYearlyArchiveLeadPath(incomingPath);
  if (currentIsYearly !== incomingIsYearly) {
    return incomingIsYearly ? incomingDoc : currentDoc;
  }

  const currentData = currentDoc?.data?.() || {};
  const incomingData = incomingDoc?.data?.() || {};
  const currentScore = leadCompletenessScore(currentData);
  const incomingScore = leadCompletenessScore(incomingData);
  if (currentScore !== incomingScore) {
    return incomingScore > currentScore ? incomingDoc : currentDoc;
  }

  const currentArchivedMillis = toMillis(currentData.archivedAt || currentData.createdAt);
  const incomingArchivedMillis = toMillis(incomingData.archivedAt || incomingData.createdAt);
  if (currentArchivedMillis !== incomingArchivedMillis) {
    return incomingArchivedMillis > currentArchivedMillis ? incomingDoc : currentDoc;
  }

  return incomingPath.localeCompare(currentPath) > 0 ? incomingDoc : currentDoc;
};

const isArchiveRelevantLeadDoc = (doc) => {
  const pathValue = String(doc?.ref?.path || '');
  if (isYearlyArchiveLeadPath(pathValue)) return true;
  const data = doc?.data?.() || {};
  return data.isArchived === true;
};

const resolveOutputReportPath = (rawPath) => {
  if (rawPath) {
    return path.isAbsolute(rawPath) ? rawPath : path.join(process.cwd(), rawPath);
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return path.join(process.cwd(), 'reports', `archive-dedupe-${stamp}.json`);
};

const ensureDir = (filePath) => {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
};

const main = async () => {
  const options = parseArgs();
  const db = getFirestore();
  const startedAt = new Date();

  console.log('Archive duplicate lead cleanup');
  console.log(`Mode: ${options.apply ? 'APPLY (deletes enabled)' : 'DRY RUN (no deletes)'}`);
  if (Number.isFinite(options.limit)) {
    console.log(`Limit: ${options.limit} lead IDs with duplicates`);
  }

  const snapshot = await db.collectionGroup('leads').get();
  console.log(`Scanned docs from collectionGroup('leads'): ${snapshot.size}`);

  const groupedByLeadId = new Map();
  for (const doc of snapshot.docs) {
    const existing = groupedByLeadId.get(doc.id) || [];
    existing.push(doc);
    groupedByLeadId.set(doc.id, existing);
  }

  const duplicateEntries = [];
  for (const [leadId, docs] of groupedByLeadId.entries()) {
    if (docs.length < 2) continue;

    const archivedDocs = docs.filter((doc) => isArchiveRelevantLeadDoc(doc));
    if (archivedDocs.length === 0) continue;

    const keepDoc = archivedDocs.reduce((current, incoming) => {
      if (!current) return incoming;
      return choosePreferredLeadDoc(current, incoming);
    }, null);
    if (!keepDoc) continue;

    const deleteDocs = docs.filter((doc) => String(doc.ref.path) !== String(keepDoc.ref.path));
    if (deleteDocs.length === 0) continue;

    duplicateEntries.push({
      leadId,
      keepPath: keepDoc.ref.path,
      deletePaths: deleteDocs.map((doc) => doc.ref.path),
      hasYearlyArchiveCopy: archivedDocs.some((doc) => isYearlyArchiveLeadPath(doc.ref.path)),
    });

    if (duplicateEntries.length >= options.limit) break;
  }

  let deletedDocCount = 0;
  const failures = [];

  if (options.apply) {
    for (const entry of duplicateEntries) {
      for (const deletePath of entry.deletePaths) {
        try {
          await db.recursiveDelete(db.doc(deletePath));
          deletedDocCount += 1;
        } catch (error) {
          failures.push({
            leadId: entry.leadId,
            deletePath,
            error: error?.message || String(error),
          });
        }
      }
    }
  }

  const summary = {
    startedAt: startedAt.toISOString(),
    finishedAt: new Date().toISOString(),
    mode: options.apply ? 'apply' : 'dry-run',
    scannedDocs: snapshot.size,
    leadGroupsScanned: groupedByLeadId.size,
    duplicateLeadGroups: duplicateEntries.length,
    candidateDeletes: duplicateEntries.reduce((sum, entry) => sum + entry.deletePaths.length, 0),
    deletedDocs: deletedDocCount,
    failedDeletes: failures.length,
  };

  const report = {
    summary,
    sample: duplicateEntries.slice(0, options.sampleSize),
    failures,
  };

  const reportPath = resolveOutputReportPath(options.reportPath);
  ensureDir(reportPath);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  console.log('\nSummary');
  console.log(`- Lead groups scanned: ${summary.leadGroupsScanned}`);
  console.log(`- Duplicate lead groups: ${summary.duplicateLeadGroups}`);
  console.log(`- Candidate deletes: ${summary.candidateDeletes}`);
  console.log(`- Deleted docs: ${summary.deletedDocs}`);
  console.log(`- Failed deletes: ${summary.failedDeletes}`);
  console.log(`- Report: ${reportPath}`);

  if (summary.failedDeletes > 0) {
    process.exitCode = 1;
  }
};

main().catch((error) => {
  console.error(`Cleanup failed: ${error?.message || String(error)}`);
  process.exit(1);
});
