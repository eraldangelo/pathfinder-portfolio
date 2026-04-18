import assert from 'node:assert/strict';
import test from 'node:test';
import { isAppCheckTokenInvalidAuthError } from './firebaseAppCheckRecovery';

test('detects Firebase auth app-check invalid token error code', () => {
  assert.equal(
    isAppCheckTokenInvalidAuthError({ code: 'auth/firebase-app-check-token-is-invalid' }),
    true,
  );
});

test('detects compat app-check invalid token alias error code', () => {
  assert.equal(
    isAppCheckTokenInvalidAuthError({ code: 'auth/app-check-token-invalid' }),
    true,
  );
});

test('ignores unrelated or missing error codes', () => {
  assert.equal(
    isAppCheckTokenInvalidAuthError({ code: 'auth/wrong-password' }),
    false,
  );
  assert.equal(isAppCheckTokenInvalidAuthError({}), false);
  assert.equal(isAppCheckTokenInvalidAuthError(null), false);
});
