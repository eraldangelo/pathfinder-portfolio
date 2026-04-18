'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppLoadingState, AppLoginState } from '@/components/app/AppStates';
import { useAppReady } from '@/components/app/hooks/useAppReady';
import { useNotifications } from '@/components/app/hooks/useNotifications';
import ErrorBoundary from '@/components/common/components/ErrorBoundary';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { NetworkStatusProvider } from '@/contexts/NetworkStatusContext';
import { auth, ensureFirebaseReady } from '@/services/firebase';

const FirebaseInitError = () => (
  <div className="flex items-center justify-center min-h-screen bg-red-50 dark:bg-red-900/20">
    <div className="w-full max-w-lg p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-red-200 dark:border-red-700">
      <h1 className="text-2xl font-bold text-red-700 dark:text-red-400">Firebase failed to initialize.</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-300">
        Please confirm your Firebase env variables in{' '}
        <code className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-900/50">.env.local</code> and refresh the page.
      </p>
    </div>
  </div>
);

const LoginClient = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [firebaseState, setFirebaseState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [isLoading, setIsLoading] = useState(false);
  const { isReady } = useAppReady(isLoading);
  const { showPopup } = useNotifications();
  const [authError, setAuthError] = useState<string | null>(null);

  const nextTarget = useMemo(() => {
    const nextParam = searchParams?.get('next');
    if (!nextParam || !nextParam.startsWith('/') || nextParam.startsWith('/login')) {
      return '/navigation';
    }
    return nextParam;
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    ensureFirebaseReady({ timeoutMs: 8000 }).then((ready) => {
      if (cancelled) return;
      setFirebaseState(ready ? 'ready' : 'error');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (firebaseState !== 'ready' || !auth) return;
    const unsubscribe = auth.onAuthStateChanged((user: any) => {
      if (user) {
        router.replace(nextTarget);
      }
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [firebaseState, nextTarget, router]);

  if (firebaseState === 'loading') {
    return <AppLoadingState />;
  }

  if (firebaseState === 'error') {
    return <FirebaseInitError />;
  }

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <NetworkStatusProvider>
          <AppLoginState
            showPopup={showPopup}
            setIsLoading={setIsLoading}
            isReady={isReady}
            authError={authError}
            clearAuthError={() => setAuthError(null)}
          />
        </NetworkStatusProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
};

export default LoginClient;
