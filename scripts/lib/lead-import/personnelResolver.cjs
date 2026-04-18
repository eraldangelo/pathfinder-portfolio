const { normalizeKey, normalizeLooseKey, normalizeSpace } = require('../lead-sources/textUtils.cjs');

const normalizeRole = (value) => normalizeKey(value);

const buildAlias = (value) => normalizeLooseKey(value).replace(/^sir\s+/i, '').trim();

const buildPersonnelDirectory = async (db) => {
  const snapshot = await db.collection('personnel').get();
  const personnel = [];

  snapshot.docs.forEach((doc) => {
    const data = doc.data() || {};
    const name = normalizeSpace(data.name || data.displayName || `${data.firstName || ''} ${data.lastName || ''}`);
    if (!name) return;
    const preferredName = normalizeSpace(data.preferredName || data.nickname || '');
    const role = normalizeRole(data.role);
    const branch = normalizeSpace(data.branch);
    personnel.push({
      uid: doc.id,
      name,
      preferredName,
      role,
      branch,
    });
  });

  const byNameKey = new Map();
  const byAliasKey = new Map();
  const byUid = new Map();
  const branchAdmin = new Map();

  personnel.forEach((person) => {
    byUid.set(person.uid, person);
    const nameKey = normalizeLooseKey(person.name);
    if (nameKey && !byNameKey.has(nameKey)) byNameKey.set(nameKey, person);

    const aliases = new Set();
    aliases.add(person.name);
    if (person.preferredName) aliases.add(person.preferredName);

    aliases.forEach((alias) => {
      const aliasKey = buildAlias(alias);
      if (!aliasKey) return;
      if (!byAliasKey.has(aliasKey)) {
        byAliasKey.set(aliasKey, person);
      }
    });

    if (person.role === 'administrative staff' && person.branch) {
      const branchKey = normalizeLooseKey(person.branch);
      if (branchKey && !branchAdmin.has(branchKey)) {
        branchAdmin.set(branchKey, person);
      }
    }
  });

  return {
    personnel,
    byUid,
    byNameKey,
    byAliasKey,
    branchAdmin,
  };
};

const resolvePersonByHint = (hint, directory) => {
  const cleaned = normalizeSpace(hint);
  if (!cleaned) return null;
  const alias = buildAlias(cleaned);
  if (!alias) return null;
  const byAlias = directory.byAliasKey.get(alias);
  if (byAlias) return byAlias;
  const byName = directory.byNameKey.get(normalizeLooseKey(cleaned));
  if (byName) return byName;
  return null;
};

const stripEndorsedPrefix = (value) => {
  const cleaned = normalizeSpace(value);
  if (!cleaned) return '';
  const split = cleaned.split('-');
  if (split.length >= 2) {
    return normalizeSpace(split.slice(1).join('-'));
  }
  return cleaned;
};

const resolveEndorsedCounsellor = (endorsedRaw, directory) => {
  const cleaned = normalizeSpace(endorsedRaw);
  if (!cleaned) return { assignedCounsellor: '', assignedCounsellorUid: '' };

  const candidates = [
    cleaned,
    stripEndorsedPrefix(cleaned),
  ];

  for (const candidate of candidates) {
    const person = resolvePersonByHint(candidate, directory);
    if (person) {
      return { assignedCounsellor: person.name, assignedCounsellorUid: person.uid };
    }
  }

  return {
    assignedCounsellor: stripEndorsedPrefix(cleaned) || cleaned,
    assignedCounsellorUid: '',
  };
};

const findPersonByRemarks = (remarks, directory, preferredAssignedUid) => {
  const text = normalizeLooseKey(remarks);
  if (!text) return null;

  const matches = [];
  directory.personnel.forEach((person) => {
    const aliases = [person.name, person.preferredName].map((value) => buildAlias(value)).filter(Boolean);
    const hit = aliases.some((alias) => text.includes(alias));
    if (hit) matches.push(person);
  });

  if (matches.length === 0) return null;
  if (preferredAssignedUid) {
    const byAssigned = matches.find((person) => person.uid === preferredAssignedUid);
    if (byAssigned) return byAssigned;
  }
  if (matches.length === 1) return matches[0];
  const exactPreferred = matches.find((person) => {
    const alias = buildAlias(person.preferredName);
    return alias && new RegExp(`\\b${alias}\\b`, 'i').test(text);
  });
  return exactPreferred || matches[0];
};

const resolvePersonalLeadReferrer = ({
  leadName,
  adminRemarks,
  counsellorNotes,
  assignedCounsellorUid,
  assignedCounsellor,
  directory,
}) => {
  const remarks = normalizeSpace(adminRemarks);
  const notes = normalizeSpace(counsellorNotes);
  const context = [remarks, notes].filter(Boolean).join(' | ');
  if (!context) return null;

  const remarksKey = normalizeLooseKey(context);
  const looksPersonalLead =
    remarksKey.includes('personal lead')
    || remarksKey.includes('personal leads')
    || remarksKey.includes('era leads');

  if (!looksPersonalLead) return null;

  const leadNameKey = normalizeLooseKey(leadName);
  if (leadNameKey && remarksKey.includes('era leads')) {
    const byLeadName = resolvePersonByHint(leadName, directory);
    if (byLeadName) return byLeadName;
  }

  const byRemarks = findPersonByRemarks(context, directory, assignedCounsellorUid);
  if (byRemarks) return byRemarks;

  if (assignedCounsellorUid) {
    const byUid = directory.byUid.get(assignedCounsellorUid);
    if (byUid) return byUid;
  }

  if (assignedCounsellor) {
    const byAssigned = resolvePersonByHint(assignedCounsellor, directory);
    if (byAssigned) return byAssigned;
  }

  return null;
};

const resolveAdminAuthorByBranch = (branch, directory) => {
  const branchKey = normalizeLooseKey(branch);
  if (!branchKey) return null;
  return directory.branchAdmin.get(branchKey) || null;
};

module.exports = {
  buildPersonnelDirectory,
  resolveEndorsedCounsellor,
  resolvePersonalLeadReferrer,
  resolveAdminAuthorByBranch,
};
