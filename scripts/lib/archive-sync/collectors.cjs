const { chunk, toMillis, trim } = require('./utils.cjs');

const collectArchiveLeadsById = async ({ db, stats, now }) => {
  const archiveLeadsById = new Map();
  const yearRefs = await db.collection('archives').listDocuments();
  for (const yearRef of yearRefs) {
    const year = trim(yearRef.id);
    const leadsSnapshot = await yearRef.collection('leads').get();
    stats.archiveLeads += leadsSnapshot.size;

    leadsSnapshot.docs.forEach((leadDoc) => {
      const data = leadDoc.data() || {};
      const existing = archiveLeadsById.get(leadDoc.id);
      const incoming = {
        leadId: leadDoc.id,
        year,
        path: leadDoc.ref.path,
        ref: leadDoc.ref,
        caseId: trim(data.caseId),
        leadStatus: trim(data.leadStatus),
        archivedAtMillis: toMillis(data.archivedAt || data.createdAt || now) || now,
      };
      if (!existing || Number(incoming.year) > Number(existing.year)) {
        archiveLeadsById.set(leadDoc.id, incoming);
      }
    });
  }
  return archiveLeadsById;
};

const collectRootLeadById = async ({ db, leadIds }) => {
  const rootLeadById = new Map();
  for (const ids of chunk(leadIds, 300)) {
    const refs = ids.map((leadId) => db.collection('leads').doc(leadId));
    const snapshots = await db.getAll(...refs);
    snapshots.forEach((snapshot) => {
      rootLeadById.set(snapshot.id, snapshot.exists ? (snapshot.data() || {}) : null);
    });
  }
  return rootLeadById;
};

module.exports = {
  collectArchiveLeadsById,
  collectRootLeadById,
};
