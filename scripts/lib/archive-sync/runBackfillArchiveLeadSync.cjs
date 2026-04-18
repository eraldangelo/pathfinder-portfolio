#!/usr/bin/env node
const { admin, getFirestore } = require('../../config/firebase-admin-utils.cjs');
const { collectArchiveLeadsById, collectRootLeadById } = require('./collectors.cjs');
const { parseArgs } = require('./parseArgs.cjs');
const {
  collectStatusState,
  mirrorArchiveApplicationStatusesToRoot,
  mirrorRootApplicationStatusesToArchive,
  mirrorRootSubcollectionToArchive,
  syncApplications,
} = require('./syncMirrorPhases.cjs');
const { patchLeadCaseIdAndAssignments, patchLeadStatusesAndBaseline } = require('./syncLeadPhases.cjs');
const { createWriter } = require('./writer.cjs');

const main = async () => {
  const options = parseArgs();
  const db = getFirestore();
  const writer = createWriter(db, options.batchSize, options.apply);
  const now = Date.now();
  const sample = [];
  const stats = {
    archiveLeads: 0,
    rootCaseIdBackfilled: 0,
    rootAppsPatched: 0,
    archiveAppsPatched: 0,
    rootAppsMirroredFromArchive: 0,
    archiveAppsMirroredFromRoot: 0,
    archiveStatusMirroredFromRoot: 0,
    rootStatusMirroredFromArchive: 0,
    archiveNotesMirroredFromRoot: 0,
    archiveLogsMirroredFromRoot: 0,
    archiveBaselineStatusCreated: 0,
    archiveLeadStatusPatched: 0,
    rootLeadStatusPatched: 0,
    archiveLeadAssignmentPatched: 0,
    archiveCaseIdPatchedFromRoot: 0,
  };

  const archiveLeadsById = await collectArchiveLeadsById({ db, stats, now });
  const leadIds = Array.from(archiveLeadsById.keys());
  const rootLeadById = await collectRootLeadById({ db, leadIds });

  await patchLeadCaseIdAndAssignments({
    archiveLeadsById,
    rootLeadById,
    writer,
    db,
    stats,
  });

  const {
    rootStatusPathSet,
    archiveStatusPathSet,
    archiveHasAnyStatusLeadPath,
    latestApplicationStatusByLead,
    rootApplicationStatusDocs,
    archiveApplicationStatusDocs,
  } = await collectStatusState({ db });

  await mirrorRootApplicationStatusesToArchive({
    rootApplicationStatusDocs,
    archiveLeadsById,
    archiveStatusPathSet,
    archiveHasAnyStatusLeadPath,
    writer,
    db,
    stats,
  });

  await mirrorRootSubcollectionToArchive({
    collectionId: 'notes',
    archiveLeadsById,
    writer,
    db,
    stats,
    statsField: 'archiveNotesMirroredFromRoot',
  });

  await mirrorRootSubcollectionToArchive({
    collectionId: 'logs',
    archiveLeadsById,
    writer,
    db,
    stats,
    statsField: 'archiveLogsMirroredFromRoot',
  });

  await mirrorArchiveApplicationStatusesToRoot({
    archiveApplicationStatusDocs,
    rootStatusPathSet,
    writer,
    db,
    stats,
  });

  await syncApplications({
    archiveLeadsById,
    rootLeadById,
    writer,
    db,
    stats,
  });

  await patchLeadStatusesAndBaseline({
    archiveLeadsById,
    latestApplicationStatusByLead,
    rootLeadById,
    writer,
    db,
    admin,
    now,
    archiveHasAnyStatusLeadPath,
    stats,
    sample,
    sampleSize: options.sampleSize,
  });

  await writer.commit();

  console.log(`Mode: ${options.apply ? 'APPLY' : 'DRY RUN'}`);
  console.log(`Archive leads discovered: ${stats.archiveLeads}`);
  console.log(`Root caseId backfilled: ${stats.rootCaseIdBackfilled}`);
  console.log(`Root apps patched: ${stats.rootAppsPatched}`);
  console.log(`Archive apps patched: ${stats.archiveAppsPatched}`);
  console.log(`Archive apps mirrored from root: ${stats.archiveAppsMirroredFromRoot}`);
  console.log(`Root apps mirrored from archive: ${stats.rootAppsMirroredFromArchive}`);
  console.log(`Archive status mirrored from root: ${stats.archiveStatusMirroredFromRoot}`);
  console.log(`Root status mirrored from archive: ${stats.rootStatusMirroredFromArchive}`);
  console.log(`Archive notes mirrored from root: ${stats.archiveNotesMirroredFromRoot}`);
  console.log(`Archive logs mirrored from root: ${stats.archiveLogsMirroredFromRoot}`);
  console.log(`Archive baseline statuses created: ${stats.archiveBaselineStatusCreated}`);
  console.log(`Archive leadStatus patched: ${stats.archiveLeadStatusPatched}`);
  console.log(`Root leadStatus patched: ${stats.rootLeadStatusPatched}`);
  console.log(`Archive caseId patched from root: ${stats.archiveCaseIdPatchedFromRoot}`);
  console.log(`Archive lead assignment patched: ${stats.archiveLeadAssignmentPatched}`);
  console.log(`Committed writes: ${writer.getWrites()}`);
  console.log('\nSample:');
  sample.forEach((row) => console.log(`- ${row.year}/${row.leadId} | caseId=${row.caseId} | status=${row.targetStatus}`));
};

main().catch((error) => {
  console.error(`Archive sync backfill failed: ${error?.message || String(error)}`);
  process.exit(1);
});