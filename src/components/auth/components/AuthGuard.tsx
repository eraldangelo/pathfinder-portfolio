'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AppLoadingState } from '@/components/app/AppStates';
import { auth, ensureFirebaseReady } from '@/services/firebase';

type AuthStatus = 'loading' | 'authed' | 'guest' | 'error';

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

const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | null = null;

    ensureFirebaseReady({ timeoutMs: 8000 }).then((ready) => {
      if (cancelled) return;
      if (!ready || !auth) {
        setStatus('error');
        return;
      }

      unsubscribe = auth.onAuthStateChanged((user: any) => {
        if (cancelled) return;
        setStatus(user ? 'authed' : 'guest');
      });
    });

    return () => {
      cancelled = true;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const redirectUrl = useMemo(() => {
    const qs = searchParams?.toString();
    const currentUrl = `${pathname}${qs ? `?${qs}` : ''}`;
    return `/login?next=${encodeURIComponent(currentUrl)}`;
  }, [pathname, searchParams]);

  useEffect(() => {
    if (status !== 'guest') return;
    if (pathname === '/login') return;
    router.replace(redirectUrl);

    // Fallback for cases where client routing stalls: force a hard navigation.
    const timer = window.setTimeout(() => {
      window.location.replace(redirectUrl);
    }, 500);
    return () => {
      window.clearTimeout(timer);
    };
  }, [status, pathname, router, redirectUrl]);

  if (status === 'loading') return <AppLoadingState />;
  if (status === 'error') return <FirebaseInitError />;
  if (status === 'guest') return <AppLoadingState />;

  return <>{children}</>;
};

export default AuthGuard;
