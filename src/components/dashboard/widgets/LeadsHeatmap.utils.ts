import type { ApplicationInfo } from '../../../data/applications';
import type { AssessmentSubmission } from '../../../types';
import { EXACT_LOCATION_ALIASES } from './LeadsHeatmap.locationAliases';

export type GeocodedLocation = {
  lat: number;
  lng: number;
  country: string;
};

export type CountedLocation = {
  key: string;
  query: string;
  count: number;
};

export type HeatmapOriginFilter = 'leads' | 'applications';

export type GeocodeResponse = {
  ok: boolean;
  results: Array<{ key: string; lat: number; lng: number; country: string }>;
  unresolved: string[];
};

export const GEO_CACHE_KEY = 'dashboard-application-hotspots-v5';
export const GEO_BATCH_SIZE = 40;
export const GEO_BATCH_TIMEOUT_MS = 90000;

const STREET_HINT = /\b(\d{1,5}|st\.?|street|ave\.?|avenue|rd\.?|road|drive|dr\.?|blk|block|lot|phase|compound|purok|zone|barangay|brgy\.?|subd|subdivision|village|ext\.?|unit)\b/i;

const US_STATE_BY_CODE: Record<string, string> = {
  MT: 'Montana',
  CA: 'California',
  NY: 'New York',
  TX: 'Texas',
  FL: 'Florida',
  WA: 'Washington',
};

const CA_PROVINCE_BY_CODE: Record<string, string> = {
  ON: 'Ontario',
  BC: 'British Columbia',
  AB: 'Alberta',
  MB: 'Manitoba',
  QC: 'Quebec',
};

export const chunkLocations = <T,>(items: T[], size: number): T[][] => {
  if (size <= 0) return [items];
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

export const normalizeLocation = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9,\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const shortenLocationValue = (value: string) => {
  const parts = value.split(',').map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) return value;

  const last = parts[parts.length - 1];
  const secondLast = parts[parts.length - 2];
  const thirdLast = parts[parts.length - 3] || '';

  const us = secondLast.match(/^([A-Za-z]{2})\s+\d{4,6}(?:-\d{4})?$/);
  if (thirdLast && us && /^(usa|u\.s\.a\.|united states|us)$/i.test(last)) {
    const code = us[1].toUpperCase();
    const state = US_STATE_BY_CODE[code] || code;
    return `${thirdLast}, ${state}, USA`;
  }

  const canada = secondLast.match(/^([A-Za-z]{2})\s+[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/i);
  if (thirdLast && canada && /^canada$/i.test(last)) {
    const code = canada[1].toUpperCase();
    const province = CA_PROVINCE_BY_CODE[code] || code;
    return `${thirdLast}, ${province}, Canada`;
  }

  const hasStreet = STREET_HINT.test(parts[0]) || /\d/.test(parts[0]);
  if ((value.length > 65 || hasStreet) && parts.length >= 2) {
    return parts.slice(-2).join(', ');
  }

  return value;
};

export const normalizeLocationQuery = (value: string) => {
  let cleaned = value
    .replace(/\u202f/g, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s+/g, ' ')
    .replace(/[.,\s]+$/g, '')
    .replace(/\b(santa|santo)\.\s*/gi, '$1 ')
    .replace(/\bsta\.?\s*/gi, 'Santa ')
    .replace(/\bsto\.?\s*/gi, 'Santo ')
    .replace(/\bsantotomas\b/gi, 'Santo Tomas')
    .replace(/\btundo\b/gi, 'Tondo')
    .replace(/\bmondana\b/gi, 'Montana')
    .replace(/\bcoty\b/gi, 'City')
    .replace(/\banglese\b/gi, 'Angeles')
    .replace(/\bcomonwealth\b/gi, 'Commonwealth')
    .trim();

  cleaned = shortenLocationValue(cleaned);
  const exact = EXACT_LOCATION_ALIASES[cleaned.toLowerCase()];
  if (exact) cleaned = exact;

  if (cleaned.length > 90 && cleaned.includes(',')) {
    const parts = cleaned.split(',').map((part) => part.trim()).filter(Boolean);
    if (parts.length >= 2) return parts.slice(-2).join(', ');
  }

  return cleaned;
};

export const resolveSubmissionLocationQuery = (submission: AssessmentSubmission) => {
  const current = normalizeLocationQuery(String(submission.currentLocation || ''));
  if (current) return current;
  return normalizeLocationQuery(String(submission.referredStaffBranch || ''));
};

export const buildCountedLocations = (
  assessmentSubmissions: AssessmentSubmission[],
): CountedLocation[] => {
  const counts = new Map<string, CountedLocation>();

  assessmentSubmissions.forEach((submission) => {
    const query = resolveSubmissionLocationQuery(submission);
    if (!query) return;

    const key = normalizeLocation(query);
    if (!key) return;

    const existing = counts.get(key);
    if (existing) {
      existing.count += 1;
      return;
    }

    counts.set(key, { key, query, count: 1 });
  });

  return Array.from(counts.values());
};

export const buildApplicationCountedLocations = (
  applications: ApplicationInfo[],
  assessmentSubmissions: AssessmentSubmission[],
): CountedLocation[] => {
  const counts = new Map<string, CountedLocation>();
  const submissionById = new Map<string, AssessmentSubmission>();

  assessmentSubmissions.forEach((submission) => {
    const id = String(submission.id ?? '').trim();
    if (!id || submissionById.has(id)) return;
    submissionById.set(id, submission);
  });

  applications.forEach((application) => {
    const studentId = String(application.studentId ?? '').trim();
    if (!studentId) return;

    const matchedSubmission = submissionById.get(studentId);
    if (!matchedSubmission) return;

    const query = resolveSubmissionLocationQuery(matchedSubmission);
    if (!query) return;

    const key = normalizeLocation(query);
    if (!key) return;

    const existing = counts.get(key);
    if (existing) {
      existing.count += 1;
      return;
    }

    counts.set(key, { key, query, count: 1 });
  });

  return Array.from(counts.values());
};

export const readGeoCache = () => {
  if (typeof window === 'undefined') return {};
  const raw = window.localStorage.getItem(GEO_CACHE_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, GeocodedLocation>;
    const sanitized: Record<string, GeocodedLocation> = {};

    const isValidLatLng = (lat: number, lng: number) =>
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180;

    for (const [key, value] of Object.entries(parsed || {})) {
      const rawLat = Number((value as any)?.lat);
      const rawLng = Number((value as any)?.lng);
      if (!Number.isFinite(rawLat) || !Number.isFinite(rawLng)) continue;

      const swappedLooksValid = isValidLatLng(rawLng, rawLat);
      const lat = isValidLatLng(rawLat, rawLng)
        ? rawLat
        : swappedLooksValid
          ? rawLng
          : Number.NaN;
      const lng = isValidLatLng(rawLat, rawLng)
        ? rawLng
        : swappedLooksValid
          ? rawLat
          : Number.NaN;
      if (!isValidLatLng(lat, lng)) continue;

      sanitized[key] = {
        lat,
        lng,
        country: String((value as any)?.country || '').trim() || 'Unknown',
      };
    }
    return sanitized;
  } catch {
    window.localStorage.removeItem(GEO_CACHE_KEY);
    return {};
  }
};

export const writeGeoCache = (value: Record<string, GeocodedLocation>) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(value));
};
