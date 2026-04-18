'use client';

import React, { useEffect, useState } from 'react';
import App from '@/components/app/App';
import { AppLoadingState } from '@/components/app/AppStates';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { NetworkStatusProvider } from '@/contexts/NetworkStatusContext';
import ErrorBoundary from '@/components/common/components/ErrorBoundary';
import { ensureFirebaseReady } from '@/services/firebase';

const AppRoot: React.FC = () => {
  const [firebaseState, setFirebaseState] = useState<'loading' | 'ready' | 'error'>('loading');

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

  if (firebaseState === 'loading') {
    return <AppLoadingState />;
  }

  if (firebaseState === 'error') {
    return (
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
  }

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <NetworkStatusProvider>
          <App />
        </NetworkStatusProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
};

export default AppRoot;
