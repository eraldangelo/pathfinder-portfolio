import { useCallback, useEffect, useState } from 'react';
import type { DailyLog } from '../../../data/timesheet';
import { db, ensureFirebaseReady, serverTimestamp } from '../../../services/firebase';
import { getLocalDateKey, mapTimesheetDocToDailyLog, type FirestoreTimesheetDoc } from '../../../utils/timesheet';

const buildMonthSkeleton = (currentDate: Date): DailyLog[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const weekday = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const generatedDataForMonth: DailyLog[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dayName = weekday[date.getDay()];
        let status: DailyLog['status'] = 'Pending';
        if (dayName === 'Saturday' || dayName === 'Sunday') {
            status = 'Weekend';
        }
        generatedDataForMonth.push({
            date,
            day: dayName,
            status,
            timeIn: null,
            lunchStart: null,
            lunchEnd: null,
            timeOut: null,
            totalHours: null,
            notes: null,
            remarks: null,
        });
    }

    return generatedDataForMonth;
};

const mergeMonthLogs = (baseLogs: DailyLog[], sourceLogs: DailyLog[]) =>
    baseLogs.map((generatedLog) => {
        const existingLog = sourceLogs.find(
            (propLog) =>
                new Date(propLog.date).toDateString() === new Date(generatedLog.date).toDateString()
        );
        return existingLog ? { ...generatedLog, ...existingLog } : generatedLog;
    });

interface UseTimesheetLogsParams {
    currentDate: Date;
    userUid?: string | null;
}

export const useTimesheetLogs = ({ currentDate, userUid }: UseTimesheetLogsParams) => {
    const [logs, setLogs] = useState<DailyLog[]>([]);
    const [firestoreLogs, setFirestoreLogs] = useState<DailyLog[]>([]);

    useEffect(() => {
        const generated = buildMonthSkeleton(currentDate);
        setLogs(mergeMonthLogs(generated, firestoreLogs));
    }, [currentDate, firestoreLogs]);

    useEffect(() => {
        if (!userUid) {
            setFirestoreLogs([]);
            return;
        }

        let unsubscribe: (() => void) | null = null;
        let cancelled = false;
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0);
        const startKey = getLocalDateKey(startDate);
        const endKey = getLocalDateKey(endDate);

        const subscribe = async () => {
            const ready = await ensureFirebaseReady();
            if (cancelled) return;
            if (!ready || !db) {
                setFirestoreLogs([]);
                return;
            }

            const query = db
                .collection('personnel')
                .doc(userUid)
                .collection('timesheets')
                .where('dateKey', '>=', startKey)
                .where('dateKey', '<=', endKey);

            unsubscribe = query.onSnapshot(
                (snapshot: any) => {
                    const nextLogs = snapshot.docs
                        .map((doc: any) => {
                            const data = doc.data() as FirestoreTimesheetDoc;
                            const hydrated = { ...data, dateKey: data?.dateKey || doc.id };
                            return mapTimesheetDocToDailyLog(hydrated);
                        })
                        .filter((log: DailyLog | null): log is DailyLog => Boolean(log));
                    setFirestoreLogs(nextLogs);
                },
                (err: any) => console.error('Error fetching timesheet data:', err)
            );
        };

        subscribe();

        return () => {
            cancelled = true;
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [currentDate, userUid]);

    const updateRemarks = useCallback(
        (date: Date, newRemarks: string) => {
            setLogs((prevData) =>
                prevData.map((log) =>
                    new Date(log.date).getTime() === new Date(date).getTime()
                        ? { ...log, remarks: newRemarks }
                        : log
                )
            );

            if (!userUid) {
                return;
            }

            const persistRemarks = async () => {
                const ready = await ensureFirebaseReady();
                if (!ready || !db) return;
                const dateKey = getLocalDateKey(date);
                try {
                    await db
                        .collection('personnel')
                        .doc(userUid)
                        .collection('timesheets')
                        .doc(dateKey)
                        .set(
                            {
                                dateKey,
                                remarks: newRemarks,
                                updatedAt: serverTimestamp ? serverTimestamp() : new Date(),
                            },
                            { merge: true }
                        );
                } catch (error) {
                    console.error('Error saving remarks:', error);
                }
            };

            void persistRemarks();
        },
        [userUid]
    );

    return { logs, updateRemarks };
};
