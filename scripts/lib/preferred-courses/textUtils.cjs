const { GENERIC_OTHER_TOKENS } = require('./constants.cjs');

const normalizeSpace = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();

const normalizeKey = (value) =>
  normalizeSpace(value)
    .toLowerCase()
    .replace(/[â€™]/g, "'");

const normalizeLooseKey = (value) =>
  normalizeKey(value)
    .replace(/[^a-z0-9']+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const isGenericOtherValue = (value) => GENERIC_OTHER_TOKENS.has(normalizeKey(value));

const toStringArray = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeSpace(item)).filter(Boolean);
  }
  if (typeof value === 'string') {
    const trimmed = normalizeSpace(value);
    return trimmed ? [trimmed] : [];
  }
  return [];
};

const toOptionalString = (value) => {
  const trimmed = normalizeSpace(value);
  return trimmed || null;
};

const uniquePush = (targetArray, seenSet, value) => {
  const normalized = normalizeSpace(value);
  const key = normalizeKey(normalized);
  if (!normalized || seenSet.has(key)) return;
  seenSet.add(key);
  targetArray.push(normalized);
};

const normalizeBranchKey = (value) => normalizeKey(value);

const arraysEqual = (left, right) => {
  if (left.length !== right.length) return false;
  for (let i = 0; i < left.length; i += 1) {
    if (left[i] !== right[i]) return false;
  }
  return true;
};

const topEntries = (map, limit = 15) =>
  Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

module.exports = {
  normalizeSpace,
  normalizeKey,
  normalizeLooseKey,
  isGenericOtherValue,
  toStringArray,
  toOptionalString,
  uniquePush,
  normalizeBranchKey,
  arraysEqual,
  topEntries,
};
