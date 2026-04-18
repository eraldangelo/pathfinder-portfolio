const fs = require('node:fs');
const path = require('node:path');
const { normalizeKey } = require('./valueUtils.cjs');

const normalizePhoneForDuplicateKey = (phoneCountryCode, phoneNumber) => {
  const code = String(phoneCountryCode || '').replace(/[^\d]/g, '');
  const number = String(phoneNumber || '').replace(/[^\d]/g, '');
  if (!code && !number) return '';
  return `${code}|${number}`;
};

const buildDuplicateKey = ({ fullName, email, phoneCountryCode, phoneNumber }) => {
  const name = normalizeKey(fullName);
  const mail = normalizeKey(email);
  const phone = normalizePhoneForDuplicateKey(phoneCountryCode, phoneNumber);
  return `${name}__${mail}__${phone}`;
};

const resolveDuplicateReportPath = (rawPath) => {
  if (rawPath) return path.isAbsolute(rawPath) ? rawPath : path.resolve(process.cwd(), rawPath);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return path.join(process.cwd(), 'reports', `archive-import-duplicates-${stamp}.json`);
};

const ensureParentDir = (filePath) => {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
};

const collectExistingArchiveByDuplicateKey = async (db) => {
  const existingArchiveByDuplicateKey = new Map();
  const yearRefs = await db.collection('archives').listDocuments();
  for (const yearRef of yearRefs) {
    const leadsSnapshot = await yearRef.collection('leads').get();
    leadsSnapshot.docs.forEach((doc) => {
      const data = doc.data() || {};
      const fullName = String(data.fullName || data.name || '').trim();
      const email = String(data.email || data.emailAddress || '').trim().toLowerCase();
      const phoneCountryCode = String(data.phoneCountryCode || '').trim();
      const phoneNumber = String(data.phoneNumber || data.mobileNumber || '').trim();
      const duplicateKey = buildDuplicateKey({ fullName, email, phoneCountryCode, phoneNumber });
      const list = existingArchiveByDuplicateKey.get(duplicateKey) || [];
      list.push({
        path: doc.ref.path,
        id: doc.id,
        fullName,
        email,
        phoneCountryCode,
        phoneNumber,
      });
      existingArchiveByDuplicateKey.set(duplicateKey, list);
    });
  }
  return existingArchiveByDuplicateKey;
};

module.exports = {
  buildDuplicateKey,
  resolveDuplicateReportPath,
  ensureParentDir,
  collectExistingArchiveByDuplicateKey,
};
