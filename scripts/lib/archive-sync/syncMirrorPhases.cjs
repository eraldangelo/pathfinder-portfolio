const { parseScopedPath, toMillis, trim } = require('./utils.cjs');

const collectStatusState = async ({ db }) => {
  const rootStatusPathSet = new Set();
  const archiveStatusPathSet = new Set();
  const archiveHasAnyStatusLeadPath = new Set();
  const latestApplicationStatusByLead = new Map();
  const rootApplicationStatusDocs = [];
  const archiveApplicationStatusDocs = [];

  const statusSnapshot = await db.collectionGroup('status').get();
  statusSnapshot.docs.forEach((doc) => {
    const parsed = parseScopedPath(doc.ref.path, 'status');
    if (!parsed) return;
    const data = doc.data() || {};
    const millis = toMillis(data.timestamp);
    const source = trim(data.source).toLowerCase();
    const status = trim(data.status);

    if (parsed.scope === 'root') rootStatusPathSet.add(doc.ref.path);
    if (parsed.scope === 'archive') {
      archiveStatusPathSet.add(doc.ref.path);
      archiveHasAnyStatusLeadPath.add(`archives/${parsed.year}/leads/${parsed.leadId}`);
    }
    if (source === 'application' && status) {
      const current = latestApplicationStatusByLead.get(parsed.leadId);
      if (!current || millis > current.millis) {
        latestApplicationStatusByLead.set(parsed.leadId, { status, millis });
      }
      if (parsed.scope === 'root') rootApplicationStatusDocs.push(doc);
      if (parsed.scope === 'archive') archiveApplicationStatusDocs.push(doc);
    }
  });

  return {
    rootStatusPathSet,
    archiveStatusPathSet,
    archiveHasAnyStatusLeadPath,
    latestApplicationStatusByLead,
    rootApplicationStatusDocs,
    archiveApplicationStatusDocs,
  };
};

const mirrorRootApplicationStatusesToArchive = async ({
  rootApplicationStatusDocs,
  archiveLeadsById,
  archiveStatusPathSet,
  archiveHasAnyStatusLeadPath,
  writer,
  db,
  stats,
}) => {
  for (const doc of rootApplicationStatusDocs) {
    const parsed = parseScopedPath(doc.ref.path, 'status');
    const archiveLead = archiveLeadsById.get(parsed?.leadId || '');
    if (!parsed || !archiveLead) continue;
    const targetPath = `${archiveLead.path}/status/${parsed.docId}`;
    if (archiveStatusPathSet.has(targetPath)) continue;
    await writer.queueSet(db.doc(targetPath), doc.data() || {});
    archiveStatusPathSet.add(targetPath);
    archiveHasAnyStatusLeadPath.add(archiveLead.path);
    stats.archiveStatusMirroredFromRoot += 1;
  }
};

const mirrorRootSubcollectionToArchive = async ({
  collectionId,
  archiveLeadsById,
  writer,
  db,
  stats,
  statsField,
}) => {
  const snapshot = await db.collectionGroup(collectionId).get();
  const archivePathSet = new Set();
  const rootDocs = [];

  snapshot.docs.forEach((doc) => {
    const parsed = parseScopedPath(doc.ref.path, collectionId);
    if (!parsed) return;
    if (parsed.scope === 'archive') {
      archivePathSet.add(doc.ref.path);
      return;
    }
    rootDocs.push(doc);
  });

  for (const doc of rootDocs) {
    const parsed = parseScopedPath(doc.ref.path, collectionId);
    const archiveLead = archiveLeadsById.get(parsed?.leadId || '');
    if (!parsed || !archiveLead) continue;
    const targetPath = `${archiveLead.path}/${collectionId}/${parsed.docId}`;
    if (archivePathSet.has(targetPath)) continue;
    await writer.queueSet(db.doc(targetPath), doc.data() || {});
    archivePathSet.add(targetPath);
    stats[statsField] += 1;
  }
};

const mirrorArchiveApplicationStatusesToRoot = async ({
  archiveApplicationStatusDocs,
  rootStatusPathSet,
  writer,
  db,
  stats,
}) => {
  for (const doc of archiveApplicationStatusDocs) {
    const parsed = parseScopedPath(doc.ref.path, 'status');
    if (!parsed) continue;
    const targetPath = `leads/${parsed.leadId}/status/${parsed.docId}`;
    if (rootStatusPathSet.has(targetPath)) continue;
    await writer.queueSet(db.doc(targetPath), doc.data() || {});
    rootStatusPathSet.add(targetPath);
    stats.rootStatusMirroredFromArchive += 1;
  }
};

const syncApplications = async ({
  archiveLeadsById,
  rootLeadById,
  writer,
  db,
  stats,
}) => {
  const applicationSnapshot = await db.collectionGroup('applications').get();
  for (const appDoc of applicationSnapshot.docs) {
    const parsed = parseScopedPath(appDoc.ref.path, 'applications');
    if (!parsed) continue;
    const appData = appDoc.data() || {};
    const archiveLead = archiveLeadsById.get(parsed.leadId);
    if (!archiveLead) continue;

    const rootCaseId = trim(rootLeadById.get(parsed.leadId)?.caseId);
    const desiredCaseId = trim(appData.caseId) || archiveLead.caseId || rootCaseId;
    const desiredLeadDocPath = archiveLead.path;

    if (parsed.scope === 'root') {
      const patch = {};
      if (desiredCaseId && !trim(appData.caseId)) patch.caseId = desiredCaseId;
      if (trim(appData.leadDocPath) !== desiredLeadDocPath) patch.leadDocPath = desiredLeadDocPath;
      if (Object.keys(patch).length > 0) {
        await writer.queueSet(appDoc.ref, patch);
        stats.rootAppsPatched += 1;
      }
      const archiveAppRef = db.doc(`${desiredLeadDocPath}/applications/${parsed.docId}`);
      await writer.queueSet(archiveAppRef, { ...appData, ...patch, caseId: desiredCaseId || null, leadDocPath: desiredLeadDocPath });
      stats.archiveAppsMirroredFromRoot += 1;
      continue;
    }

    const archivePatch = {};
    if (desiredCaseId && !trim(appData.caseId)) archivePatch.caseId = desiredCaseId;
    if (trim(appData.leadDocPath) !== desiredLeadDocPath) archivePatch.leadDocPath = desiredLeadDocPath;
    if (Object.keys(archivePatch).length > 0) {
      await writer.queueSet(appDoc.ref, archivePatch);
      stats.archiveAppsPatched += 1;
    }
    const rootAppRef = db.doc(`leads/${parsed.leadId}/applications/${parsed.docId}`);
    await writer.queueSet(rootAppRef, { ...appData, ...archivePatch, caseId: desiredCaseId || null, leadDocPath: desiredLeadDocPath });
    stats.rootAppsMirroredFromArchive += 1;
  }
};

module.exports = {
  collectStatusState,
  mirrorRootApplicationStatusesToArchive,
  mirrorRootSubcollectionToArchive,
  mirrorArchiveApplicationStatusesToRoot,
  syncApplications,
};
