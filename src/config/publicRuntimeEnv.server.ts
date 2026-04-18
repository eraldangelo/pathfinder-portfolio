import { PUBLIC_ENV_KEYS, type PublicEnvKey } from '@/config/publicEnvKeys';

export type PublicRuntimeEnv = Partial<Record<PublicEnvKey, string>>;

const sanitizeValue = (value: string | undefined): string => (value || '').trim();
const APPCHECK_DEBUG_TOKEN_KEY = 'NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN';

export const getPublicRuntimeEnv = (): PublicRuntimeEnv => {
  const env: PublicRuntimeEnv = {};
  const isProduction = process.env.NODE_ENV === 'production';
  const hasDebugTokenInProcess = Boolean(sanitizeValue(process.env[APPCHECK_DEBUG_TOKEN_KEY]));
  if (isProduction && hasDebugTokenInProcess) {
    console.error(
      '[public-env] Blocking NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN exposure in production runtime env.',
    );
  }

  for (const key of PUBLIC_ENV_KEYS) {
    if (isProduction && key === APPCHECK_DEBUG_TOKEN_KEY) continue;
    const value = sanitizeValue(process.env[key]);
    if (value) {
      env[key] = value;
    }
  }
  return env;
};
