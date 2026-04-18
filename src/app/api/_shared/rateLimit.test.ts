import test from 'node:test';
import assert from 'node:assert/strict';
import { __resolveRateLimitIpForTests, __setRateLimitBypassForTests, enforceRateLimit } from './rateLimit';

const buildRequest = (headers: Record<string, string>) =>
  new Request('https://example.test/api', { headers });

test('rate limit IP resolver prefers cf-connecting-ip when present', () => {
  const ip = __resolveRateLimitIpForTests(
    buildRequest({
      'cf-connecting-ip': '203.0.113.10',
      'x-real-ip': '198.51.100.9',
      'x-forwarded-for': '198.51.100.8, 198.51.100.7',
    }),
  );
  assert.equal(ip, '203.0.113.10');
});

test('rate limit IP resolver falls back to x-real-ip when cf-connecting-ip is missing', () => {
  const ip = __resolveRateLimitIpForTests(
    buildRequest({
      'x-real-ip': '198.51.100.9',
      'x-forwarded-for': '198.51.100.8, 198.51.100.7',
    }),
  );
  assert.equal(ip, '198.51.100.9');
});

test('rate limit IP resolver uses the last valid x-forwarded-for entry', () => {
  const ip = __resolveRateLimitIpForTests(
    buildRequest({
      'x-forwarded-for': 'not-an-ip, 198.51.100.5, 198.51.100.6',
    }),
  );
  assert.equal(ip, '198.51.100.6');
});

test('rate limit IP resolver returns unknown when no trusted header has a valid IP', () => {
  const ip = __resolveRateLimitIpForTests(
    buildRequest({
      'x-forwarded-for': 'spoofed-value',
    }),
  );
  assert.equal(ip, 'unknown');
});

test('rate limit bypass toggle skips enforcement for route-matrix tests', async () => {
  __setRateLimitBypassForTests(true);
  try {
    const result = await enforceRateLimit(buildRequest({}), {
      id: 'rate-limit-bypass-smoke',
      windowMs: 1000,
      max: 1,
      strategy: 'memory',
    });
    assert.equal(result, null);
  } finally {
    __setRateLimitBypassForTests(false);
  }
});
