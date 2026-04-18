import type { AssessmentSubmission } from '../../../../types';
import { getCanonicalCountryName, getCountryCode } from '@/data/reference/countries';

const MAIN_DESTINATIONS = [
  'Australia',
  'Canada',
  'New Zealand',
  'Ireland',
  'United Kingdom',
  'United States of America',
  'Germany',
] as const;
const OTHER_TOKEN = 'Other';
const OTHER_BREAKDOWN_DETAILS_PREFIX = '__destination_others_breakdown__:';
const UNSPECIFIED_OTHER_DESTINATION = 'Unspecified';

const DESTINATION_CODES: Record<string, string> = {
  Australia: 'au',
  Canada: 'ca',
  'New Zealand': 'nz',
  Ireland: 'ie',
  'United Kingdom': 'gb',
  'United States of America': 'us',
  Germany: 'de',
  Philippines: 'ph',
  Spain: 'es',
  Malta: 'mt',
  Singapore: 'sg',
  'South Korea': 'kr',
  Japan: 'jp',
  Belgium: 'be',
};

const CURLY_APOSTROPHE = '\u2019';
const MOJIBAKE_APOSTROPHE = '\u00e2\u20ac\u2122';

const normalizeSpace = (value: unknown) => String(value ?? '').replace(/\s+/g, ' ').trim();
const normalizeKey = (value: unknown) =>
  normalizeSpace(value)
    .toLowerCase()
    .replace(new RegExp(CURLY_APOSTROPHE, 'g'), "'")
    .replace(new RegExp(MOJIBAKE_APOSTROPHE, 'g'), "'");
const normalizeLooseKey = (value: unknown) =>
  normalizeKey(value)
    .replace(/[^a-z0-9']+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const splitOtherValues = (value?: string | null) =>
  String(value ?? '')
    .split(/[;|\n]/)
    .map((part) => normalizeSpace(part))
    .filter(Boolean);

const canonicalDestinationByAlias = new Map<string, string>([
  ['australia', 'Australia'],
  ['canada', 'Canada'],
  ['new zealand', 'New Zealand'],
  ['nz', 'New Zealand'],
  ['ireland', 'Ireland'],
  ['united kingdom', 'United Kingdom'],
  ['uk', 'United Kingdom'],
  ['great britain', 'United Kingdom'],
  ['britain', 'United Kingdom'],
  ['england', 'United Kingdom'],
  ['united states of america', 'United States of America'],
  ['united states', 'United States of America'],
  ['usa', 'United States of America'],
  ['us', 'United States of America'],
  ['u s a', 'United States of America'],
  ['germany', 'Germany'],
  ['philippines', 'Philippines'],
  ['spain', 'Spain'],
  ['malta', 'Malta'],
  ['singapore', 'Singapore'],
  ['south korea', 'South Korea'],
  ['korea', 'South Korea'],
  ['japan', 'Japan'],
  ['belgium', 'Belgium'],
].map(([alias, destination]) => [normalizeLooseKey(alias), destination]));

const destinationCodeByKey = new Map(
  Object.entries(DESTINATION_CODES).map(([name, code]) => [normalizeLooseKey(name), code]),
);
const mainDestinationSet = new Set<string>(MAIN_DESTINATIONS);

const normalizeDestinationLabel = (value: unknown) => {
  const cleaned = normalizeSpace(value);
  if (!cleaned) return null;
  const normalizedKey = normalizeLooseKey(cleaned);
  const canonical = canonicalDestinationByAlias.get(normalizedKey) || getCanonicalCountryName(cleaned);
  return canonical || cleaned;
};

const resolveDestinationCode = (name?: string | null) => {
  const cleaned = normalizeDestinationLabel(name);
  if (!cleaned) return undefined;
  const normalizedKey = normalizeLooseKey(cleaned);
  return DESTINATION_CODES[cleaned] || destinationCodeByKey.get(normalizedKey) || getCountryCode(cleaned);
};

const sortDestinationBreakdown = (
  left: { label: string; apps: number; code?: string },
  right: { label: string; apps: number; code?: string },
) => {
  if (right.apps !== left.apps) return right.apps - left.apps;
  return left.label.localeCompare(right.label);
};

export type TopDestinationRow = {
  name: string;
  apps: number;
  code?: string;
  details?: string;
};

export const buildTopDestinationsData = (assessmentSubmissions: AssessmentSubmission[]): TopDestinationRow[] => {
  const mainCounts = new Map<string, number>();
  const otherBreakdownCounts = new Map<string, { label: string; apps: number; code?: string }>();

  const addMainDestination = (name: string) => {
    mainCounts.set(name, (mainCounts.get(name) || 0) + 1);
  };

  const addOtherDestination = (label: string) => {
    const existing = otherBreakdownCounts.get(label);
    if (existing) {
      existing.apps += 1;
      return;
    }
    otherBreakdownCounts.set(label, {
      label,
      apps: 1,
      code: resolveDestinationCode(label),
    });
  };

  assessmentSubmissions.forEach((submission) => {
    const values = Array.isArray(submission.studyDestinations)
      ? submission.studyDestinations.map((value) => normalizeSpace(value)).filter(Boolean)
      : [];

    let sawOtherToken = false;

    values.forEach((value) => {
      if (normalizeLooseKey(value) === normalizeLooseKey(OTHER_TOKEN)) {
        sawOtherToken = true;
        return;
      }

      const normalizedLabel = normalizeDestinationLabel(value);
      if (!normalizedLabel) return;

      if (mainDestinationSet.has(normalizedLabel)) {
        addMainDestination(normalizedLabel);
        return;
      }

      addOtherDestination(normalizedLabel);
    });

    const otherValues = splitOtherValues(submission.otherStudyDestination);
    if (otherValues.length > 0) {
      otherValues.forEach((otherValue) => {
        const normalizedLabel = normalizeDestinationLabel(otherValue);
        if (!normalizedLabel) return;

        if (mainDestinationSet.has(normalizedLabel)) {
          addMainDestination(normalizedLabel);
          return;
        }

        addOtherDestination(normalizedLabel);
      });
      return;
    }

    if (sawOtherToken) {
      addOtherDestination(UNSPECIFIED_OTHER_DESTINATION);
    }
  });

  const rows: TopDestinationRow[] = Array.from(mainCounts.entries())
    .map(([name, apps]) => ({ name, apps, code: resolveDestinationCode(name) }))
    .sort((a, b) => b.apps - a.apps);

  const otherBreakdown = Array.from(otherBreakdownCounts.values()).sort(sortDestinationBreakdown);
  if (otherBreakdown.length > 0) {
    const totalOther = otherBreakdown.reduce((sum, item) => sum + item.apps, 0);
    rows.push({
      name: OTHER_TOKEN,
      apps: totalOther,
      details: `${OTHER_BREAKDOWN_DETAILS_PREFIX}${JSON.stringify(otherBreakdown)}`,
    });
  }

  const otherRow = rows.find((row) => row.name === OTHER_TOKEN);
  const withoutOther = rows.filter((row) => row.name !== OTHER_TOKEN);
  return otherRow ? [...withoutOther, otherRow] : withoutOther;
};

export const parseDestinationOthersBreakdownDetails = (details?: string) => {
  if (!details || !details.startsWith(OTHER_BREAKDOWN_DETAILS_PREFIX)) return null;
  const json = details.slice(OTHER_BREAKDOWN_DETAILS_PREFIX.length);

  try {
    const parsed = JSON.parse(json) as unknown;
    if (!Array.isArray(parsed)) return null;

    return parsed
      .map((item) => ({
        label: normalizeSpace((item as { label?: unknown })?.label),
        apps: Number((item as { apps?: unknown })?.apps || 0),
        code: normalizeSpace((item as { code?: unknown })?.code) || undefined,
      }))
      .filter((item) => item.label && Number.isFinite(item.apps) && item.apps > 0);
  } catch {
    return null;
  }
};
