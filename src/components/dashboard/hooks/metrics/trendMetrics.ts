import type { ApplicationInfo } from '../../../../data/applications';
import { getCanonicalCountryName } from '../../../../data/reference/countries';
import { getSchoolByName } from '../../../../data/schools/schools';
import { ALL_LOCATION_KEYS, BRANCH_COUNTRY_MAPPING, COUNTRY_OVERALL_MAPPING } from '../../constants/constants';
import type { TrendPoint } from '../../types/types';

const TREND_START_YEAR = 2026;
const TREND_START_MONTH_INDEX = 0; // January
const TREND_COUNTRIES = [
  'All Countries',
  'Australia',
  'Canada',
  'New Zealand',
  'Ireland',
  'Germany',
  'United Kingdom',
  'United States',
] as const;

type VisaDecision = {
  status: 'granted' | 'refused';
  date: Date;
};
type TrendStatus = VisaDecision['status'] | 'lodged';
type TrendBucket = Record<TrendStatus, number>;

const normalize = (value?: string | null) => String(value ?? '').trim().toLowerCase();
const normalizeCountry = (value?: string | null) => normalize(value).replace(/\./g, '');
const countryKeySet = new Set(TREND_COUNTRIES.map((country) => normalizeCountry(country)));

const resolveCountryLabel = (value?: string | null) => {
  const raw = String(value ?? '').trim();
  const normalized = normalizeCountry(raw);
  if (!normalized) return null;
  if (normalized === 'all countries') return 'All Countries';
  const canonicalCountry = getCanonicalCountryName(raw);
  if (canonicalCountry === 'United Kingdom') return 'United Kingdom';
  if (canonicalCountry === 'United States of America') {
    return 'United States';
  }

  if (canonicalCountry) {
    const matchedByCanonical = TREND_COUNTRIES.find(
      (country) => normalizeCountry(country) === normalizeCountry(canonicalCountry),
    );
    if (matchedByCanonical) return matchedByCanonical;
  }

  return TREND_COUNTRIES.find((country) => normalizeCountry(country) === normalized) ?? null;
};

const toDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof (value as { toDate?: () => Date }).toDate === 'function') {
    const parsed = (value as { toDate: () => Date }).toDate();
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

const resolveVisaDecisionStatus = (status: unknown): VisaDecision['status'] | null => {
  const statusKey = normalize(String(status ?? ''));
  if (statusKey.includes('visa granted')) return 'granted';
  if (statusKey.includes('visa refused')) return 'refused';
  return null;
};

const isVisaLodgedStatus = (status: unknown) =>
  normalize(String(status ?? '')).includes('visa lodged');

const getLatestVisaDecision = (application: ApplicationInfo): VisaDecision | null => {
  const decisions: VisaDecision[] = [];
  const currentStatusDecision = resolveVisaDecisionStatus(application.status);
  const currentStatusDate = toDate(application.statusChanged);
  if (currentStatusDecision && currentStatusDate) {
    decisions.push({ status: currentStatusDecision, date: currentStatusDate });
  }
  if (Array.isArray(application.history)) {
    application.history.forEach((entry) => {
      const decisionStatus = resolveVisaDecisionStatus(entry?.status);
      const decisionDate = toDate(entry?.date);
      if (decisionStatus && decisionDate) {
        decisions.push({ status: decisionStatus, date: decisionDate });
      }
    });
  }
  if (!decisions.length) return null;
  decisions.sort((a, b) => b.date.getTime() - a.date.getTime());
  return decisions[0];
};

const getLatestVisaLodgedDate = (application: ApplicationInfo): Date | null => {
  const lodgedDates: Date[] = [];
  const currentStatusDate = toDate(application.statusChanged);
  if (isVisaLodgedStatus(application.status) && currentStatusDate) {
    lodgedDates.push(currentStatusDate);
  }
  if (Array.isArray(application.history)) {
    application.history.forEach((entry) => {
      const lodgedDate = toDate(entry?.date);
      if (isVisaLodgedStatus(entry?.status) && lodgedDate) {
        lodgedDates.push(lodgedDate);
      }
    });
  }
  if (!lodgedDates.length) return null;
  lodgedDates.sort((a, b) => b.getTime() - a.getTime());
  return lodgedDates[0];
};

const resolveApplicationCountry = (application: ApplicationInfo) => {
  const dynamicCountry = resolveCountryLabel(
    (application as unknown as { country?: string | null; destinationCountry?: string | null }).country
      ?? (application as unknown as { destinationCountry?: string | null }).destinationCountry
  );
  if (dynamicCountry) return dynamicCountry;

  const schoolNames = Array.isArray(application.schoolCourses)
    ? application.schoolCourses.map((schoolCourse) => String(schoolCourse?.schoolName ?? '').trim()).filter(Boolean)
    : [];

  for (const schoolName of schoolNames) {
    const directCountry = resolveCountryLabel(schoolName);
    if (directCountry) return directCountry;

    const pathSegments = schoolName.split('+').map((segment) => segment.trim()).filter(Boolean);
    for (const segment of pathSegments) {
      const segmentCountry = resolveCountryLabel(segment);
      if (segmentCountry) return segmentCountry;
      const matchedSchool = getSchoolByName(segment);
      const schoolCountry = resolveCountryLabel(matchedSchool?.country);
      if (schoolCountry) return schoolCountry;
    }

    const matchedSchool = getSchoolByName(schoolName);
    const schoolCountry = resolveCountryLabel(matchedSchool?.country);
    if (schoolCountry) return schoolCountry;
  }

  return resolveCountryLabel(application.citizenship);
};

const toMonthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const buildMonthSlotsFromStartDate = () => {
  const slots: { key: string; label: string }[] = [];
  const startDate = new Date(TREND_START_YEAR, TREND_START_MONTH_INDEX, 1);
  const now = new Date();
  const endDate = new Date(now.getFullYear(), now.getMonth(), 1);

  if (endDate.getTime() < startDate.getTime()) {
    slots.push({
      key: toMonthKey(startDate),
      label: startDate.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
    });
    return slots;
  }

  for (
    const cursor = new Date(startDate);
    cursor.getTime() <= endDate.getTime();
    cursor.setMonth(cursor.getMonth() + 1)
  ) {
    const slotDate = new Date(cursor);
    slots.push({
      key: toMonthKey(slotDate),
      label: slotDate.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
    });
  }

  return slots;
};

const initTrendBuckets = (monthCount: number) =>
  Array.from({ length: monthCount }, () => ({ granted: 0, refused: 0, lodged: 0 }));

const buildTrendKey = (location: string, country: string) => `${location}::${country}`;

export const buildTrendData = (applications: ApplicationInfo[]) => {
  const monthSlots = buildMonthSlotsFromStartDate();
  const monthIndexByKey = new Map<string, number>(monthSlots.map((slot, index) => [slot.key, index]));

  const trendCountsByLocation: { [key: string]: TrendBucket[] } = {};
  ALL_LOCATION_KEYS.forEach((key) => {
    trendCountsByLocation[key] = initTrendBuckets(monthSlots.length);
    TREND_COUNTRIES.forEach((country) => {
      const trendKey = buildTrendKey(key, country);
      trendCountsByLocation[trendKey] = initTrendBuckets(monthSlots.length);
    });
  });

  const incrementStatus = (
    location: string,
    monthIndex: number,
    status: TrendStatus,
    destinationCountry: string | null,
  ) => {
    const bucket = trendCountsByLocation[location]?.[monthIndex];
    if (!bucket) return;
    bucket[status] += 1;

    const allCountriesBucket = trendCountsByLocation[buildTrendKey(location, 'All Countries')]?.[monthIndex];
    if (allCountriesBucket) {
      allCountriesBucket[status] += 1;
    }

    const normalizedDestination = normalizeCountry(destinationCountry ?? '');
    const destinationCountryKey = destinationCountry ?? '';
    if (normalizedDestination && countryKeySet.has(normalizedDestination) && destinationCountryKey !== 'All Countries') {
      const countryBucket = trendCountsByLocation[buildTrendKey(location, destinationCountryKey)]?.[monthIndex];
      if (countryBucket) {
        countryBucket[status] += 1;
      }
    }
  };

  applications.forEach((application) => {
    const appBranch = String(application.branch ?? '').trim();
    const appCountry = appBranch ? BRANCH_COUNTRY_MAPPING[appBranch as keyof typeof BRANCH_COUNTRY_MAPPING] : undefined;
    const appCountryOverallKey = appCountry ? COUNTRY_OVERALL_MAPPING[appCountry as keyof typeof COUNTRY_OVERALL_MAPPING] : undefined;
    const destinationCountry = resolveApplicationCountry(application);

    const locations = ['Overall'];
    if (appBranch && trendCountsByLocation[appBranch]) locations.push(appBranch);
    if (appCountryOverallKey && trendCountsByLocation[appCountryOverallKey]) locations.push(appCountryOverallKey);

    const latestDecision = getLatestVisaDecision(application);
    if (latestDecision) {
      const decisionMonthIndex = monthIndexByKey.get(toMonthKey(latestDecision.date));
      if (typeof decisionMonthIndex === 'number') {
        locations.forEach((location) => {
          incrementStatus(location, decisionMonthIndex, latestDecision.status, destinationCountry);
        });
      }
    }

    const latestLodgedDate = getLatestVisaLodgedDate(application);
    if (latestLodgedDate) {
      const lodgedMonthIndex = monthIndexByKey.get(toMonthKey(latestLodgedDate));
      if (typeof lodgedMonthIndex === 'number') {
        locations.forEach((location) => {
          incrementStatus(location, lodgedMonthIndex, 'lodged', destinationCountry);
        });
      }
    }
  });

  const trendData: { [key: string]: TrendPoint[] } = {};
  const keysToOutput: string[] = [];
  ALL_LOCATION_KEYS.forEach((locationKey) => {
    keysToOutput.push(locationKey);
    TREND_COUNTRIES.forEach((country) => keysToOutput.push(buildTrendKey(locationKey, country)));
  });

  keysToOutput.forEach((key) => {
    trendData[key] = monthSlots.map((slot, monthIndex) => {
      const granted = trendCountsByLocation[key]?.[monthIndex]?.granted ?? 0;
      const refused = trendCountsByLocation[key]?.[monthIndex]?.refused ?? 0;
      const lodged = trendCountsByLocation[key]?.[monthIndex]?.lodged ?? 0;
      return {
        month: slot.label,
        rate: granted,
        granted,
        refused,
        lodged,
      };
    });
  });

  return trendData;
};
