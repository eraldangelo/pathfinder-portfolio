import test from 'node:test';
import assert from 'node:assert/strict';
import { __parseRuntimeEnvPayloadForTests } from './publicClientEnv';

test('__parseRuntimeEnvPayloadForTests parses valid runtime env JSON payload', () => {
  const payload = __parseRuntimeEnvPayloadForTests(
    JSON.stringify({
      NEXT_PUBLIC_FIREBASE_API_KEY: 'api-key',
      NEXT_PUBLIC_STUDYNAVI_URL: 'https://studynavi.example.com',
    }),
  );
  assert.equal(payload.NEXT_PUBLIC_FIREBASE_API_KEY, 'api-key');
  assert.equal(payload.NEXT_PUBLIC_STUDYNAVI_URL, 'https://studynavi.example.com');
});

test('__parseRuntimeEnvPayloadForTests returns empty object for invalid JSON', () => {
  const payload = __parseRuntimeEnvPayloadForTests('{bad-json');
  assert.deepEqual(payload, {});
});

test('__parseRuntimeEnvPayloadForTests returns empty object for non-object JSON payload', () => {
  const payload = __parseRuntimeEnvPayloadForTests('"string-value"');
  assert.deepEqual(payload, {});
});
