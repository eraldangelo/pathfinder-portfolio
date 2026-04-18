import { useCallback, useEffect, useMemo, useState } from 'react';
import type { TimeLogEntry, TimeTrackingStatus, User } from '../../../types';
import type { ConfirmModalState } from './useConfirmModal';
import { ClockIcon } from '../icons';
import { db, ensureFirebaseReady } from '../../../services/firebase';
import {
    buildTimeLogEntries,
    deriveTimeTrackingStatus,
    getLocalDateKey,
    getNextTimesheetReset,
    type FirestoreTimesheetDoc,
    type TimesheetEventKey,
} from '../../../utils/timesheet';
import { persistTimeEvent } from './timeTracking/timeTrackingActions';

interface UseTimeTrackingParams {
    t: (key: string, options?: { [key: string]: string | number } | string) => string;
    showPopup: (message: string, meta?: { eventKey?: string }) => void;
    openConfirm: (payload: Omit<ConfirmModalState, 'isOpen'>) => void;
    closeConfirm: () => void;
    user: User | null;
    userRole: string | null;
}

export const useTimeTracking = ({ t, showPopup, openConfirm, closeConfirm, user, userRole }: UseTimeTrackingParams) => {
    const [timeTrackingStatus, setTimeTrackingStatus] = useState<TimeTrackingStatus>('timed-out');
    const [timeLog, setTimeLog] = useState<TimeLogEntry[]>([]);
    const [activeDateKey, setActiveDateKey] = useState(() => getLocalDateKey(new Date()));

    const addTimeLogEntry = useCallback((event: string, eventKey: string, timeOverride?: string) => {
        const time = timeOverride ?? new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        setTimeLog((prev) => {
            if (prev.some((entry) => entry.eventKey === eventKey)) {
                return prev;
            }
            return [...prev, { event, eventKey, time }];
        });
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        let timeoutId: number | null = null;

        const scheduleReset = () => {
            const now = new Date();
            const nextReset = getNextTimesheetReset(now);
            const delay = Math.max(1000, nextReset.getTime() - now.getTime());
            timeoutId = window.setTimeout(() => {
                setActiveDateKey(getLocalDateKey(new Date()));
                scheduleReset();
            }, delay);
        };

        scheduleReset();

        return () => {
            if (timeoutId) {
                window.clearTimeout(timeoutId);
            }
        };
    }, []);

    useEffect(() => {
        setTimeLog([]);
        setTimeTrackingStatus('timed-out');
    }, [activeDateKey]);

    useEffect(() => {
        if (!user?.uid) {
            setTimeLog([]);
            setTimeTrackingStatus('timed-out');
            return;
        }

        let unsubscribe: (() => void) | null = null;
        let cancelled = false;

        const subscribe = async () => {
            const ready = await ensureFirebaseReady();
            if (cancelled) return;
            if (!ready || !db) {
                setTimeLog([]);
                setTimeTrackingStatus('timed-out');
                return;
            }

            const docRef = db.collection('personnel').doc(user.uid).collection('timesheets').doc(activeDateKey);
            unsubscribe = docRef.onSnapshot(
                (snapshot: any) => {
                    const data = snapshot.data() as FirestoreTimesheetDoc | undefined;
                    if (!data) {
                        setTimeLog([]);
                        setTimeTrackingStatus('timed-out');
                        return;
                    }
                    const hydrated = { dateKey: activeDateKey, ...data };
                    setTimeLog(buildTimeLogEntries(hydrated, t));
                    setTimeTrackingStatus(deriveTimeTrackingStatus(hydrated));
                },
                (err: any) => console.error('Error fetching timesheet log:', err)
            );
        };

        subscribe();

        return () => {
            cancelled = true;
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [activeDateKey, t, user?.uid]);

    const persistEvent = useCallback(
        async (eventKey: TimesheetEventKey, nextStatus: TimeTrackingStatus, successMessageKey: string) => {
            await persistTimeEvent(
                { eventKey, nextStatus, successMessageKey },
                {
                    t,
                    showPopup,
                    closeConfirm,
                    user,
                    userRole,
                    addTimeLogEntry,
                    setTimeTrackingStatus,
                }
            );
        },
        [addTimeLogEntry, closeConfirm, showPopup, t, user, userRole]
    );

    const handleTimeIn = useCallback(() => {
        void persistEvent('timeIn', 'timed-in', 'timeInSuccess');
    }, [persistEvent]);

    const handleTimeOut = useCallback(() => {
        void persistEvent('timeOut', 'timed-out', 'timeOutSuccess');
    }, [persistEvent]);

    const promptTimeIn = useCallback(() => {
        openConfirm({
            title: t('confirmTimeInTitle'),
            message: t('confirmTimeInMessage'),
            onConfirm: handleTimeIn,
            confirmButtonText: t('timeIn'),
            confirmButtonClassName: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
            icon: <ClockIcon />,
        });
    }, [handleTimeIn, openConfirm, t]);

    const promptTimeOut = useCallback(() => {
        openConfirm({
            title: t('confirmTimeOutTitle'),
            message: t('confirmTimeOutMessage'),
            onConfirm: handleTimeOut,
            confirmButtonText: t('timeOut'),
            confirmButtonClassName: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
            icon: <ClockIcon />,
        });
    }, [handleTimeOut, openConfirm, t]);

    const handleStartLunch = useCallback(() => {
        openConfirm({
            title: t('startLunchTitle'),
            message: t('startLunchMessage'),
            onConfirm: () => {
                void persistEvent('lunchStart', 'on-lunch', 'lunchStartSuccess');
            },
            confirmButtonText: t('startLunch'),
            confirmButtonClassName: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
        });
    }, [openConfirm, persistEvent, t]);

    const handleEndLunch = useCallback(() => {
        openConfirm({
            title: t('endLunchTitle'),
            message: t('endLunchMessage'),
            onConfirm: () => {
                void persistEvent('lunchEnd', 'timed-in', 'lunchEndSuccess');
            },
            confirmButtonText: t('backToWork'),
            confirmButtonClassName: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
        });
    }, [openConfirm, persistEvent, t]);

    const hasTimedInToday = useMemo(() => timeLog.some((entry) => entry.eventKey === 'timeIn'), [timeLog]);
    const hasTakenLunchToday = useMemo(() => timeLog.some((entry) => entry.eventKey === 'lunchStart'), [timeLog]);

    const resetTimeTracking = useCallback(() => {
        setTimeLog([]);
        setTimeTrackingStatus('timed-out');
    }, []);

    return {
        timeTrackingStatus,
        timeLog,
        hasTimedInToday,
        hasTakenLunchToday,
        promptTimeIn,
        promptTimeOut,
        handleStartLunch,
        handleEndLunch,
        resetTimeTracking,
    };
};
