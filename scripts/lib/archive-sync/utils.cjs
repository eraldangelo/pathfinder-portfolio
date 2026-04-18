const trim = (value) => String(value || '').trim();

const toMillis = (value) => {
  if (!value) return 0;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? 0 : value.getTime();
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value.toDate === 'function') {
    const parsed = value.toDate();
    return parsed instanceof Date && !Number.isNaN(parsed.getTime()) ? parsed.getTime() : 0;
  }
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
};

const chunk = (items, size) => {
  const output = [];
  for (let i = 0; i < items.length; i += size) output.push(items.slice(i, i + size));
  return output;
};

const parseScopedPath = (path, collectionId) => {
  const segments = String(path || '').split('/').filter(Boolean);
  if (segments.length === 4 && segments[0] === 'leads' && segments[2] === collectionId) {
    return { scope: 'root', leadId: segments[1], year: null, docId: segments[3] };
  }
  if (
    segments.length === 6
    && segments[0] === 'archives'
    && segments[2] === 'leads'
    && segments[4] === collectionId
  ) {
    return { scope: 'archive', leadId: segments[3], year: segments[1], docId: segments[5] };
  }
  return null;
};

module.exports = {
  trim,
  toMillis,
  chunk,
  parseScopedPath,
};
