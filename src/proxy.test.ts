import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { proxy } from './proxy';

const withNodeEnv = async (value: string, fn: () => Promise<void> | void) => {
  const env = process.env as Record<string, string | undefined>;
  const previous = process.env.NODE_ENV;
  env.NODE_ENV = value;
  try {
    await fn();
  } finally {
    env.NODE_ENV = previous;
  }
};

const buildRequest = (url: string, headers?: Record<string, string>) =>
  new NextRequest(url, { headers: headers || {} });

test('proxy applies security headers on non-production pass-through', async () => {
  await withNodeEnv('development', () => {
    const response = proxy(buildRequest('https://localhost:3000/login'));
    const csp = String(response.headers.get('content-security-policy'));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('x-frame-options'), 'DENY');
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(response.headers.get('x-dns-prefetch-control'), 'off');
    assert.equal(response.headers.get('x-download-options'), 'noopen');
    assert.match(csp, /default-src 'self'/);
    assert.match(csp, /script-src-attr 'none'/);
    assert.match(csp, /script-src 'self' 'unsafe-inline'/);
    assert.equal(response.headers.get('strict-transport-security'), null);
  });
});

test('proxy redirects non-canonical run.app host in production', async () => {
  await withNodeEnv('production', () => {
    const response = proxy(
      buildRequest('https://sample-foo-123.asia-southeast1.run.app/', {
        'x-forwarded-host': 'sample-foo-123.asia-southeast1.run.app',
      }),
    );
    assert.equal(response.status, 308);
    assert.equal(
      response.headers.get('location'),
      'https://your-app.example.com/',
    );
    assert.equal(response.headers.get('x-frame-options'), 'DENY');
    assert.equal(
      response.headers.get('strict-transport-security'),
      'max-age=31536000; includeSubDomains',
    );
  });
});

test('proxy keeps canonical host in production and preserves security headers', async () => {
  await withNodeEnv('production', () => {
    const response = proxy(
      buildRequest('https://your-app.example.com/navigation'),
    );
    const csp = String(response.headers.get('content-security-policy'));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('location'), null);
    assert.equal(response.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
    assert.equal(response.headers.get('cross-origin-opener-policy'), 'same-origin');
    assert.match(csp, /upgrade-insecure-requests/);
    assert.match(csp, /script-src 'self' 'unsafe-inline'/);
    assert.ok(!csp.includes('https://unpkg.com'));
  });
});
