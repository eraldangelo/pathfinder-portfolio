const createWriter = (db, batchSize, enabled) => {
  let batch = db.batch();
  let queued = 0;
  let writes = 0;

  const queueSet = async (ref, payload) => {
    if (!enabled) return;
    batch.set(ref, payload, { merge: true });
    queued += 1;
    if (queued >= batchSize) await commit();
  };

  const commit = async () => {
    if (!enabled || queued === 0) return;
    await batch.commit();
    writes += queued;
    queued = 0;
    batch = db.batch();
  };

  return { queueSet, commit, getWrites: () => writes };
};

module.exports = {
  createWriter,
};
