import test from 'node:test';
import assert from 'node:assert/strict';
import { getPublicRuntimeEnv } from './publicRuntimeEnv.server';

const withEnv = async (
  values: Record<string, string | undefined>,
  run: () => Promise<void> | void,
) => {
  const env = process.env as Record<string, string | undefined>;
  const previous: Record<string, string | undefined> = {};

  for (const [key, value] of Object.entries(values)) {
    previous[key] = env[key];
    if (value === undefined) {
      delete env[key];
    } else {
      env[key] = value;
    }
  }

  try {
    await run();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete env[key];
      } else {
        env[key] = value;
      }
    }
  }
};

test('getPublicRuntimeEnv blocks App Check debug token in production', async () => {
  await withEnv(
    {
      NODE_ENV: 'production',
      NEXT_PUBLIC_FIREBASE_API_KEY: 'api-key',
      NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN: 'debug-token',
    },
    () => {
      const env = getPublicRuntimeEnv();
      assert.equal(env.NEXT_PUBLIC_FIREBASE_API_KEY, 'api-key');
      assert.equal(env.NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN, undefined);
    },
  );
});

test('getPublicRuntimeEnv keeps App Check debug token in development', async () => {
  await withEnv(
    {
      NODE_ENV: 'development',
      NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN: 'debug-token',
    },
    () => {
      const env = getPublicRuntimeEnv();
      assert.equal(env.NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN, 'debug-token');
    },
  );
});
