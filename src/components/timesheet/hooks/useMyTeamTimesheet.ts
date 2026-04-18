import { useEffect, useMemo, useState } from 'react';
import type { DailyLog } from '../../../data/timesheet';
import type { PersonnelWithDetails } from '../../../data/personnel';
import type { ActivityStatus } from '../../../types';
import { db, ensureFirebaseReady } from '../../../services/firebase';
import {
    getLocalDateKey,
    getNextTimesheetReset,
    mapTimesheetDocToDailyLog,
    parseLocalDateKey,
    type FirestoreTimesheetDoc,
} from '../../../utils/timesheet';

type TeamScope =
    | { mode: 'all' }
    | { mode: 'branch'; branches: string[] };

export type TeamTimesheetRow = {
    uid: string;
    name: string;
    branch: string;
    role: string;
    activityStatus?: ActivityStatus;
    log: DailyLog;
};

const buildFallbackLog = (todayKey: string): DailyLog => {
    const fallback = mapTimesheetDocToDailyLog({ dateKey: todayKey });
    if (fallback) return { ...fallback };
    const date = parseLocalDateKey(todayKey);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    return {
        date,
        day: dayName,
        status: 'Pending',
        timeIn: null,
        lunchStart: null,
        lunchEnd: null,
        timeOut: null,
        totalHours: null,
        notes: null,
        remarks: null,
    };
};

const useTodayKey = () => {
    const [todayKey, setTodayKey] = useState(getLocalDateKey());

    useEffect(() => {
        const nextReset = getNextTimesheetReset();
        const delay = Math.max(1000, nextReset.getTime() - Date.now());
        const timer = setTimeout(() => setTodayKey(getLocalDateKey()), delay);
        return () => clearTimeout(timer);
    }, [todayKey]);

    return todayKey;
};

export const useMyTeamTimesheet = (enabled: boolean, scope: TeamScope | null) => {
    const todayKey = useTodayKey();
    const [teamMembers, setTeamMembers] = useState<PersonnelWithDetails[]>([]);
    const [logsByUid, setLogsByUid] = useState<Record<string, DailyLog>>({});
    const [isPersonnelLoading, setIsPersonnelLoading] = useState(true);
    const [isTimesheetsLoading, setIsTimesheetsLoading] = useState(true);

    const scopeMode = scope?.mode ?? null;

    const scopeKey = useMemo(() => {
        if (!scope) return 'none';
        if (scope.mode === 'all') return 'all';
        return `branch:${(scope.branches || []).join('|')}`;
    }, [scope]);

    useEffect(() => {
        if (!enabled || scopeMode == null) {
            setTeamMembers([]);
            setLogsByUid({});
            setIsPersonnelLoading(false);
            setIsTimesheetsLoading(false);
            return;
        }

        let unsubscribePersonnel: (() => void) | null = null;
        let cancelled = false;
        setIsPersonnelLoading(true);

        const subscribe = async () => {
            const ready = await ensureFirebaseReady();
            if (cancelled) return;
            if (!ready || !db) {
                setTeamMembers([]);
                setIsPersonnelLoading(false);
                return;
            }

            let personnelQuery: any = db.collection('personnel');
            if (scopeMode === 'branch') {
                const branches = scopeKey.startsWith('branch:') ? scopeKey.slice('branch:'.length).split('|').filter(Boolean) : [];
                if (branches.length === 1) {
                    personnelQuery = personnelQuery.where('branch', '==', branches[0]);
                } else if (branches.length > 1) {
                    personnelQuery = personnelQuery.where('branch', 'in', branches.slice(0, 10));
                }
            }

            unsubscribePersonnel = personnelQuery.onSnapshot(
                (snapshot: any) => {
                    const personnelData = snapshot.docs.map(
                        (doc: any) => ({ uid: doc.id, ...doc.data() } as PersonnelWithDetails)
                    );
                    setTeamMembers(personnelData);
                    setIsPersonnelLoading(false);
                },
                (err: any) => {
                    console.error('Error fetching personnel:', err);
                    setIsPersonnelLoading(false);
                }
            );
        };

        subscribe();

        return () => {
            cancelled = true;
            if (unsubscribePersonnel) unsubscribePersonnel();
        };
    }, [enabled, scopeMode, scopeKey]);

    const teamUidsKey = useMemo(() => {
        if (!enabled || scopeMode == null) return '';
        const ids = teamMembers.map((member) => member.uid).filter(Boolean);
        return ids.length ? ids.slice().sort().join('|') : '';
    }, [enabled, scopeMode, teamMembers]);

    useEffect(() => {
        if (!enabled || scopeMode == null) {
            return;
        }

        const uids = teamUidsKey ? teamUidsKey.split('|') : [];
        if (!uids.length) {
            setLogsByUid({});
            setIsTimesheetsLoading(false);
            return;
        }

        let cancelled = false;
        const seen = new Set<string>();
        const unsubscribers: (() => void)[] = [];

        setIsTimesheetsLoading(true);
        setLogsByUid({});

        const subscribe = async () => {
            const ready = await ensureFirebaseReady();
            if (cancelled) return;
            if (!ready || !db) {
                setLogsByUid({});
                setIsTimesheetsLoading(false);
                return;
            }

            const markSeen = (uid: string) => {
                if (seen.has(uid)) return;
                seen.add(uid);
                if (seen.size >= uids.length) {
                    setIsTimesheetsLoading(false);
                }
            };

            uids.forEach((uid) => {
                const ref = db.collection('personnel').doc(uid).collection('timesheets').doc(todayKey);
                const unsubscribe = ref.onSnapshot(
                    (doc: any) => {
                        if (!doc?.exists) {
                            setLogsByUid((prev) => {
                                if (!prev[uid]) return prev;
                                const next = { ...prev };
                                delete next[uid];
                                return next;
                            });
                            markSeen(uid);
                            return;
                        }

                        const data = doc.data() as FirestoreTimesheetDoc;
                        const hydrated = { ...data, dateKey: data?.dateKey || doc.id };
                        const log = mapTimesheetDocToDailyLog(hydrated);
                        setLogsByUid((prev) => {
                            const next = { ...prev };
                            if (log) {
                                next[uid] = log;
                            } else {
                                delete next[uid];
                            }
                            return next;
                        });
                        markSeen(uid);
                    },
                    (err: any) => {
                        console.error('Error fetching team timesheet:', err);
                        markSeen(uid);
                    }
                );
                unsubscribers.push(unsubscribe);
            });
        };

        subscribe();

        return () => {
            cancelled = true;
            unsubscribers.forEach((unsubscribe) => unsubscribe());
        };
    }, [enabled, scopeMode, teamUidsKey, todayKey]);

    const rows = useMemo<TeamTimesheetRow[]>(() => {
        if (!enabled) return [];
        const fallbackLog = buildFallbackLog(todayKey);
        return teamMembers
            .map((member) => {
                const log = logsByUid[member.uid] || { ...fallbackLog };
                return {
                    uid: member.uid,
                    name: member.name || member.email || 'Unknown',
                    branch: member.branch || '',
                    role: member.role || '',
                    activityStatus: member.activityStatus,
                    log,
                };
            })
            .sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));
    }, [enabled, logsByUid, teamMembers, todayKey]);

    const isLoading = isPersonnelLoading || isTimesheetsLoading;
    return { rows, isLoading, todayKey };
};
