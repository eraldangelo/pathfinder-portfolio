import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractBearerToken,
  isIdTokenVerificationError,
  readBearerToken,
  requireBearerToken,
  toUnauthorizedResponseFromVerifyError,
} from './auth';

test('extractBearerToken preserves existing non-trim behavior by default', () => {
  assert.equal(extractBearerToken('Bearer abc.def.ghi'), 'abc.def.ghi');
  assert.equal(extractBearerToken('Bearer token-with-space '), 'token-with-space ');
  assert.equal(extractBearerToken('bearer bad-prefix'), '');
  assert.equal(extractBearerToken(''), '');
});

test('extractBearerToken supports trim mode for routes that require it', () => {
  assert.equal(extractBearerToken('Bearer  spaced-token  ', { trim: true }), 'spaced-token');
});

test('readBearerToken reads token from authorization header', () => {
  const request = new Request('https://example.test', {
    headers: { authorization: 'Bearer token-123' },
  });
  assert.equal(readBearerToken(request), 'token-123');
});

test('requireBearerToken returns 401 JSON when token is missing', async () => {
  const request = new Request('https://example.test');
  const result = requireBearerToken(request);
  assert.equal(result.token, '');
  assert.equal(result.response?.status, 401);
  const body = await result.response?.json();
  assert.equal(body?.error, 'Missing token.');
});

test('isIdTokenVerificationError matches known Firebase token verification failures', () => {
  assert.equal(isIdTokenVerificationError({ code: 'auth/invalid-id-token' }), true);
  assert.equal(isIdTokenVerificationError({ code: 'auth/id-token-expired' }), true);
  assert.equal(isIdTokenVerificationError({ message: 'Firebase ID token has expired.' }), true);
  assert.equal(isIdTokenVerificationError({ code: 'auth/internal-error' }), false);
});

test('toUnauthorizedResponseFromVerifyError returns 401 for token verification failures only', async () => {
  const unauthorized = toUnauthorizedResponseFromVerifyError(
    { code: 'auth/id-token-revoked' },
    'Custom Unauthorized',
  );
  assert.equal(unauthorized?.status, 401);
  assert.equal((await unauthorized?.json())?.error, 'Custom Unauthorized');

  const nonAuth = toUnauthorizedResponseFromVerifyError({ code: 'auth/internal-error' });
  assert.equal(nonAuth, null);
});
