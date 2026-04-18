const normalizeSpace = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
const normalizeKey = (value) => normalizeSpace(value).toLowerCase();
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const toCellString = (value) => {
  if (value == null) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') {
    if (typeof value.text === 'string') return normalizeSpace(value.text);
    if (value.result != null) return toCellString(value.result);
    if (Array.isArray(value.richText)) {
      return normalizeSpace(value.richText.map((part) => String(part?.text || '')).join(''));
    }
  }
  return normalizeSpace(value);
};

const toDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'number') {
    const epoch = Date.UTC(1899, 11, 30);
    const date = new Date(epoch + value * 24 * 60 * 60 * 1000);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === 'object' && value.result != null) return toDate(value.result);
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toIsoDate = (value) => {
  const date = toDate(value);
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const splitValues = (rawValue, protectedPhrases = []) => {
  const raw = toCellString(rawValue);
  if (!raw) return [];

  const replacements = new Map();
  let text = raw;
  protectedPhrases.forEach((phrase, index) => {
    const token = `__PROTECTED_${index}__`;
    replacements.set(token, phrase);
    text = text.replace(new RegExp(escapeRegExp(phrase), 'gi'), token);
  });

  const seen = new Set();
  const output = [];
  text
    .split(/[;|,\n]/)
    .map((part) =>
      normalizeSpace(part).replace(/__PROTECTED_\d+__/g, (token) => replacements.get(token) || token),
    )
    .filter(Boolean)
    .forEach((part) => {
      const key = normalizeKey(part);
      if (!seen.has(key)) {
        seen.add(key);
        output.push(part);
      }
    });
  return output;
};

const toBoolean = (rawValue) => {
  const key = normalizeKey(rawValue);
  if (!key) return false;
  return key === 'yes' || key === 'true' || key === '1';
};

const parsePhone = (rawValue) => {
  const raw = toCellString(rawValue);
  if (!raw) return { phoneCountryCode: '', phoneNumber: '' };
  const tokens = raw.split(/\s+/).filter(Boolean);
  if (tokens.length > 1 && /^\+?\d{1,4}$/.test(tokens[0])) {
    const code = tokens[0].startsWith('+') ? tokens[0] : `+${tokens[0]}`;
    const number = tokens.slice(1).join('').replace(/[^\d]/g, '');
    return { phoneCountryCode: code, phoneNumber: number };
  }
  return { phoneCountryCode: '', phoneNumber: raw.replace(/[^\d]/g, '') };
};

module.exports = {
  normalizeSpace,
  normalizeKey,
  toCellString,
  toDate,
  toIsoDate,
  splitValues,
  toBoolean,
  parsePhone,
};
