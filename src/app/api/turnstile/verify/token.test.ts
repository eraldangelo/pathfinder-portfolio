import test from 'node:test';
import assert from 'node:assert/strict';
import { parseTurnstileToken } from './token';

test('parseTurnstileToken extracts token from JSON payload', async () => {
  const request = new Request('https://example.test', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token: 'json-token' }),
  });
  const parsed = await parseTurnstileToken(request);
  assert.equal(parsed.response, null);
  assert.equal(parsed.token, 'json-token');
});

test('parseTurnstileToken supports cf-turnstile-response alias', async () => {
  const request = new Request('https://example.test', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ 'cf-turnstile-response': 'alias-token' }),
  });
  const parsed = await parseTurnstileToken(request);
  assert.equal(parsed.response, null);
  assert.equal(parsed.token, 'alias-token');
});

test('parseTurnstileToken extracts token from form payload', async () => {
  const form = new URLSearchParams();
  form.set('cf-turnstile-response', 'form-token');
  const request = new Request('https://example.test', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  });
  const parsed = await parseTurnstileToken(request);
  assert.equal(parsed.response, null);
  assert.equal(parsed.token, 'form-token');
});

test('parseTurnstileToken returns empty string when token is missing', async () => {
  const request = new Request('https://example.test', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({}),
  });
  const parsed = await parseTurnstileToken(request);
  assert.equal(parsed.response, null);
  assert.equal(parsed.token, '');
});

test('parseTurnstileToken returns 413 response when payload exceeds configured limit', async () => {
  const request = new Request('https://example.test', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token: 'x'.repeat(5000) }),
  });
  const parsed = await parseTurnstileToken(request, { maxBytes: 512 });
  assert.equal(parsed.token, '');
  assert.equal(parsed.response?.status, 413);
});
