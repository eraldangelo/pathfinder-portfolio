import type { DashboardAiInsights } from '../utils/dashboardAiInsights';

const AI_CACHE_TTL_MS = 2 * 60 * 1000;
const PDF_CACHE_TTL_MS = 2 * 60 * 1000;
const MAX_AI_CACHE_ENTRIES = 8;
const MAX_PDF_CACHE_ENTRIES = 4;

type AiCacheEntry = {
  value: DashboardAiInsights;
  expiresAt: number;
};

type PdfCacheEntry = {
  bytes: ArrayBuffer;
  expiresAt: number;
};

const aiCache = new Map<string, AiCacheEntry>();
const aiInFlight = new Map<string, Promise<DashboardAiInsights>>();
const pdfCache = new Map<string, PdfCacheEntry>();

function nowMs() {
  return Date.now();
}

function pruneExpired<T extends { expiresAt: number }>(cache: Map<string, T>) {
  const now = nowMs();
  for (const [key, entry] of cache.entries()) {
    if (entry.expiresAt <= now) {
      cache.delete(key);
    }
  }
}

function trimOldest<T>(cache: Map<string, T>, maxEntries: number) {
  while (cache.size > maxEntries) {
    const oldestKey = cache.keys().next().value;
    if (!oldestKey) break;
    cache.delete(oldestKey);
  }
}

export async function getOrCreateDashboardAiInsights(
  key: string,
  loader: () => Promise<DashboardAiInsights>,
): Promise<DashboardAiInsights> {
  pruneExpired(aiCache);
  const cached = aiCache.get(key);
  if (cached) {
    return cached.value;
  }

  const pending = aiInFlight.get(key);
  if (pending) {
    return pending;
  }

  const next = loader()
    .then((value) => {
      aiCache.set(key, { value, expiresAt: nowMs() + AI_CACHE_TTL_MS });
      trimOldest(aiCache, MAX_AI_CACHE_ENTRIES);
      return value;
    })
    .finally(() => {
      aiInFlight.delete(key);
    });

  aiInFlight.set(key, next);
  return next;
}

export function getCachedDashboardPdfBytes(key: string): ArrayBuffer | undefined {
  pruneExpired(pdfCache);
  const cached = pdfCache.get(key);
  if (!cached) return undefined;
  return cached.bytes.slice(0);
}

export function setCachedDashboardPdfBytes(key: string, bytes: ArrayBuffer) {
  pdfCache.set(key, {
    bytes: bytes.slice(0),
    expiresAt: nowMs() + PDF_CACHE_TTL_MS,
  });
  trimOldest(pdfCache, MAX_PDF_CACHE_ENTRIES);
}
