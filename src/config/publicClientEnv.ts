import type { PublicEnvKey } from '@/config/publicEnvKeys';
import type { PublicRuntimeEnv } from '@/config/publicRuntimeEnv.server';

declare global {
  interface Window {
    __PATHFINDER_PUBLIC_ENV__?: PublicRuntimeEnv;
  }
}

const BUILD_PUBLIC_ENV: Record<PublicEnvKey, string> = {
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '',
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? '',
  NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY: process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY ?? '',
  // Prevent build-time leakage of debug tokens into production client bundles.
  NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN: '',
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '',
  NEXT_PUBLIC_STUDYNAVI_URL: process.env.NEXT_PUBLIC_STUDYNAVI_URL ?? '',
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
  NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? '',
  NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID_DARK: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID_DARK ?? '',
  NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID_LIGHT: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID_LIGHT ?? '',
};

const normalize = (value: string | undefined): string => (value || '').trim();

const hasRuntimeValueForKey = (env: PublicRuntimeEnv | undefined, key: PublicEnvKey): boolean =>
  Boolean(normalize(env?.[key]));

export const __parseRuntimeEnvPayloadForTests = (jsonCandidate: string): PublicRuntimeEnv => {
  if (!jsonCandidate) return {};
  try {
    const parsed = JSON.parse(jsonCandidate) as PublicRuntimeEnv;
    if (parsed && typeof parsed === 'object') return parsed;
  } catch {
    return {};
  }
  return {};
};

const hydrateRuntimeEnvFromInlineScript = (): PublicRuntimeEnv => {
  if (typeof window === 'undefined') return {};
  const existing = window.__PATHFINDER_PUBLIC_ENV__;
  if (existing && Object.keys(existing).length > 0) return existing;

  const envNode = document.getElementById('pathfinder-public-env');
  const metaJson = normalize(envNode?.getAttribute('data-public-env') || '');
  if (metaJson) {
    const parsed = __parseRuntimeEnvPayloadForTests(metaJson);
    if (Object.keys(parsed).length > 0) {
      window.__PATHFINDER_PUBLIC_ENV__ = parsed;
      return parsed;
    }
  }

  // Legacy fallback for older cached layouts that still used inline assignment.
  const legacyRawText = envNode?.textContent || '';
  const assignmentPrefix = 'window.__PATHFINDER_PUBLIC_ENV__=';
  const assignmentIndex = legacyRawText.indexOf(assignmentPrefix);
  if (assignmentIndex >= 0) {
    const jsonStart = assignmentIndex + assignmentPrefix.length;
    const jsonCandidate = legacyRawText.slice(jsonStart).trim().replace(/;$/, '');
    const parsed = __parseRuntimeEnvPayloadForTests(jsonCandidate);
    if (Object.keys(parsed).length > 0) {
      window.__PATHFINDER_PUBLIC_ENV__ = parsed;
      return parsed;
    }
  }

  return {};
};

const getRuntimePublicEnv = (key: PublicEnvKey): PublicRuntimeEnv => {
  if (typeof window === 'undefined') return {};

  const existing = window.__PATHFINDER_PUBLIC_ENV__;
  if (hasRuntimeValueForKey(existing, key)) {
    return existing ?? {};
  }

  return hydrateRuntimeEnvFromInlineScript();
};

export const getPublicEnv = (key: PublicEnvKey): string => {
  const buildValue = normalize(BUILD_PUBLIC_ENV[key]);
  if (buildValue) return buildValue;
  const runtimeValue = normalize(getRuntimePublicEnv(key)[key]);
  return runtimeValue;
};

export const waitForPublicEnv = async (
  key: PublicEnvKey,
  options?: { timeoutMs?: number; pollIntervalMs?: number },
): Promise<string> => {
  const immediate = getPublicEnv(key);
  if (immediate) return immediate;

  if (typeof window === 'undefined') return '';

  const timeoutMs = options?.timeoutMs ?? 4000;
  const pollIntervalMs = options?.pollIntervalMs ?? 50;
  const startedAt = Date.now();

  return new Promise<string>((resolve) => {
    const timer = window.setInterval(() => {
      const value = getPublicEnv(key);
      if (value) {
        window.clearInterval(timer);
        resolve(value);
        return;
      }
      if (Date.now() - startedAt >= timeoutMs) {
        window.clearInterval(timer);
        resolve('');
      }
    }, pollIntervalMs);
  });
};

export const getPublicFirebaseConfig = () => ({
  apiKey: getPublicEnv('NEXT_PUBLIC_FIREBASE_API_KEY'),
  authDomain: getPublicEnv('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: getPublicEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: getPublicEnv('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getPublicEnv('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getPublicEnv('NEXT_PUBLIC_FIREBASE_APP_ID'),
  measurementId: getPublicEnv('NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID'),
});
