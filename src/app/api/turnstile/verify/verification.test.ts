import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveTurnstileAllowedHostnames, validateTurnstileVerification } from './verification';

test('resolveTurnstileAllowedHostnames includes request host and env allowlist', () => {
  const hosts = resolveTurnstileAllowedHostnames(
    'Your-App.Example.Com:443',
    'studio.example.com, localhost:3000',
  );
  assert.deepEqual(hosts, [
    'your-app.example.com',
    'studio.example.com',
    'localhost',
  ]);
});

test('validateTurnstileVerification accepts success with matching hostname and action', () => {
  const result = validateTurnstileVerification(
    {
      success: true,
      hostname: 'your-app.example.com',
      action: 'login',
    },
    {
      requestHost: 'your-app.example.com',
      expectedAction: 'login',
      allowedHostnames: ['your-app.example.com'],
    },
  );
  assert.equal(result.ok, true);
});

test('validateTurnstileVerification fails closed on hostname mismatch', () => {
  const result = validateTurnstileVerification(
    {
      success: true,
      hostname: 'evil.example.com',
      action: 'login',
    },
    {
      requestHost: 'your-app.example.com',
      expectedAction: 'login',
      allowedHostnames: ['your-app.example.com'],
    },
  );
  assert.equal(result.ok, false);
  assert.equal(result.message, 'Captcha host mismatch.');
});

test('validateTurnstileVerification fails closed on action mismatch', () => {
  const result = validateTurnstileVerification(
    {
      success: true,
      hostname: 'your-app.example.com',
      action: 'signup',
    },
    {
      requestHost: 'your-app.example.com',
      expectedAction: 'login',
      allowedHostnames: ['your-app.example.com'],
    },
  );
  assert.equal(result.ok, false);
  assert.equal(result.message, 'Captcha action mismatch.');
});
