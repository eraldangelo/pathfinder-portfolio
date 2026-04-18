import test from 'node:test';
import assert from 'node:assert/strict';
import {
  __shouldAttemptHttpsFallbackForTests,
  assertAllowedOutboundUrl,
  isAllowedOutboundUrl,
  safeServerFetch,
} from './safeFetch';

test('isAllowedOutboundUrl allows approved external hosts over https', () => {
  assert.equal(isAllowedOutboundUrl('https://api.openai.com/v1/responses'), true);
  assert.equal(
    isAllowedOutboundUrl('https://challenges.cloudflare.com/turnstile/v0/siteverify'),
    true,
  );
  assert.equal(
    isAllowedOutboundUrl('https://nominatim.openstreetmap.org/search?q=manila'),
    true,
  );
  assert.equal(
    isAllowedOutboundUrl('https://maps.googleapis.com/maps/api/geocode/json?address=manila'),
    true,
  );
});

test('isAllowedOutboundUrl blocks unknown hosts and non-https schemes', () => {
  assert.equal(isAllowedOutboundUrl('http://api.openai.com/v1/responses'), false);
  assert.equal(isAllowedOutboundUrl('https://example.com/api'), false);
  assert.equal(isAllowedOutboundUrl('/relative/path'), false);
});

test('assertAllowedOutboundUrl throws for blocked targets', () => {
  assert.doesNotThrow(() =>
    assertAllowedOutboundUrl('https://api.openai.com/v1/responses'),
  );
  assert.throws(
    () => assertAllowedOutboundUrl('https://evil.example.com/hijack'),
    /Blocked outbound request host/,
  );
});

test('safeServerFetch aborts timed-out requests', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = ((_input: RequestInfo | URL, init?: RequestInit) =>
    new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => {
        reject(new DOMException('aborted', 'AbortError'));
      });
    })) as typeof fetch;

  try {
    await assert.rejects(
      safeServerFetch('https://api.openai.com/v1/responses', undefined, { timeoutMs: 10 }),
      /AbortError/,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('safeServerFetch retryable-cause classifier only falls back for transient network failures', () => {
  assert.equal(
    __shouldAttemptHttpsFallbackForTests({ cause: { code: 'ETIMEDOUT' } }),
    true,
  );
  assert.equal(
    __shouldAttemptHttpsFallbackForTests({ cause: { code: 'ECONNRESET' } }),
    true,
  );
  assert.equal(
    __shouldAttemptHttpsFallbackForTests({ cause: { code: 'CERT_HAS_EXPIRED' } }),
    false,
  );
  assert.equal(
    __shouldAttemptHttpsFallbackForTests({ name: 'AbortError' }),
    false,
  );
});
