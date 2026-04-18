const APPCHECK_TOKEN_CACHE_DB_NAME = 'firebase-app-check-database';
const APP_CHECK_INVALID_AUTH_CODES = new Set([
  'auth/firebase-app-check-token-is-invalid',
  'auth/app-check-token-invalid',
]);

export const isAppCheckTokenInvalidAuthError = (error: unknown) => {
  const code = String((error as { code?: unknown } | null)?.code || '').trim().toLowerCase();
  return APP_CHECK_INVALID_AUTH_CODES.has(code);
};

export const clearAppCheckTokenCache = async () => {
  if (typeof indexedDB === 'undefined') return;

  await new Promise<void>((resolve) => {
    try {
      const request = indexedDB.deleteDatabase(APPCHECK_TOKEN_CACHE_DB_NAME);
      const done = () => resolve();
      request.onsuccess = done;
      request.onerror = done;
      request.onblocked = done;
    } catch {
      resolve();
    }
  });
};

export const forceRefreshAppCheckToken = async (firebaseCompatApp: unknown) => {
  const appCheckFactory = (firebaseCompatApp as { appCheck?: unknown } | null)?.appCheck;
  if (typeof appCheckFactory !== 'function') return false;

  try {
    const appCheckInstance = appCheckFactory();
    if (!appCheckInstance || typeof appCheckInstance.getToken !== 'function') return false;
    await appCheckInstance.getToken(true);
    return true;
  } catch (error) {
    console.warn('[firebase] Failed to refresh App Check token.', error);
    return false;
  }
};
