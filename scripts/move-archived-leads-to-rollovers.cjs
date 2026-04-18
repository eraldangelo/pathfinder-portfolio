#!/usr/bin/env node
const { admin, getFirestore } = require('./config/firebase-admin-utils.cjs');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const options = {
    apply: false,
    dryRun: true,
    limit: Number.POSITIVE_INFINITY,
    pageSize: 200,
    batchSize: 350,
    sampleSize: 20,
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
      if (Number.isFinite(value) && value > 0) options.limit = value;
      continue;
    }
    if (arg.startsWith('--page-size=')) {
      const value = Number(arg.split('=')[1]);
      if (Number.isFinite(value) && value > 0) options.pageSize = Math.floor(value);
      continue;
    }
    if (arg.startsWith('--batch-size=')) {
      const value = Number(arg.split('=')[1]);
      if (Number.isFinite(value) && value > 0) options.batchSize = Math.floor(value);
      continue;
    }
    if (arg.startsWith('--sample-size=')) {
      const value = Number(arg.split('=')[1]);
      if (Number.isFinite(value) && value > 0) options.sampleSize = Math.floor(value);
      continue;
    }
  }

  return options;
};

const toDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === 'function') {
    try {
      return value.toDate();
    } catch {
      return null;
    }
  }
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const resolveArchiveYear = (data) => {
  const explicitYear = Number(data?.archivedYear);
  if (Number.isFinite(explicitYear) && explicitYear > 0) return String(explicitYear);
  const archivedAt = toDate(data?.archivedAt);
  if (archivedAt) return String(archivedAt.getFullYear());
  return 'unknown';
};

const createBatchWriter = (db, batchSize) => {
  let batch = db.batch();
  let pendingWrites = 0;
  let totalWrites = 0;

  const queueSet = async (ref, payload) => {
    batch.set(ref, payload, { merge: true });
    pendingWrites += 1;
    if (pendingWrites >= batchSize) await commit();
  };

  const commit = async () => {
    if (!pendingWrites) return;
    await batch.commit();
    totalWrites += pendingWrites;
    batch = db.batch();
    pendingWrites = 0;
  };

  return {
    queueSet,
    commit,
    getTotalWrites: () => totalWrites,
  };
};

const copyDocumentTree = async ({ sourceDoc, targetRef, writer, stats }) => {
  await writer.queueSet(targetRef, sourceDoc.data() || {});
  stats.copiedDocs += 1;

  const subcollections = await sourceDoc.ref.listCollections();
  for (const subcollection of subcollections) {
    const snapshot = await subcollection.get();
    for (const childDoc of snapshot.docs) {
      await copyDocumentTree({
        sourceDoc: childDoc,
        targetRef: targetRef.collection(subcollection.id).doc(childDoc.id),
        writer,
        stats,
      });
    }
  }
};

const topEntries = (map, limit = 20) =>
  Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

const main = async () => {
  const options = parseArgs();
  const db = getFirestore();
  const docIdField = admin.firestore.FieldPath.documentId();

  console.log('Move archived leads to yearly rollover storage started');
  console.log(`Mode: ${options.apply ? 'APPLY (writes enabled)' : 'DRY RUN (no writes)'}`);
  if (Number.isFinite(options.limit)) {
    console.log(`Limit: ${options.limit} archived leads`);
  }

  const writer = createBatchWriter(db, options.batchSize);
  const samples = [];
  const failures = [];
  const byYear = new Map();
  const stats = {
    archivedLeadsScanned: 0,
    archivedLeadsMoved: 0,
    copiedDocs: 0,
    sourceLeadsDeleted: 0,
  };

  let lastDoc = null;
  let stop = false;
  while (!stop) {
    let query = db.collection('leads').where('isArchived', '==', true).orderBy(docIdField).limit(options.pageSize);
    if (lastDoc) query = query.startAfter(lastDoc);
    const snapshot = await query.get();
    if (snapshot.empty) break;

    for (const leadDoc of snapshot.docs) {
      stats.archivedLeadsScanned += 1;
      if (stats.archivedLeadsScanned > options.limit) {
        stop = true;
        break;
      }

      const leadData = leadDoc.data() || {};
      const archiveYear = resolveArchiveYear(leadData);
      byYear.set(archiveYear, (byYear.get(archiveYear) || 0) + 1);

      if (samples.length < options.sampleSize) {
        samples.push(`${leadDoc.id} -> years/${archiveYear}/leads/${leadDoc.id}`);
      }
      if (!options.apply) continue;

      try {
        const targetRef = db
          .collection('archives')
          .doc(archiveYear)
          .collection('leads')
          .doc(leadDoc.id);
        await copyDocumentTree({ sourceDoc: leadDoc, targetRef, writer, stats });
        await writer.commit();
        await db.recursiveDelete(leadDoc.ref);
        stats.sourceLeadsDeleted += 1;
        stats.archivedLeadsMoved += 1;
      } catch (error) {
        failures.push(`${leadDoc.id}: ${error?.message || String(error)}`);
      }
    }

    lastDoc = snapshot.docs[snapshot.docs.length - 1];
  }

  await writer.commit();

  console.log('\nSummary');
  console.log(`- Archived leads scanned: ${stats.archivedLeadsScanned}`);
  console.log(`- Archived leads moved: ${stats.archivedLeadsMoved}`);
  console.log(`- Source archived leads deleted: ${stats.sourceLeadsDeleted}`);
  console.log(`- Total copied docs (incl. subcollections): ${stats.copiedDocs}`);
  console.log(`- Batched writes committed: ${writer.getTotalWrites()}`);

  const yearRows = topEntries(byYear, 50);
  if (yearRows.length > 0) {
    console.log('\nArchived leads by year');
    for (const [year, count] of yearRows) {
      console.log(`- ${year}: ${count}`);
    }
  }

  if (samples.length > 0) {
    console.log('\nSample moves');
    for (const sample of samples) console.log(`- ${sample}`);
  }

  if (failures.length > 0) {
    console.log('\nFailures');
    for (const failure of failures.slice(0, 50)) console.log(`- ${failure}`);
    if (failures.length > 50) {
      console.log(`- ... and ${failures.length - 50} more`);
    }
  }

  if (options.dryRun) {
    console.log('\nDry run complete. Re-run with --apply to execute move.');
  } else {
    console.log('\nMove complete.');
  }

  if (failures.length > 0) {
    process.exitCode = 1;
  }
};

main().catch((error) => {
  console.error(`Move failed: ${error.message || String(error)}`);
  process.exit(1);
});
