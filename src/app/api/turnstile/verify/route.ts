import { NextResponse } from 'next/server';
import { parseTurnstileToken } from './token';
import { enforceRateLimit } from '@/app/api/_shared/rateLimit';
import { safeServerFetch } from '@/app/api/_shared/safeFetch';
import { resolveTurnstileAllowedHostnames, validateTurnstileVerification } from './verification';

const resolveRequestHost = (request: Request) => {
  const headerHost = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
  const fallback = (() => {
    try {
      return new URL(request.url).host;
    } catch {
      return '';
    }
  })();
  return String(headerHost || fallback).split(',')[0]?.trim().toLowerCase().split(':')[0] || '';
};

const resolveRequestIp = (request: Request) =>
  String(
    request.headers.get('cf-connecting-ip')
    || request.headers.get('x-forwarded-for')
    || request.headers.get('x-real-ip')
    || '',
  )
    .split(',')[0]
    .trim();

const RETRYABLE_UPSTREAM_ERROR_CODES = new Set([
  'ETIMEDOUT',
  'ECONNRESET',
  'ECONNREFUSED',
  'ENOTFOUND',
  'EAI_AGAIN',
  'ENETUNREACH',
]);

const isRetryableUpstreamTurnstileError = (error: unknown) => {
  const candidate = error as {
    name?: string;
    code?: string;
    errors?: Array<{ code?: string }>;
    cause?: { code?: string; name?: string };
  } | null;

  const errorName = String(candidate?.name || '').trim();
  if (errorName === 'AbortError') return true;

  const topLevelCode = String(candidate?.code || '').trim().toUpperCase();
  if (RETRYABLE_UPSTREAM_ERROR_CODES.has(topLevelCode)) return true;

  const nestedErrors = Array.isArray(candidate?.errors) ? candidate.errors : [];
  if (nestedErrors.some((item) => RETRYABLE_UPSTREAM_ERROR_CODES.has(String(item?.code || '').trim().toUpperCase()))) {
    return true;
  }

  const causeCode = String(candidate?.cause?.code || '').trim().toUpperCase();
  if (RETRYABLE_UPSTREAM_ERROR_CODES.has(causeCode)) {
    return true;
  }

  const causeName = String(candidate?.cause?.name || '').trim();
  return causeName === 'AbortError';
};

export async function POST(request: Request) {
    try {
        const rateLimit = await enforceRateLimit(request, {
            id: 'turnstile-verify',
            windowMs: 60_000,
            max: 30,
        });
        if (rateLimit) return rateLimit;

        const parsedToken = await parseTurnstileToken(request, {
            maxBytes: 8 * 1024,
            tooLargeMessage: 'Turnstile payload is too large.',
        });
        if (parsedToken.response) {
            return parsedToken.response;
        }
        const token = parsedToken.token;

        if (!token) {
            return NextResponse.json({ ok: false, message: 'Captcha verification required.' }, { status: 400 });
        }

        const secret = String(process.env.TURNSTILE_SECRET_KEY || '').trim();
        if (!secret) {
            return NextResponse.json({ ok: false, message: 'Server misconfiguration.' }, { status: 500 });
        }

        const verifyResponse = await safeServerFetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                secret,
                response: token,
                remoteip: resolveRequestIp(request),
            }),
        }, { timeoutMs: 8000 });
        if (!verifyResponse.ok) {
            return NextResponse.json({ ok: false, message: 'Captcha verification failed.' }, { status: 502 });
        }

        const verification = await verifyResponse.json();
        const requestHost = resolveRequestHost(request);
        const validation = validateTurnstileVerification(verification || {}, {
            requestHost,
            expectedAction: String(process.env.TURNSTILE_EXPECTED_ACTION || 'login'),
            allowedHostnames: resolveTurnstileAllowedHostnames(
                requestHost,
                process.env.TURNSTILE_ALLOWED_HOSTNAMES,
            ),
        });
        if (!validation.ok) {
            console.warn('[turnstile] verification mismatch:', validation.message, {
                hostname: String(verification?.hostname || ''),
                action: String(verification?.action || ''),
                requestHost,
            });
            return NextResponse.json({ ok: false, message: 'Captcha verification failed.' }, { status: 403 });
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        if (isRetryableUpstreamTurnstileError(error)) {
            console.error('[turnstile] verify upstream timeout/network error', error);
            return NextResponse.json(
                { ok: false, message: 'Captcha verification is temporarily unavailable. Please retry.' },
                { status: 503, headers: { 'Retry-After': '5' } },
            );
        }
        console.error('[turnstile] verify error', error);
        return NextResponse.json({ ok: false, message: 'Captcha verification failed.' }, { status: 500 });
    }
}
