import assert from 'node:assert/strict';
import test from 'node:test';
import { __resolveAppCheckProviderForTests } from './firebase';

test('app check provider resolver uses enterprise provider for non-debug site keys', () => {
  class FakeEnterpriseProvider {
    siteKey: string;

    constructor(siteKey: string) {
      this.siteKey = siteKey;
    }
  }

  const namespace = Object.assign(
    () => ({}),
    { ReCaptchaEnterpriseProvider: FakeEnterpriseProvider },
  );

  const provider = __resolveAppCheckProviderForTests(namespace, '6L-example-enterprise-key');
  assert.ok(provider instanceof FakeEnterpriseProvider);
  assert.equal((provider as FakeEnterpriseProvider).siteKey, '6L-example-enterprise-key');
});

test('app check provider resolver keeps debug-localhost site key as raw string', () => {
  class FakeEnterpriseProvider {
    siteKey: string;

    constructor(siteKey: string) {
      this.siteKey = siteKey;
    }
  }

  const namespace = Object.assign(
    () => ({}),
    { ReCaptchaEnterpriseProvider: FakeEnterpriseProvider },
  );

  const provider = __resolveAppCheckProviderForTests(namespace, 'debug-localhost-site-key');
  assert.equal(provider, 'debug-localhost-site-key');
});

test('app check provider resolver falls back to raw site key when enterprise provider is unavailable', () => {
  const namespace = Object.assign(
    () => ({}),
    {},
  );

  const provider = __resolveAppCheckProviderForTests(namespace, '6L-example-v3-key');
  assert.equal(provider, '6L-example-v3-key');
});
