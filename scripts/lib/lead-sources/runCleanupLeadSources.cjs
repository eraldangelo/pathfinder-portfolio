#!/usr/bin/env node
const { parseArgs } = require('./parseArgs.cjs');
const { admin, getFirestore } = require('./firebaseAdmin.cjs');
const { DISCOVERY_OPTIONS } = require('./constants.cjs');
const { normalizeSpace, normalizeBranchKey, arraysEqual, topEntries } = require('./textUtils.cjs');
const {
  normalizeSubmissionLeadSources,
  isAssessmentSubmissionDoc,
} = require('./submissionNormalization.cjs');

const main = async () => {
  const options = parseArgs();
  const db = getFirestore();
  const docIdField = admin.firestore.FieldPath.documentId();

  console.log('Lead source cleanup started');
  console.log(`Mode: ${options.apply ? 'APPLY (writes enabled)' : 'DRY RUN (no writes)'}`);
  if (Number.isFinite(options.limit)) {
    console.log(`Limit: ${options.limit} assessment submissions`);
  }
  if (options.branch) {
    console.log(`Branch filter: ${options.branch}`);
  }
  if (options.activeOnly) {
    console.log('Scope: active leads only (isArchived !== true)');
  }

  let totalLeadDocsScanned = 0;
  let totalAssessmentDocsScanned = 0;
  let totalDocsWithSourceData = 0;
  let totalChangedDocs = 0;
  let totalWrittenDocs = 0;

  const rawLabelCounts = new Map();
  const normalizedLabelCounts = new Map();
  const samples = [];

  let batch = db.batch();
  let writesInBatch = 0;

  const commitBatch = async () => {
    if (!writesInBatch) return;
    await batch.commit();
    totalWrittenDocs += writesInBatch;
    writesInBatch = 0;
    batch = db.batch();
  };

  let lastDoc = null;
  let stop = false;

  while (!stop) {
    let query = db.collection('leads').orderBy(docIdField).limit(options.pageSize);
    if (lastDoc) query = query.startAfter(lastDoc);

    const snapshot = await query.get();
    if (snapshot.empty) break;

    for (const doc of snapshot.docs) {
      totalLeadDocsScanned += 1;
      const data = doc.data() || {};

      if (!isAssessmentSubmissionDoc(data)) continue;
      if (options.activeOnly && data.isArchived === true) continue;
      if (options.branch) {
        const branchKey = normalizeBranchKey(data.referredStaffBranch);
        if (branchKey !== normalizeBranchKey(options.branch)) continue;
      }

      totalAssessmentDocsScanned += 1;
      if (totalAssessmentDocsScanned > options.limit) {
        stop = true;
        break;
      }

      const hasData = data.pathfinderDiscoverySources !== undefined || data.otherPathfinderDiscoverySource !== undefined;
      if (!hasData) continue;
      totalDocsWithSourceData += 1;

      const currentSources = Array.isArray(data.pathfinderDiscoverySources)
        ? data.pathfinderDiscoverySources.map((item) => normalizeSpace(item)).filter(Boolean)
        : [];
      const currentOther = normalizeSpace(data.otherPathfinderDiscoverySource) || null;

      currentSources.forEach((value) => {
        rawLabelCounts.set(value, (rawLabelCounts.get(value) || 0) + 1);
      });

      const { normalizedSources, normalizedOther } = normalizeSubmissionLeadSources(
        currentSources,
        currentOther,
        data,
      );

      normalizedSources.forEach((value) => {
        normalizedLabelCounts.set(value, (normalizedLabelCounts.get(value) || 0) + 1);
      });

      const changed = !arraysEqual(currentSources, normalizedSources) || currentOther !== normalizedOther;
      if (!changed) continue;

      totalChangedDocs += 1;
      if (samples.length < options.sampleSize) {
        samples.push({
          id: doc.id,
          beforeSources: currentSources,
          beforeOther: currentOther,
          afterSources: normalizedSources,
          afterOther: normalizedOther,
        });
      }

      if (options.apply) {
        batch.update(doc.ref, {
          pathfinderDiscoverySources: normalizedSources,
          otherPathfinderDiscoverySource: normalizedOther,
        });
        writesInBatch += 1;

        if (writesInBatch >= options.batchSize) {
          await commitBatch();
        }
      }
    }

    lastDoc = snapshot.docs[snapshot.docs.length - 1];
  }

  if (options.apply) {
    await commitBatch();
  }

  console.log('\nSummary');
  console.log(`- Leads scanned: ${totalLeadDocsScanned}`);
  console.log(`- Assessment submissions scanned: ${totalAssessmentDocsScanned}`);
  console.log(`- Submissions with lead-source data: ${totalDocsWithSourceData}`);
  console.log(`- Submissions that need normalization: ${totalChangedDocs}`);
  console.log(`- Submissions written: ${totalWrittenDocs}`);

  const topRaw = topEntries(rawLabelCounts, 25);
  if (topRaw.length > 0) {
    console.log('\nTop raw labels');
    for (const [value, count] of topRaw) {
      console.log(`- ${value}: ${count}`);
    }
  }

  const topNormalized = topEntries(normalizedLabelCounts, DISCOVERY_OPTIONS.length);
  if (topNormalized.length > 0) {
    console.log('\nTop normalized labels');
    for (const [value, count] of topNormalized) {
      console.log(`- ${value}: ${count}`);
    }
  }

  if (samples.length > 0) {
    console.log('\nSample changes');
    for (const sample of samples) {
      const beforeOther = sample.beforeOther ? ` | other="${sample.beforeOther}"` : '';
      const afterOther = sample.afterOther ? ` | other="${sample.afterOther}"` : '';
      console.log(
        `- ${sample.id}: [${sample.beforeSources.join(' ; ')}]${beforeOther} -> [${sample.afterSources.join(' ; ')}]${afterOther}`,
      );
    }
  }

  if (options.dryRun) {
    console.log('\nDry run complete. Re-run with --apply to persist updates.');
  } else {
    console.log('\nCleanup complete. Firestore updates have been applied.');
  }
};

main().catch((error) => {
  console.error(`Cleanup failed: ${error.message || String(error)}`);
  process.exit(1);
});