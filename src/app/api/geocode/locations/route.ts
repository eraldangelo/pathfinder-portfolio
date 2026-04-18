import { NextResponse } from 'next/server';
import { parseJsonBodyWithSchema } from '@/app/api/_shared/bodyValidation';
import { requireBearerToken, toUnauthorizedResponseFromVerifyError } from '@/app/api/_shared/auth';
import { enforceRateLimit } from '@/app/api/_shared/rateLimit';
import { getAdminAuth } from '@/lib/firebaseAdmin';
import {
  locationRequestBodySchema,
  parseLocationRequestPayload,
  resolveAliasQuery,
  resolveKnownPhilippineFallback,
  type GeocodeResult,
} from './utils';
import { geocodeWithProvider, resolveProviderConfig } from './providers';

export const runtime = 'nodejs';

const cache = new Map<string, { result: GeocodeResult; expiresAt: number }>();
const unresolvedCache = new Map<string, number>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 14;
const UNRESOLVED_CACHE_TTL_MS = 1000 * 60 * 20;
const MAX_CACHE_ENTRIES = 5000;
const MAX_UNRESOLVED_CACHE_ENTRIES = 5000;
const GEOCODE_CONCURRENCY = 4;
const STREET_HINT = /\b(\d{1,5}|st\.?|street|ave\.?|avenue|rd\.?|road|drive|dr\.?|blk|block|lot|phase|compound|purok|zone|barangay|brgy\.?|subd|subdivision|village|ext\.?|unit)\b/i;
const providerConfig = resolveProviderConfig();

const pruneCacheMaps = (now: number) => {
  for (const [key, entry] of cache.entries()) {
    if (entry.expiresAt <= now) {
      cache.delete(key);
    }
  }
  for (const [key, expiresAt] of unresolvedCache.entries()) {
    if (expiresAt <= now) {
      unresolvedCache.delete(key);
    }
  }

  while (cache.size > MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next();
    if (oldest.done) break;
    cache.delete(oldest.value);
  }
  while (unresolvedCache.size > MAX_UNRESOLVED_CACHE_ENTRIES) {
    const oldest = unresolvedCache.keys().next();
    if (oldest.done) break;
    unresolvedCache.delete(oldest.value);
  }
};

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

const sanitizeGeocodeQuery = (value: string) => {
  const cleaned = value
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
  return shortenLocationValue(cleaned);
};

const geocodeQuery = async (query: string): Promise<GeocodeResult | null> => {
  const now = Date.now();
  pruneCacheMaps(now);

  const resolvedQuery = resolveAliasQuery(sanitizeGeocodeQuery(query));
  const cacheKey = resolvedQuery.toLowerCase().replace(/\s+/g, ' ').trim();
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.result;
  }

  const fallback = resolveKnownPhilippineFallback(resolvedQuery);
  if (fallback) {
    cache.set(cacheKey, { result: fallback, expiresAt: Date.now() + CACHE_TTL_MS });
    unresolvedCache.delete(cacheKey);
    return fallback;
  }

  const unresolvedExpiresAt = unresolvedCache.get(cacheKey);
  if (unresolvedExpiresAt && unresolvedExpiresAt > Date.now()) {
    return null;
  }

  const queryVariants = cacheKey.includes('philippines')
    ? [resolvedQuery]
    : [resolvedQuery, `${resolvedQuery}, Philippines`];
  let hasAttempts = false;
  let allAttemptsWereDefinitiveMiss = true;

  for (const currentQuery of queryVariants) {
    const attempt = await geocodeWithProvider(currentQuery, providerConfig);
    hasAttempts = true;
    if (!attempt.definitiveMiss) {
      allAttemptsWereDefinitiveMiss = false;
    }
    if (!attempt.result) continue;
    const result = attempt.result;
    cache.set(cacheKey, { result, expiresAt: Date.now() + CACHE_TTL_MS });
    unresolvedCache.delete(cacheKey);
    return result;
  }

  // Cache unresolved only for valid no-result responses, not transient transport/throttle failures.
  if (hasAttempts && allAttemptsWereDefinitiveMiss) {
    unresolvedCache.set(cacheKey, Date.now() + UNRESOLVED_CACHE_TTL_MS);
  }
  return null;
};

export async function POST(request: Request) {
  const rateLimit = await enforceRateLimit(request, {
    id: 'geocode-locations',
    windowMs: 60_000,
    max: 90,
    message: 'Too many geocoding requests. Please retry later.',
  });
  if (rateLimit) return rateLimit;

  const auth = requireBearerToken(request, { trim: true });
  if (auth.response) {
    return auth.response;
  }

  try {
    const payload = await parseJsonBodyWithSchema(request, locationRequestBodySchema, {
      maxBytes: 64 * 1024,
      invalidMessage: 'locations payload is required.',
      tooLargeMessage: 'Geocoding payload is too large.',
    });
    if (payload.response) {
      return payload.response;
    }
    const locations = parseLocationRequestPayload(payload.data);

    if (!locations.length) {
      return NextResponse.json(
        { ok: false, message: 'locations payload is required.' },
        { status: 400 }
      );
    }

    const adminAuth = getAdminAuth();
    try {
      await adminAuth.verifyIdToken(auth.token);
    } catch (error) {
      const unauthorized = toUnauthorizedResponseFromVerifyError(error, 'Unauthorized.');
      if (unauthorized) {
        return NextResponse.json(
          { ok: false, message: 'Unauthorized.' },
          { status: 401 },
        );
      }
      throw error;
    }

    const results: Array<{ key: string; lat: number; lng: number; country: string }> = [];
    const unresolved: string[] = [];

    let nextIndex = 0;
    const workers = Array.from({ length: Math.min(GEOCODE_CONCURRENCY, locations.length) }, async () => {
      while (true) {
        const currentIndex = nextIndex;
        nextIndex += 1;
        if (currentIndex >= locations.length) break;
        const item = locations[currentIndex];
        try {
          const geocoded = await geocodeQuery(item.query);
          if (geocoded) {
            results.push({ key: item.key, ...geocoded });
          } else {
            unresolved.push(item.key);
          }
        } catch {
          unresolved.push(item.key);
        }
      }
    });
    await Promise.all(workers);

    return NextResponse.json({ ok: true, results, unresolved });
  } catch (error) {
    console.error('[geocode] failed to resolve locations', error);
    return NextResponse.json(
      { ok: false, message: 'Geocoding request failed.' },
      { status: 500 }
    );
  }
}
