const normalizeSpace = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
const normalizeKey = (value) => normalizeSpace(value).toLowerCase().replace(/[â€™]/g, "'");
const normalizeLooseKey = (value) =>
  normalizeKey(value)
    .replace(/[^a-z0-9']+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const matchesAny = (value, patterns) => patterns.some((pattern) => pattern.test(value));

const splitOtherValues = (value) =>
  String(value ?? '')
    .split(/[;|\n]/)
    .map((item) => normalizeSpace(item))
    .filter(Boolean);

const normalizeBranchKey = (value) => normalizeKey(value);

const arraysEqual = (left, right) => {
  if (left.length !== right.length) return false;
  for (let i = 0; i < left.length; i += 1) {
    if (left[i] !== right[i]) return false;
  }
  return true;
};

const topEntries = (map, limit = 20) =>
  Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

module.exports = {
  normalizeSpace,
  normalizeKey,
  normalizeLooseKey,
  matchesAny,
  splitOtherValues,
  normalizeBranchKey,
  arraysEqual,
  topEntries,
};
