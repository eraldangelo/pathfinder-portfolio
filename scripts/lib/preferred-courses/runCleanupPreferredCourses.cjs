#!/usr/bin/env node
const { admin, getFirestore } = require('../../config/firebase-admin-utils.cjs');
const { COURSE_OPTIONS } = require('./constants.cjs');
const { parseArgs } = require('./parseArgs.cjs');
const { canonicalByKey } = require('./courseMapping.cjs');
const { normalizePreferredCourses, isAssessmentSubmissionDoc } = require('./normalization.cjs');
const {
  arraysEqual,
  isGenericOtherValue,
  normalizeBranchKey,
  normalizeKey,
  topEntries,
} = require('./textUtils.cjs');

const main = async () => {
  const options = parseArgs();
  const db = getFirestore();

  console.log('Preferred course cleanup started');
  console.log(`Mode: ${options.apply ? 'APPLY (writes enabled)' : 'DRY RUN (no writes)'}`);
  if (Number.isFinite(options.limit)) {
    console.log(`Limit: ${options.limit} assessment submissions`);
  }
  if (options.branch) {
    console.log(`Branch filter: ${options.branch}`);
  }

  const outcomeCount = new Map();
  const dirtyValueCount = new Map();
  const samples = [];

  let totalLeadDocsScanned = 0;
  let totalAssessmentDocsScanned = 0;
  let totalDocsWithCourseData = 0;
  let totalChangedDocs = 0;
  let totalWrittenDocs = 0;

  let batch = db.batch();
  let writesInBatch = 0;

  const commitBatch = async () => {
    if (!writesInBatch) return;
    await batch.commit();
    totalWrittenDocs += writesInBatch;
    writesInBatch = 0;
    batch = db.batch();
  };

  const docIdField = admin.firestore.FieldPath.documentId();
  let lastDoc = null;
  let stop = false;

  while (!stop) {
    let query = db.collection('leads').orderBy(docIdField).limit(options.pageSize);
    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    const snapshot = await query.get();
    if (snapshot.empty) break;

    for (const doc of snapshot.docs) {
      totalLeadDocsScanned += 1;
      const data = doc.data() || {};

      if (!isAssessmentSubmissionDoc(data)) {
        continue;
      }

      if (options.branch) {
        const branchKey = normalizeBranchKey(data.referredStaffBranch);
        if (branchKey !== normalizeBranchKey(options.branch)) {
          continue;
        }
      }

      totalAssessmentDocsScanned += 1;
      if (totalAssessmentDocsScanned > options.limit) {
        stop = true;
        break;
      }

      const hasCourseData =
        data.preferredCoursesOfStudy !== undefined
        || data.otherPreferredCourseOfStudy !== undefined;
      if (!hasCourseData) {
        continue;
      }

      totalDocsWithCourseData += 1;

      const {
        currentCourses,
        currentOther,
        normalizedCourses,
        normalizedOther,
      } = normalizePreferredCourses({
        preferredCoursesOfStudy: data.preferredCoursesOfStudy,
        otherPreferredCourseOfStudy: data.otherPreferredCourseOfStudy,
      });

      for (const course of currentCourses) {
        const key = normalizeKey(course);
        if (!canonicalByKey.has(key) && !isGenericOtherValue(course)) {
          dirtyValueCount.set(course, (dirtyValueCount.get(course) || 0) + 1);
        }
      }

      normalizedCourses.forEach((course) => {
        outcomeCount.set(course, (outcomeCount.get(course) || 0) + 1);
      });

      const changed = !arraysEqual(currentCourses, normalizedCourses) || currentOther !== normalizedOther;
      if (!changed) {
        continue;
      }

      totalChangedDocs += 1;
      if (samples.length < options.sampleSize) {
        samples.push({
          id: doc.id,
          beforeCourses: currentCourses,
          beforeOther: currentOther,
          afterCourses: normalizedCourses,
          afterOther: normalizedOther,
        });
      }

      if (options.apply) {
        batch.update(doc.ref, {
          preferredCoursesOfStudy: normalizedCourses,
          otherPreferredCourseOfStudy: normalizedOther,
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
  console.log(`- Submissions with preferred course data: ${totalDocsWithCourseData}`);
  console.log(`- Submissions that need normalization: ${totalChangedDocs}`);
  console.log(`- Submissions written: ${totalWrittenDocs}`);

  const topDirty = topEntries(dirtyValueCount, 20);
  if (topDirty.length > 0) {
    console.log('\nTop legacy values detected');
    for (const [value, count] of topDirty) {
      console.log(`- ${value}: ${count}`);
    }
  }

  const topOutcomes = topEntries(outcomeCount, COURSE_OPTIONS.length);
  if (topOutcomes.length > 0) {
    console.log('\nResulting normalized categories');
    for (const [value, count] of topOutcomes) {
      console.log(`- ${value}: ${count}`);
    }
  }

  if (samples.length > 0) {
    console.log('\nSample changes');
    for (const sample of samples) {
      const beforeOther = sample.beforeOther ? ` | other="${sample.beforeOther}"` : '';
      const afterOther = sample.afterOther ? ` | other="${sample.afterOther}"` : '';
      console.log(
        `- ${sample.id}: [${sample.beforeCourses.join(' ; ')}]${beforeOther} -> [${sample.afterCourses.join(' ; ')}]${afterOther}`,
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