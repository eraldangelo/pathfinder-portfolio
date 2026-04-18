import { useEffect, useRef } from 'react';
import { auth, ensureFirebaseReady } from '../../../services/firebase';
import { isArchiveViewerRole } from '../../../utils/roles';
import type { User } from '../../../types';

interface UseYearlyArchiveRolloverParams {
  user: User | null;
  userRole: string | null;
}

const getManilaYear = () =>
  Number(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
    }).format(new Date())
  );

export const useYearlyArchiveRollover = ({ user, userRole }: UseYearlyArchiveRolloverParams) => {
  const hasAttemptedRef = useRef(false);

  useEffect(() => {
    if (!user || !userRole) return;
    if (!isArchiveViewerRole(userRole)) return;
    if (hasAttemptedRef.current) return;
    hasAttemptedRef.current = true;

    let cancelled = false;

    const run = async () => {
      try {
        const archiveYear = getManilaYear() - 1;
        const localStorageKey = `yearly-archive-rollover:${archiveYear}`;
        if (typeof window !== 'undefined' && window.localStorage.getItem(localStorageKey) === 'done') {
          return;
        }

        const ready = await ensureFirebaseReady();
        if (!ready || !auth?.currentUser || cancelled) return;

        const token = await auth.currentUser.getIdToken();
        if (cancelled) return;

        const response = await fetch('/api/archive/yearly-rollover', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (cancelled) return;

        if (response.ok || response.status === 409) {
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(localStorageKey, 'done');
          }
        }
      } catch (error) {
        console.error('Automatic yearly archive rollover failed:', error);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [user, userRole]);
};
