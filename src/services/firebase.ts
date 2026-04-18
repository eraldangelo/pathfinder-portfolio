import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';
import 'firebase/compat/functions';
import 'firebase/compat/app-check';
import { getPublicEnv, getPublicFirebaseConfig } from '@/config/publicClientEnv';
import {
  clearAppCheckTokenCache,
  forceRefreshAppCheckToken,
  isAppCheckTokenInvalidAuthError,
} from '@/services/firebaseAppCheckRecovery';

let firebaseApp: typeof firebase | null = null;
let persistenceEnabled = false;
let initPromise: Promise<boolean> | null = null;
let loggedMissingConfig = false;
let appCheckActivated = false;
let appCheckWarningLogged = false;
let appCheckDebugConfigured = false;
const APPCHECK_DEBUG_LOCALHOST_SITE_KEY = 'debug-localhost-site-key';

export let auth: any = null;
export let db: any = null;
export let storage: any = null;
export let functions: any = null;

export let EmailAuthProvider: any = null;
export let serverTimestamp: any = null;
export let Timestamp: any = null;
export let FieldValue: any = null;
export let arrayUnion: any = null;
export let arrayRemove: any = null;

const getMissingFirebaseKeys = (firebaseConfig: Record<string, string>) =>
  Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);

const isFirebaseInitialized = () => Array.isArray(firebase.apps) && firebase.apps.length > 0;

const getAppCheckSiteKey = () => getPublicEnv('NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY');
const getAppCheckDebugToken = () => getPublicEnv('NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN');

const resolveAppCheckProvider = (
  appCheckNamespace: ((...args: unknown[]) => unknown) & { ReCaptchaEnterpriseProvider?: new (siteKey: string) => unknown },
  siteKey: string,
) => {
  const normalizedSiteKey = String(siteKey || '').trim();
  if (!normalizedSiteKey) return null;
  if (normalizedSiteKey === APPCHECK_DEBUG_LOCALHOST_SITE_KEY) return normalizedSiteKey;

  const EnterpriseProvider = appCheckNamespace?.ReCaptchaEnterpriseProvider;
  if (typeof EnterpriseProvider === 'function') {
    return new EnterpriseProvider(normalizedSiteKey);
  }
  return normalizedSiteKey;
};

export const __resolveAppCheckProviderForTests = resolveAppCheckProvider;

const configureAppCheckDebugToken = () => {
  if (appCheckDebugConfigured || typeof window === 'undefined') return;
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    if ((window as any).FIREBASE_APPCHECK_DEBUG_TOKEN && !appCheckWarningLogged) {
      appCheckWarningLogged = true;
      console.error('[firebase] FIREBASE_APPCHECK_DEBUG_TOKEN is blocked in production.');
    }
    appCheckDebugConfigured = true;
    return;
  }

  const debugToken = getAppCheckDebugToken();
  if (!debugToken) return;
  (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken;
  appCheckDebugConfigured = true;
};

const activateAppCheck = () => {
  if (appCheckActivated || typeof window === 'undefined') return;
  const siteKey = getAppCheckSiteKey();
  if (!siteKey) return;

  configureAppCheckDebugToken();
  const appCheckFactory = (firebase as any).appCheck;
  if (typeof appCheckFactory !== 'function') {
    if (!appCheckWarningLogged) {
      appCheckWarningLogged = true;
      console.warn('[firebase] App Check is configured but firebase app-check is unavailable.');
    }
    return;
  }

  try {
    const provider = resolveAppCheckProvider(appCheckFactory as typeof appCheckFactory & { ReCaptchaEnterpriseProvider?: new (siteKey: string) => unknown }, siteKey);
    if (!provider) return;
    appCheckFactory().activate(provider, true);
    appCheckActivated = true;
  } catch (error) {
    if (!appCheckWarningLogged) {
      appCheckWarningLogged = true;
      console.warn('[firebase] Failed to activate App Check.', error);
    }
  }
};

const hydrateFirebaseExports = () => {
  firebaseApp = firebase;

  auth = firebase.auth ? firebase.auth() : null;
  db = firebase.firestore ? firebase.firestore() : null;
  storage = firebase.storage ? firebase.storage() : null;
  functions = firebase.functions ? firebase.functions() : null;

  EmailAuthProvider = firebase.auth?.EmailAuthProvider ?? null;
  serverTimestamp = firebase.firestore?.FieldValue?.serverTimestamp ?? null;
  Timestamp = firebase.firestore?.Timestamp ?? null;
  FieldValue = firebase.firestore?.FieldValue ?? null;
  arrayUnion = firebase.firestore?.FieldValue?.arrayUnion ?? null;
  arrayRemove = firebase.firestore?.FieldValue?.arrayRemove ?? null;

  if (firebase.firestore?.setLogLevel) {
    firebase.firestore.setLogLevel('silent');
  }

  if (db && !persistenceEnabled) {
    persistenceEnabled = true;
    db.enablePersistence({ synchronizeTabs: true }).catch((err: any) => {
      if (err?.code === 'failed-precondition') {
        console.info("Firestore persistence not enabled in this tab because it's already active in another tab.");
      } else if (err?.code === 'unimplemented') {
        console.warn('This browser does not support Firestore offline persistence.');
      }
    });
  }
};

const initializeFirebase = () => {
  if (typeof window === 'undefined') return false;

  if (!isFirebaseInitialized()) {
    const firebaseConfig = getPublicFirebaseConfig();
    const missingFirebaseKeys = getMissingFirebaseKeys(firebaseConfig);
    if (missingFirebaseKeys.length > 0) {
      if (!loggedMissingConfig) {
        loggedMissingConfig = true;
        console.warn('[firebase] Missing env vars:', missingFirebaseKeys.join(', '));
      }
      return false;
    }
    firebase.initializeApp(firebaseConfig);
  }

  activateAppCheck();
  hydrateFirebaseExports();
  return true;
};

export const ensureFirebaseReady = async (options?: { timeoutMs?: number; pollIntervalMs?: number }) => {
  if (initializeFirebase()) return true;
  if (!initPromise) {
    const timeoutMs = options?.timeoutMs ?? 8000;
    const pollIntervalMs = options?.pollIntervalMs ?? 50;
    initPromise = new Promise<boolean>((resolve) => {
      const startedAt = Date.now();
      const timer = setInterval(() => {
        if (initializeFirebase()) {
          clearInterval(timer);
          resolve(true);
          return;
        }
        if (Date.now() - startedAt >= timeoutMs) {
          clearInterval(timer);
          resolve(false);
        }
      }, pollIntervalMs);
    });
  }
  return initPromise;
};

export const signInWithEmailAndPasswordWithAppCheckRecovery = async (email: string, password: string) => {
  if (!auth?.signInWithEmailAndPassword) {
    throw new Error('Firebase auth is not initialized.');
  }

  try {
    return await auth.signInWithEmailAndPassword(email, password);
  } catch (error) {
    if (!isAppCheckTokenInvalidAuthError(error)) throw error;

    await clearAppCheckTokenCache();
    const refreshed = await forceRefreshAppCheckToken(firebase);
    if (!refreshed) throw error;
    return auth.signInWithEmailAndPassword(email, password);
  }
};

if (typeof window !== 'undefined') {
  initializeFirebase();
}

export const onConnectivityChanged = (callback: (isOnline: boolean) => void): (() => void) => {
  let unsubscribe: (() => void) | null = null;
  let cancelled = false;

  ensureFirebaseReady().then((ready) => {
    if (cancelled) return;
    if (!ready || !db) {
      callback(false);
      return;
    }
    unsubscribe = db.collection('_connectivity-check').doc('ping').onSnapshot(
      () => {
        callback(true);
      },
      (error: any) => {
        if (error.code === 'unavailable') {
          callback(false);
        } else {
          callback(false);
        }
      },
    );
  });

  return () => {
    cancelled = true;
    if (unsubscribe) {
      unsubscribe();
    }
  };
};

export interface FirebaseUser {
  readonly uid: string;
  readonly email: string | null;
  readonly displayName: string | null;
  readonly photoURL: string | null;
  reauthenticateWithCredential(credential: any): Promise<any>;
  updatePassword(password: string): Promise<void>;
  updateProfile(profile: { displayName?: string | null; photoURL?: string | null }): Promise<void>;
  delete(): Promise<void>;
}

export { firebaseApp };
