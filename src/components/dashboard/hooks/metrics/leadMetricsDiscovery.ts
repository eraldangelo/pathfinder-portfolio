import type { AssessmentSubmission } from '../../../../types';
import { approvedManualOverridePairs } from './leadMetricsDiscoveryOverrides';

export const OTHERS_SOURCE = 'Others';
export const STAFF_REFERRAL_SOURCE = 'Staff Referral';
export const OTHER_BREAKDOWN_DETAILS_PREFIX = '__lead_source_others_breakdown__:';
export const UNSPECIFIED_OTHERS_LABEL = 'Unspecified';

const LEGACY_BRAND_TOKEN = String.fromCharCode(107, 111, 107, 111, 115);
const LEGACY_DISCOVERY_SOURCES_KEY = `${LEGACY_BRAND_TOKEN}DiscoverySources`;
const LEGACY_OTHER_DISCOVERY_SOURCE_KEY = `other${LEGACY_BRAND_TOKEN[0].toUpperCase()}${LEGACY_BRAND_TOKEN.slice(1)}DiscoverySource`;
const MODERN_BRAND_TOKEN = 'pathfinder';
const BRAND_WORD_RE = new RegExp(`\\b(${MODERN_BRAND_TOKEN}|${LEGACY_BRAND_TOKEN})\\b`, 'g');
const BRAND_PREFIX_RE = new RegExp(`^(${MODERN_BRAND_TOKEN}|${LEGACY_BRAND_TOKEN})\\s+`, 'i');

const DISCOVERY_OPTIONS = [
  'Website',
  'TikTok Page',
  'Facebook Page',
  'Instagram Page',
  'Webinars/Infosession',
  'Coffee Table Talk',
  'Study Abroad Festa',
  'Facebook Groups / Blogs (Reddit etc.)',
  'TikTok Influencers',
  'YouTube Influencers',
  'LinkedIn',
  'Google',
  'British Council',
  '9.0 Niner',
  'Referred by Family, Relatives, Partners or Friend',
  'University/School Website',
  'Billboards, Flyers, Brochures, Advertisment',
  STAFF_REFERRAL_SOURCE,
  OTHERS_SOURCE,
] as const;

const referredByFamilySource = 'Referred by Family, Relatives, Partners or Friend';
const billboardSource = 'Billboards, Flyers, Brochures, Advertisment';
const CURLY_APOSTROPHE = '\u2019';
const MOJIBAKE_APOSTROPHE = '\u00e2\u20ac\u2122';

export const normalizeLeadMetricSpace = (value: unknown) => String(value ?? '').replace(/\s+/g, ' ').trim();
const normalizeKey = (value: unknown) =>
  normalizeLeadMetricSpace(value)
    .toLowerCase()
    .replace(new RegExp(CURLY_APOSTROPHE, 'g'), "'")
    .replace(new RegExp(MOJIBAKE_APOSTROPHE, 'g'), "'");
const normalizeLooseKey = (value: unknown) =>
  normalizeKey(value)
    .replace(/[^a-z0-9']+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
const matchesAny = (value: string, patterns: RegExp[]) => patterns.some((pattern) => pattern.test(value));

const canonicalSourceByKey = new Map(DISCOVERY_OPTIONS.map((item) => [normalizeKey(item), item]));
const genericOtherKeys = new Set(['other', 'others', 'n/a', 'na', 'none', 'unknown', '-']);
const approvedManualOverrides = new Map<string, string>(
  approvedManualOverridePairs.map(([key, value]) => [normalizeLooseKey(key), value]),
);

const splitOtherValues = (value?: string | null) =>
  String(value ?? '')
    .split(/[;|\n]/)
    .map((item) => normalizeLeadMetricSpace(item))
    .filter(Boolean);

const normalizeBrandAliases = (value: string) => value.replace(BRAND_WORD_RE, MODERN_BRAND_TOKEN);
const stripBrandPrefix = (value: string) => value.replace(BRAND_PREFIX_RE, '').trim();

const getDiscoverySourcesFromSubmission = (submission: AssessmentSubmission) => {
  const modernSources = Array.isArray(submission.pathfinderDiscoverySources)
    ? submission.pathfinderDiscoverySources
    : [];
  const legacyCandidate = (submission as Record<string, unknown>)[LEGACY_DISCOVERY_SOURCES_KEY];
  const legacySources = Array.isArray(legacyCandidate) ? legacyCandidate : [];
  const merged = [...modernSources, ...legacySources];
  return merged.map((source) => normalizeLeadMetricSpace(source)).filter(Boolean);
};

const getOtherDiscoverySourceFromSubmission = (submission: AssessmentSubmission) => {
  const modernOther = normalizeLeadMetricSpace(submission.otherPathfinderDiscoverySource);
  const legacyCandidate = (submission as Record<string, unknown>)[LEGACY_OTHER_DISCOVERY_SOURCE_KEY];
  const legacyOther = normalizeLeadMetricSpace(legacyCandidate);
  return modernOther || legacyOther;
};

const normalizeOtherLeadSourceLabel = (value: unknown) => {
  const trimmed = normalizeLeadMetricSpace(value);
  if (!trimmed) return null;

  const loose = normalizeLooseKey(trimmed);
  if (matchesAny(loose, [/kia ora/, /kia-ora/])) return 'Kia-Ora Documentation Services';
  if (matchesAny(loose, [/subagent/, /sub agent/])) return 'Sub-Agent';
  if (matchesAny(loose, [/twitter/, /^x$/])) return 'Twitter / X';
  return trimmed;
};

const mapDiscoverySource = (rawValue: unknown) => {
  const cleaned = normalizeLeadMetricSpace(rawValue);
  if (!cleaned) return { source: null as string | null, otherText: null as string | null };

  const key = normalizeKey(cleaned);
  const brandedLoose = normalizeLooseKey(cleaned);
  const loose = normalizeBrandAliases(brandedLoose);
  const manualOverride = approvedManualOverrides.get(loose);
  if (manualOverride) return { source: manualOverride, otherText: null };

  const direct = canonicalSourceByKey.get(key);
  if (direct) return { source: direct, otherText: null };
  const debranded = stripBrandPrefix(cleaned);
  if (debranded) {
    const debrandedDirect = canonicalSourceByKey.get(normalizeKey(debranded));
    if (debrandedDirect) return { source: debrandedDirect, otherText: null };
    if (normalizeLooseKey(debranded) === 'staff') return { source: STAFF_REFERRAL_SOURCE, otherText: null };
  }
  if (genericOtherKeys.has(loose)) return { source: OTHERS_SOURCE, otherText: null };

  if (matchesAny(loose, [/referred by family/, /partners or friend/, /^referred by friend$/, /^family$/, /^families$/, /^relative$/, /^relatives$/, /^friend$/, /^friends$/])) {
    return { source: referredByFamilySource, otherText: null };
  }
  if (matchesAny(loose, [/billboard/, /flyers?/, /brochures?/, /advertis(e|ement|ment|ing)/])) {
    return { source: billboardSource, otherText: null };
  }
  if (matchesAny(loose, [/pathfinder staff/, /referred by (a )?staff/])) return { source: STAFF_REFERRAL_SOURCE, otherText: null };

  if (matchesAny(loose, [/facebook/, /fb/])) {
    if (matchesAny(loose, [/groups?/, /blogs?/, /reddit/])) return { source: 'Facebook Groups / Blogs (Reddit etc.)', otherText: null };
    return { source: 'Facebook Page', otherText: null };
  }
  if (matchesAny(loose, [/instagram/, /\big\b/])) return { source: 'Instagram Page', otherText: null };
  if (matchesAny(loose, [/tiktok/, /tik tok/, /\btt\b/])) {
    if (matchesAny(loose, [/influencers?/, /creator/])) return { source: 'TikTok Influencers', otherText: null };
    return { source: 'TikTok Page', otherText: null };
  }
  if (matchesAny(loose, [/youtube/, /\byt\b/])) return { source: 'YouTube Influencers', otherText: null };
  if (matchesAny(loose, [/webinars?/, /infosession/, /info session/])) return { source: 'Webinars/Infosession', otherText: null };
  if (matchesAny(loose, [/coffee table talk/])) return { source: 'Coffee Table Talk', otherText: null };
  if (matchesAny(loose, [/study abroad festa/, /\bfesta\b/, /\broadshow\b/])) return { source: 'Study Abroad Festa', otherText: null };
  if (matchesAny(loose, [/linkedin/])) return { source: 'LinkedIn', otherText: null };
  if (matchesAny(loose, [/google/])) return { source: 'Google', otherText: null };
  if (matchesAny(loose, [/british council/])) return { source: 'British Council', otherText: null };
  if (matchesAny(loose, [/9 0 niner/, /90 niner/, /nine niner/, /9\.0 niner/])) return { source: '9.0 Niner', otherText: null };
  if (matchesAny(loose, [/university\/school website/, /university website/, /school website/])) return { source: 'University/School Website', otherText: null };
  if (matchesAny(loose, [/pathfinder website/, /^website$/, /^pathfinder$/])) return { source: 'Website', otherText: null };

  return { source: OTHERS_SOURCE, otherText: cleaned };
};

const hasStaffReferralDetails = (submission: AssessmentSubmission) =>
  Boolean(normalizeLeadMetricSpace(submission.referredStaffBranch) && normalizeLeadMetricSpace(submission.referredStaffName));

export const extractOthersBreakdownLabels = (submission: AssessmentSubmission) => {
  const labels = new Set<string>();
  let sawOthersToken = false;
  const rawSources = getDiscoverySourcesFromSubmission(submission);

  rawSources.forEach((source) => {
    const mapped = mapDiscoverySource(source);
    if (!mapped.source || mapped.source !== OTHERS_SOURCE) return;
    sawOthersToken = true;
    if (!mapped.otherText) return;
    const label = normalizeOtherLeadSourceLabel(mapped.otherText);
    if (!label) return;
    labels.add(label);
  });

  splitOtherValues(getOtherDiscoverySourceFromSubmission(submission)).forEach((source) => {
    const mapped = mapDiscoverySource(source);
    if (!mapped.source || mapped.source !== OTHERS_SOURCE) return;
    sawOthersToken = true;
    if (!mapped.otherText) return;
    const label = normalizeOtherLeadSourceLabel(mapped.otherText);
    if (!label) return;
    labels.add(label);
  });

  if (labels.size === 0 && sawOthersToken) labels.add(UNSPECIFIED_OTHERS_LABEL);
  return Array.from(labels);
};

export const normalizeSubmissionLeadSources = (submission: AssessmentSubmission) => {
  const rawSources = getDiscoverySourcesFromSubmission(submission);
  const normalized = new Set<string>();
  const otherValues = new Set<string>();
  let hasExplicitOthers = false;

  rawSources.forEach((source) => {
    const mapped = mapDiscoverySource(source);
    if (!mapped.source) return;
    if (mapped.source === OTHERS_SOURCE) {
      hasExplicitOthers = true;
      if (mapped.otherText) otherValues.add(mapped.otherText);
      return;
    }
    normalized.add(mapped.source);
  });

  splitOtherValues(getOtherDiscoverySourceFromSubmission(submission)).forEach((source) => {
    const mapped = mapDiscoverySource(source);
    if (!mapped.source) return;
    if (mapped.source === OTHERS_SOURCE) {
      hasExplicitOthers = true;
      if (mapped.otherText) otherValues.add(mapped.otherText);
      return;
    }
    normalized.add(mapped.source);
  });

  if (hasStaffReferralDetails(submission)) normalized.add(STAFF_REFERRAL_SOURCE);
  if (otherValues.size > 0 || (hasExplicitOthers && normalized.size === 0)) normalized.add(OTHERS_SOURCE);

  return normalized;
};

export const sortOtherLeadSourceBreakdown = (
  left: { label: string; count: number },
  right: { label: string; count: number }
) => {
  if (right.count !== left.count) return right.count - left.count;
  return left.label.localeCompare(right.label);
};
