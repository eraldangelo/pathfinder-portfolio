import { createHash } from 'node:crypto';
import { isIP } from 'node:net';
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';

type RateLimitConfig = {
  id: string;
  windowMs: number;
  max: number;
  message?: string;
  strategy?: 'auto' | 'memory' | 'firestore';
  subject?: string;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const MAX_BUCKETS = 5000;
const buckets = new Map<string, Bucket>();
const RATE_LIMIT_COLLECTION = '__rateLimits';
let bypassForTests = false;

const normalizeIp = (value: string) => {
  const trimmed = String(value || '').trim().toLowerCase();
  if (!trimmed) return '';
  return isIP(trimmed) ? trimmed : '';
};

const parseForwardedFor = (value: string) => {
  const entries = String(value || '')
    .split(',')
    .map((item) => normalizeIp(item))
    .filter(Boolean);
  if (!entries.length) return '';
  // Prefer the last valid forwarded IP to reduce spoofing via client-prepended values.
  return entries[entries.length - 1];
};

const normalizeSubject = (value: string) =>
  value.trim().toLowerCase().replace(/[^a-z0-9._:@-]+/g, '').slice(0, 64);

const getRequestIp = (request: Request) => {
  const cfConnectingIp = normalizeIp(request.headers.get('cf-connecting-ip') || '');
  if (cfConnectingIp) return cfConnectingIp;

  const realIp = normalizeIp(request.headers.get('x-real-ip') || '');
  if (realIp) return realIp;

  const forwardedFor = parseForwardedFor(request.headers.get('x-forwarded-for') || '');
  if (forwardedFor) return forwardedFor;

  return 'unknown';
};

const getRateLimitSubject = (request: Request, customSubject?: string) => {
  const ip = getRequestIp(request);
  const normalizedCustom = customSubject ? normalizeSubject(customSubject) : '';
  if (!normalizedCustom) return ip;
  return `${ip}:${normalizedCustom}`;
};

const getSharedDocId = (configId: string, subject: string) => {
  const hash = createHash('sha256').update(`${configId}:${subject}`).digest('hex');
  return `${configId}__${hash}`;
};

const pruneBuckets = (now: number) => {
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
  if (buckets.size <= MAX_BUCKETS) return;
  const overflow = buckets.size - MAX_BUCKETS;
  const keys = buckets.keys();
  for (let i = 0; i < overflow; i += 1) {
    const oldest = keys.next();
    if (oldest.done) break;
    buckets.delete(oldest.value);
  }
};

const enforceInMemoryRateLimit = (request: Request, config: RateLimitConfig) => {
  const now = Date.now();
  pruneBuckets(now);

  const key = `${config.id}:${getRateLimitSubject(request, config.subject)}`;
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + config.windowMs });
    return null;
  }

  existing.count += 1;
  if (existing.count <= config.max) {
    buckets.set(key, existing);
    return null;
  }

  const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  return NextResponse.json(
    { error: config.message || 'Too many requests. Please retry later.' },
    { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } },
  );
};

const enforceSharedFirestoreRateLimit = async (request: Request, config: RateLimitConfig) => {
  const now = Date.now();
  const subject = getRateLimitSubject(request, config.subject);
  const bucketId = getSharedDocId(config.id, subject);
  const db = getAdminDb();
  const bucketRef = db.collection(RATE_LIMIT_COLLECTION).doc(bucketId);

  const result = await db.runTransaction(async (tx) => {
    const snap = await tx.get(bucketRef);
    const data = snap.exists ? (snap.data() || {}) : {};
    const previousResetAt = Number(data.resetAtMs || 0);
    const previousCount = Number(data.count || 0);
    const activeWindow = previousResetAt > now;
    const resetAt = activeWindow ? previousResetAt : now + config.windowMs;
    const count = activeWindow ? previousCount + 1 : 1;

    tx.set(bucketRef, {
      bucket: config.id,
      count,
      resetAtMs: resetAt,
      expiresAt: new Date(resetAt),
      updatedAt: new Date(now),
    }, { merge: true });

    return { count, resetAt };
  });

  if (result.count <= config.max) return null;

  const retryAfterSeconds = Math.max(1, Math.ceil((result.resetAt - now) / 1000));
  return NextResponse.json(
    { error: config.message || 'Too many requests. Please retry later.' },
    { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } },
  );
};

export const enforceRateLimit = async (request: Request, config: RateLimitConfig) => {
  if (bypassForTests) return null;

  const strategy = config.strategy ?? 'auto';
  if (strategy === 'memory') {
    return enforceInMemoryRateLimit(request, config);
  }

  try {
    return await enforceSharedFirestoreRateLimit(request, config);
  } catch (error) {
    if (strategy === 'firestore') {
      throw error;
    }
    return enforceInMemoryRateLimit(request, config);
  }
};

export const __resolveRateLimitIpForTests = (request: Request) => getRequestIp(request);

export const __setRateLimitBypassForTests = (enabled: boolean) => {
  bypassForTests = enabled;
};
