import { safeServerFetch } from '@/app/api/_shared/safeFetch';
import type { GeocodeResult } from './utils';

export type GeocodingProvider = 'google' | 'nominatim';

export type ProviderConfig = {
  provider: GeocodingProvider;
  googleApiKey: string;
};

export type GeocodeAttempt = {
  result: GeocodeResult | null;
  definitiveMiss: boolean;
};

const GEOCODE_FETCH_TIMEOUT_MS = 7000;

const fetchWithTimeout = async (input: string, init: RequestInit) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEOCODE_FETCH_TIMEOUT_MS);
  try {
    return await safeServerFetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
};

const parseJsonResponse = async (response: Response) => {
  const contentType = String(response.headers.get('content-type') || '').toLowerCase();
  const raw = await response.text();
  const trimmed = raw.trim();
  const looksJson =
    contentType.includes('application/json') ||
    trimmed.startsWith('[') ||
    trimmed.startsWith('{');
  if (!looksJson) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
};

const geocodeWithNominatim = async (query: string): Promise<GeocodeAttempt> => {
  const endpoint = `https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&q=${encodeURIComponent(
    query,
  )}`;
  let response: Response;
  try {
    response = await fetchWithTimeout(endpoint, {
      method: 'GET',
      headers: {
        'User-Agent': 'pathfinder-dashboard-geocoder/1.0',
        'Accept-Language': 'en',
      },
      cache: 'no-store',
    });
  } catch {
    return { result: null, definitiveMiss: false };
  }
  if (!response.ok) return { result: null, definitiveMiss: false };

  const payload = (await parseJsonResponse(response)) as Array<{
    lat: string;
    lon: string;
    address?: { country?: string };
  }> | null;
  if (!payload) return { result: null, definitiveMiss: false };

  const first = payload?.[0];
  if (!first) return { result: null, definitiveMiss: true };

  const lat = Number(first.lat);
  const lng = Number(first.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { result: null, definitiveMiss: false };
  }

  return {
    result: {
      lat,
      lng,
      country: first.address?.country || 'Philippines',
    },
    definitiveMiss: false,
  };
};

const geocodeWithGoogle = async (query: string, apiKey: string): Promise<GeocodeAttempt> => {
  if (!apiKey) return { result: null, definitiveMiss: false };

  const endpoint = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    query,
  )}&language=en&key=${encodeURIComponent(apiKey)}`;
  let response: Response;
  try {
    response = await fetchWithTimeout(endpoint, {
      method: 'GET',
      cache: 'no-store',
    });
  } catch {
    return { result: null, definitiveMiss: false };
  }
  if (!response.ok) return { result: null, definitiveMiss: false };

  const payload = (await parseJsonResponse(response)) as {
    status?: string;
    results?: Array<{
      geometry?: { location?: { lat?: number; lng?: number } };
      address_components?: Array<{ long_name?: string; types?: string[] }>;
    }>;
  } | null;
  if (!payload) return { result: null, definitiveMiss: false };

  const status = String(payload.status || '').trim().toUpperCase();
  if (status === 'ZERO_RESULTS') return { result: null, definitiveMiss: true };
  if (status !== 'OK') return { result: null, definitiveMiss: false };

  const first = payload.results?.[0];
  const lat = Number(first?.geometry?.location?.lat);
  const lng = Number(first?.geometry?.location?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { result: null, definitiveMiss: false };
  }

  const countryComponent = first?.address_components?.find((component) =>
    Array.isArray(component.types) && component.types.includes('country'),
  );
  const country = String(countryComponent?.long_name || '').trim() || 'Unknown';

  return {
    result: { lat, lng, country },
    definitiveMiss: false,
  };
};

export const resolveProviderConfig = (): ProviderConfig => {
  const configuredProvider = String(process.env.GEOCODING_PROVIDER || '').trim().toLowerCase();
  const googleApiKey = String(process.env.GOOGLE_GEOCODING_API_KEY || '').trim();

  if (configuredProvider === 'nominatim') return { provider: 'nominatim', googleApiKey };
  if (configuredProvider === 'google') return { provider: googleApiKey ? 'google' : 'nominatim', googleApiKey };
  if (googleApiKey) return { provider: 'google', googleApiKey };
  return { provider: 'nominatim', googleApiKey };
};

export const geocodeWithProvider = async (
  query: string,
  config: ProviderConfig,
): Promise<GeocodeAttempt> => {
  if (config.provider === 'google') {
    return geocodeWithGoogle(query, config.googleApiKey);
  }
  return geocodeWithNominatim(query);
};

