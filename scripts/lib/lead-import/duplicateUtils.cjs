const fs = require('node:fs');
const path = require('node:path');
const {
  toCellString,
  buildDuplicateKey,
  buildNameEmailKey,
  buildNamePhoneKey,
  resolveDuplicateReportPath,
} = require('./utils.cjs');

const ensureParentDir = (filePath) => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const addDocToDuplicateIndexes = ({ doc, byDuplicateKey, byNameEmailKey, byNamePhoneKey }) => {
  const data = doc.data() || {};
  const fullName = toCellString(data.fullName || data.name);
  const phoneCountryCode = toCellString(data.phoneCountryCode);
  const phoneNumber = toCellString(data.phoneNumber || data.mobileNumber);
  const email = toCellString(data.email || data.emailAddress).toLowerCase();
  const duplicateKey = buildDuplicateKey({
    fullName,
    email,
    phoneCountryCode,
    phoneNumber,
  });
  if (!duplicateKey.replace(/\|/g, '').trim()) return;

  const existing = byDuplicateKey.get(duplicateKey) || [];
  existing.push({ id: doc.id, path: doc.ref.path });
  byDuplicateKey.set(duplicateKey, existing);

  const nameEmailKey = buildNameEmailKey({
    fullName,
    email,
  });
  const existingNameEmail = byNameEmailKey.get(nameEmailKey) || [];
  existingNameEmail.push({ id: doc.id, path: doc.ref.path });
  byNameEmailKey.set(nameEmailKey, existingNameEmail);

  const namePhoneKey = buildNamePhoneKey({
    fullName,
    phoneCountryCode,
    phoneNumber,
  });
  const existingNamePhone = byNamePhoneKey.get(namePhoneKey) || [];
  existingNamePhone.push({ id: doc.id, path: doc.ref.path });
  byNamePhoneKey.set(namePhoneKey, existingNamePhone);
};

const collectExistingLeadsByDuplicateKey = async (db) => {
  const byDuplicateKey = new Map();
  const byNameEmailKey = new Map();
  const byNamePhoneKey = new Map();

  // Current/live leads
  const snapshot = await db
    .collection('leads')
    .select('fullName', 'email', 'emailAddress', 'phoneCountryCode', 'phoneNumber', 'mobileNumber')
    .get();

  snapshot.docs.forEach((doc) => {
    addDocToDuplicateIndexes({ doc, byDuplicateKey, byNameEmailKey, byNamePhoneKey });
  });

  // Archived leads (archives/{year}/leads/{leadId})
  const yearRefs = await db.collection('archives').listDocuments();
  for (const yearRef of yearRefs) {
    const archivedSnapshot = await yearRef
      .collection('leads')
      .select('fullName', 'name', 'email', 'emailAddress', 'phoneCountryCode', 'phoneNumber', 'mobileNumber')
      .get();
    archivedSnapshot.docs.forEach((doc) => {
      addDocToDuplicateIndexes({ doc, byDuplicateKey, byNameEmailKey, byNamePhoneKey });
    });
  }

  return { byDuplicateKey, byNameEmailKey, byNamePhoneKey };
};

const buildDuplicateEntries = ({
  importRowsByDuplicateKey,
  existingByDuplicateKey,
  existingByNameEmailKey,
  existingByNamePhoneKey,
}) => {
  const entries = [];

  importRowsByDuplicateKey.forEach((rows, duplicateKey) => {
    const existingDocs = existingByDuplicateKey.get(duplicateKey) || [];
    const first = rows[0];
    const nameEmailKey = buildNameEmailKey({
      fullName: first.payload.fullName,
      email: first.payload.email,
    });
    const namePhoneKey = buildNamePhoneKey({
      fullName: first.payload.fullName,
      phoneCountryCode: first.payload.phoneCountryCode,
      phoneNumber: first.payload.phoneNumber,
    });
    const existingByNameEmail = existingByNameEmailKey.get(nameEmailKey) || [];
    const existingByNamePhone = existingByNamePhoneKey.get(namePhoneKey) || [];
    if (
      rows.length <= 1 &&
      existingDocs.length === 0 &&
      existingByNameEmail.length === 0 &&
      existingByNamePhone.length === 0
    ) return;

    entries.push({
      duplicateKey,
      fullName: first.payload.fullName,
      email: first.payload.email,
      phoneCountryCode: first.payload.phoneCountryCode,
      phoneNumber: first.payload.phoneNumber,
      importCount: rows.length,
      importRows: rows.map((row) => row.rowNumber),
      existingCount: existingDocs.length,
      existingPaths: existingDocs.map((doc) => doc.path),
      existingNameEmailCount: existingByNameEmail.length,
      existingNameEmailPaths: existingByNameEmail.map((doc) => doc.path),
      existingNamePhoneCount: existingByNamePhone.length,
      existingNamePhonePaths: existingByNamePhone.map((doc) => doc.path),
    });
  });

  entries.sort((a, b) => {
    const scoreA = a.importCount + a.existingCount;
    const scoreB = b.importCount + b.existingCount;
    if (scoreA !== scoreB) return scoreB - scoreA;
    return a.fullName.localeCompare(b.fullName);
  });

  return entries;
};

const writeDuplicateReport = ({
  duplicateReport,
  sourceFile,
  sheet,
  mode,
  stats,
  duplicateEntries,
}) => {
  const reportPath = resolveDuplicateReportPath(duplicateReport);
  ensureParentDir(reportPath);

  fs.writeFileSync(
    reportPath,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        sourceFile,
        sheet,
        mode,
        stats,
        duplicateCount: duplicateEntries.length,
        duplicates: duplicateEntries,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  return reportPath;
};

module.exports = {
  collectExistingLeadsByDuplicateKey,
  buildDuplicateEntries,
  writeDuplicateReport,
};
