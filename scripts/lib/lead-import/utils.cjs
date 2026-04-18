const path = require('node:path');
const { normalizeSpace, normalizeKey } = require('../lead-sources/textUtils.cjs');

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
  if (typeof value.toDate === 'function') {
    try {
      const date = value.toDate();
      return Number.isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  }
  if (typeof value === 'number') {
    const epoch = Date.UTC(1899, 11, 30);
    const date = new Date(epoch + value * 24 * 60 * 60 * 1000);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === 'object' && value.result != null) return toDate(value.result);
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const indexHeaders = (worksheet) => {
  const values = worksheet.getRow(1).values.slice(1).map((value) => toCellString(value));
  const map = new Map();
  values.forEach((value, index) => {
    map.set(normalizeKey(value), index + 1);
  });
  return map;
};

const resolveHeaderColumn = (headerMap, headerOrHeaders) => {
  const headers = Array.isArray(headerOrHeaders) ? headerOrHeaders : [headerOrHeaders];
  for (const header of headers) {
    const key = normalizeKey(header);
    if (headerMap.has(key)) return headerMap.get(key);
  }
  return null;
};

const formatHeaderLabel = (headerOrHeaders) => {
  if (Array.isArray(headerOrHeaders)) return headerOrHeaders.join(' OR ');
  return String(headerOrHeaders || '');
};

const toIsoDate = (value) => {
  const date = toDate(value);
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const normalizeBranch = (value) => {
  const key = normalizeKey(value);
  if (!key) return '';
  if (key === 'makati') return 'Manila';
  return normalizeSpace(value);
};

const monthStampFromDate = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const mon = date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
  return `${month}-${year} (${mon})`;
};

const phoneDigits = (value) => String(value || '').replace(/[^\d]/g, '');

const normalizePhoneForDuplicateKey = (phoneCountryCode, phoneNumber) => {
  const code = phoneDigits(phoneCountryCode);
  let number = phoneDigits(phoneNumber);
  if (!code && !number) return '';

  if (code) {
    if (number.startsWith(code)) number = number.slice(code.length);
    if (number.startsWith('0')) number = number.slice(1);
    return `${code}${number}`;
  }

  if (number.startsWith('0') && number.length === 11) {
    return `63${number.slice(1)}`;
  }
  if (number.length === 10 && number.startsWith('9')) {
    return `63${number}`;
  }
  return number;
};

const buildDuplicateKey = ({ fullName, email, phoneCountryCode, phoneNumber }) => {
  const nameKey = normalizeKey(fullName);
  const emailKey = normalizeKey(email);
  const phoneKey = normalizePhoneForDuplicateKey(phoneCountryCode, phoneNumber);
  return `${nameKey}|${emailKey}|${phoneKey}`;
};

const buildNameEmailKey = ({ fullName, email }) => {
  const nameKey = normalizeKey(fullName);
  const emailKey = normalizeKey(email);
  return `${nameKey}|${emailKey}`;
};

const buildNamePhoneKey = ({ fullName, phoneCountryCode, phoneNumber }) => {
  const nameKey = normalizeKey(fullName);
  const phoneKey = normalizePhoneForDuplicateKey(phoneCountryCode, phoneNumber);
  return `${nameKey}|${phoneKey}`;
};

const resolveDuplicateReportPath = (customPath) => {
  if (customPath && String(customPath).trim()) {
    const value = String(customPath).trim();
    return path.isAbsolute(value) ? value : path.resolve(process.cwd(), value);
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return path.join(process.cwd(), 'reports', `lead-import-duplicates-${stamp}.json`);
};

module.exports = {
  toCellString,
  toDate,
  toIsoDate,
  indexHeaders,
  resolveHeaderColumn,
  formatHeaderLabel,
  normalizeKey,
  normalizeBranch,
  monthStampFromDate,
  buildDuplicateKey,
  buildNameEmailKey,
  buildNamePhoneKey,
  resolveDuplicateReportPath,
};
