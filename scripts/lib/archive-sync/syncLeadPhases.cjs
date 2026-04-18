const { trim } = require('./utils.cjs');

const patchLeadCaseIdAndAssignments = async ({
  archiveLeadsById,
  rootLeadById,
  writer,
  db,
  stats,
}) => {
  const leadIds = Array.from(archiveLeadsById.keys());
  for (const leadId of leadIds) {
    const archiveLead = archiveLeadsById.get(leadId);
    const rootData = rootLeadById.get(leadId) || {};
    const rootCaseId = trim(rootData?.caseId);

    if (archiveLead.caseId && !rootCaseId) {
      await writer.queueSet(db.collection('leads').doc(leadId), { caseId: archiveLead.caseId });
      stats.rootCaseIdBackfilled += 1;
    }

    if (!archiveLead.caseId && rootCaseId) {
      await writer.queueSet(archiveLead.ref, { caseId: rootCaseId });
      archiveLead.caseId = rootCaseId;
      stats.archiveCaseIdPatchedFromRoot += 1;
    }

    const rootAssignedUid = trim(rootData?.assignedCounsellorUid);
    const rootAssignedName = trim(rootData?.assignedCounsellor);
    const archiveLeadData = (await archiveLead.ref.get()).data() || {};
    const archiveAssignedUid = trim(archiveLeadData.assignedCounsellorUid);
    const archiveAssignedName = trim(archiveLeadData.assignedCounsellor);
    const assignmentPatch = {};

    if (!archiveAssignedUid && rootAssignedUid) assignmentPatch.assignedCounsellorUid = rootAssignedUid;
    if (!archiveAssignedName && rootAssignedName) assignmentPatch.assignedCounsellor = rootAssignedName;
    if (Object.keys(assignmentPatch).length > 0) {
      await writer.queueSet(archiveLead.ref, assignmentPatch);
      stats.archiveLeadAssignmentPatched += 1;
    }
  }
};

const patchLeadStatusesAndBaseline = async ({
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
  sampleSize,
}) => {
  for (const archiveLead of archiveLeadsById.values()) {
    const latestAppStatus = latestApplicationStatusByLead.get(archiveLead.leadId)?.status || '';
    const targetStatus = latestAppStatus || 'Archived';

    if (archiveLead.leadStatus !== targetStatus) {
      await writer.queueSet(archiveLead.ref, { leadStatus: targetStatus });
      stats.archiveLeadStatusPatched += 1;
    }

    const rootData = rootLeadById.get(archiveLead.leadId) || {};
    if (trim(rootData?.leadStatus) !== targetStatus) {
      await writer.queueSet(db.collection('leads').doc(archiveLead.leadId), { leadStatus: targetStatus });
      stats.rootLeadStatusPatched += 1;
    }

    if (!archiveHasAnyStatusLeadPath.has(archiveLead.path)) {
      const timestamp = admin.firestore.Timestamp.fromMillis(archiveLead.archivedAtMillis || now);
      const statusId = `${new Date(archiveLead.archivedAtMillis || now).toISOString()}-status-archived-backfill`;
      await writer.queueSet(archiveLead.ref.collection('status').doc(statusId), {
        id: statusId,
        status: 'Archived',
        source: 'system',
        author: 'System User',
        authorUid: null,
        notes: 'Backfilled archive baseline status',
        timestamp,
      });
      stats.archiveBaselineStatusCreated += 1;
    }

    if (sample.length < sampleSize) {
      sample.push({
        leadId: archiveLead.leadId,
        year: archiveLead.year,
        targetStatus,
        caseId: archiveLead.caseId || '(empty)',
      });
    }
  }
};

module.exports = {
  patchLeadCaseIdAndAssignments,
  patchLeadStatusesAndBaseline,
};
