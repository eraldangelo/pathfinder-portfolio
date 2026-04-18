const normalizeStaffName = (value?: string | null) =>
  String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();

const EXCLUDED_TOP_STAFF_REFERRER_NAMES = new Set(
  [
    'Odelon Marlon Tang',
    'Renan Jubilo',
    'Hyungchul Lee',
  ].map((name) => normalizeStaffName(name)),
);

export const isExcludedTopStaffReferrerName = (name?: string | null) =>
  EXCLUDED_TOP_STAFF_REFERRER_NAMES.has(normalizeStaffName(name));
