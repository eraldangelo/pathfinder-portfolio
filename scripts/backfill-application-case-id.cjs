#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { getFirestore } = require('./config/firebase-admin-utils.cjs');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const options = {
    apply: false,
    dryRun: true,
    sampleSize: 25,
    reportPath: null,
    limit: Number.POSITIVE_INFINITY,
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
    if (arg.startsWith('--sample-size=')) {
      const value = Number(arg.split('=')[1]);
      if (Number.isFinite(value) && value > 0) options.sampleSize = Math.floor(value);
      continue;
    }
    if (arg.startsWith('--report=')) {
      const value = String(arg.split('=')[1] || '').trim();
      if (value) options.reportPath = value;
      continue;
    }
    if (arg.startsWith('--limit=')) {
      const value = Number(arg.split('=')[1]);
      if (Number.isFinite(value) && value > 0) options.limit = Math.floor(value);
      continue;
    }
  }

  return options;
};

const resolveOutputReportPath = (rawPath) => {
  if (rawPath) {
    return path.isAbsolute(rawPath) ? rawPath : path.join(process.cwd(), rawPath);
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return path.join(process.cwd(), 'reports', `application-caseid-backfill-${stamp}.json`);
};

const ensureDir = (filePath) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
};

const findCaseId = async ({ db, studentId, years }) => {
  const rootLeadSnapshot = await db.collection('leads').doc(studentId).get();
  const rootCaseId = String(rootLeadSnapshot.data?.()?.caseId || '').trim();
  if (rootCaseId) {
    return { caseId: rootCaseId, sourcePath: rootLeadSnapshot.ref.path };
  }

  for (const yearId of years) {
    const archivedLeadSnapshot = await db
      .collection('archives')
      .doc(yearId)
      .collection('leads')
      .doc(studentId)
      .get();
    const archivedCaseId = String(archivedLeadSnapshot.data?.()?.caseId || '').trim();
    if (archivedCaseId) {
      return { caseId: archivedCaseId, sourcePath: archivedLeadSnapshot.ref.path };
    }
  }

  return { caseId: '', sourcePath: null };
};

const main = async () => {
  const options = parseArgs();
  const db = getFirestore();

  console.log('Application caseId backfill');
  console.log(`Mode: ${options.apply ? 'APPLY (writes enabled)' : 'DRY RUN (no writes)'}`);

  const yearsSnapshot = await db
    .collection('archives')
    .get();
  const years = yearsSnapshot.docs
    .map((doc) => String(doc.id || '').trim())
    .filter(Boolean)
    .sort((a, b) => Number(b) - Number(a));

  const applicationSnapshot = await db.collectionGroup('applications').get();
  let scanned = 0;
  let missingCaseId = 0;
  let candidateUpdates = 0;
  let updated = 0;
  let unresolved = 0;
  const failures = [];
  const sample = [];

  for (const applicationDoc of applicationSnapshot.docs) {
    scanned += 1;
    const data = applicationDoc.data() || {};
    const currentCaseId = String(data.caseId || '').trim();
    if (currentCaseId) continue;

    const studentId = String(data.studentId || '').trim();
    if (!studentId) continue;
    missingCaseId += 1;

    const { caseId, sourcePath } = await findCaseId({ db, studentId, years });
    if (!caseId) {
      unresolved += 1;
      if (sample.length < options.sampleSize) {
        sample.push({
          applicationPath: applicationDoc.ref.path,
          studentId,
          status: 'unresolved',
        });
      }
      continue;
    }

    candidateUpdates += 1;
    if (sample.length < options.sampleSize) {
      sample.push({
        applicationPath: applicationDoc.ref.path,
        studentId,
        caseId,
        sourcePath,
        status: 'resolved',
      });
    }

    if (candidateUpdates > options.limit) {
      break;
    }

    if (!options.apply) continue;

    try {
      await applicationDoc.ref.set({ caseId }, { merge: true });
      updated += 1;
    } catch (error) {
      failures.push({
        applicationPath: applicationDoc.ref.path,
        studentId,
        error: error?.message || String(error),
      });
    }
  }

  const summary = {
    mode: options.apply ? 'apply' : 'dry-run',
    scanned,
    missingCaseId,
    candidateUpdates,
    updated,
    unresolved,
    failures: failures.length,
  };

  const report = {
    summary,
    sample,
    failures,
  };

  const reportPath = resolveOutputReportPath(options.reportPath);
  ensureDir(reportPath);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  console.log('\nSummary');
  console.log(`- Applications scanned: ${summary.scanned}`);
  console.log(`- Missing caseId: ${summary.missingCaseId}`);
  console.log(`- Candidate updates: ${summary.candidateUpdates}`);
  console.log(`- Updated: ${summary.updated}`);
  console.log(`- Unresolved: ${summary.unresolved}`);
  console.log(`- Failures: ${summary.failures}`);
  console.log(`- Report: ${reportPath}`);

  if (failures.length > 0) {
    process.exitCode = 1;
  }
};

main().catch((error) => {
  console.error(`Backfill failed: ${error?.message || String(error)}`);
  process.exit(1);
});
