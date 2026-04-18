import { useEffect } from 'react';
import { db, ensureFirebaseReady, serverTimestamp, Timestamp } from '../../../services/firebase';
import { parseLocalDateKey, type FirestoreTimesheetDoc } from '../../../utils/timesheet';

const pad2 = (value: number) => `${value}`.padStart(2, '0');

const toDateKey = (date: Date) =>
    `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
};

const listWeekdayDateKeys = (fromKey?: string | null, toKey?: string | null): string[] => {
    if (!fromKey || !toKey) return [];
    const start = parseLocalDateKey(fromKey);
    const end = parseLocalDateKey(toKey);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];

    const from = start <= end ? start : end;
    const to = start <= end ? end : start;
    const keys: string[] = [];
    const cursor = new Date(from);
    while (cursor <= to) {
        if (!isWeekend(cursor)) {
            keys.push(toDateKey(cursor));
        }
        cursor.setDate(cursor.getDate() + 1);
    }
    return keys;
};

const buildLocalDateTime = (dateKey: string, hours: number, minutes: number): Date | null => {
    const parsed = parseLocalDateKey(dateKey);
    if (Number.isNaN(parsed.getTime())) return null;
    parsed.setHours(hours, minutes, 0, 0);
    return parsed;
};

const formatTime = (date: Date) => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

const hasAnyTimesheetEvents = (doc?: FirestoreTimesheetDoc | null) =>
    Boolean(doc?.timeIn?.time || doc?.lunchStart?.time || doc?.lunchEnd?.time || doc?.timeOut?.time);

const buildApprovedLeavePayload = (
    dateKey: string,
    existing?: (FirestoreTimesheetDoc & { createdAt?: unknown }) | null
) => {
    const timeInAt = buildLocalDateTime(dateKey, 9, 0);
    const lunchStartAt = buildLocalDateTime(dateKey, 12, 0);
    const lunchEndAt = buildLocalDateTime(dateKey, 13, 0);
    const timeOutAt = buildLocalDateTime(dateKey, 17, 0);

    if (!timeInAt || !lunchStartAt || !lunchEndAt || !timeOutAt) return null;

    return {
        dateKey,
        timeIn: { time: formatTime(timeInAt), at: Timestamp ? Timestamp.fromDate(timeInAt) : timeInAt },
        lunchStart: { time: formatTime(lunchStartAt), at: Timestamp ? Timestamp.fromDate(lunchStartAt) : lunchStartAt },
        lunchEnd: { time: formatTime(lunchEndAt), at: Timestamp ? Timestamp.fromDate(lunchEndAt) : lunchEndAt },
        timeOut: { time: formatTime(timeOutAt), at: Timestamp ? Timestamp.fromDate(timeOutAt) : timeOutAt },
        totalHours: '7h 0m',
        status: 'On Leave',
        remarks: existing?.remarks && String(existing.remarks).trim() !== '' ? existing.remarks : 'Approved Leave',
        notes: existing?.notes && String(existing.notes).trim() !== '' ? existing.notes : 'Approved Leave',
        updatedAt: serverTimestamp ? serverTimestamp() : new Date(),
        createdAt: existing?.createdAt ?? (serverTimestamp ? serverTimestamp() : new Date()),
    };
};

export const useApprovedLeaveAutoPlot = (userUid?: string | null) => {
    useEffect(() => {
        if (!userUid) {
            return;
        }

        let unsubscribe: (() => void) | null = null;
        let cancelled = false;
        let processing = false;
        let latestDocs: any[] | null = null;

        const processApprovedLeaves = async () => {
            if (processing || !latestDocs?.length || !userUid || !db) return;
            processing = true;
            const docs = latestDocs;
            latestDocs = null;

            try {
                const dateKeys = new Set<string>();
                docs.forEach((doc: any) => {
                    const data = doc.data() || {};
                    const fromKey = (data.fromDate ?? data.date ?? null) as string | null;
                    const toKey = (data.toDate ?? data.date ?? null) as string | null;
                    listWeekdayDateKeys(fromKey, toKey).forEach((key) => dateKeys.add(key));
                });

                if (!dateKeys.size) return;

                const ownerRef = db.collection('personnel').doc(userUid);
                for (const dateKey of dateKeys) {
                    const timesheetRef = ownerRef.collection('timesheets').doc(dateKey);
                    const snap = await timesheetRef.get();
                    const existing = snap.exists ? (snap.data() as FirestoreTimesheetDoc) : null;
                    if (existing && hasAnyTimesheetEvents(existing)) {
                        continue;
                    }
                    const payload = buildApprovedLeavePayload(dateKey, existing);
                    if (!payload) continue;
                    await timesheetRef.set(payload, { merge: true });
                }
            } catch (error) {
                console.error('Failed to auto-plot approved leave on timesheet:', error);
            } finally {
                processing = false;
                if (latestDocs?.length) {
                    void processApprovedLeaves();
                }
            }
        };

        const subscribe = async () => {
            const ready = await ensureFirebaseReady();
            if (cancelled) return;
            if (!ready || !db) return;

            const query = db
                .collection('personnel')
                .doc(userUid)
                .collection('leaveRequests')
                .where('status', '==', 'approved');

            unsubscribe = query.onSnapshot(
                (snapshot: any) => {
                    latestDocs = snapshot.docs || [];
                    void processApprovedLeaves();
                },
                (err: any) => console.error('Error fetching approved leave requests:', err)
            );
        };

        subscribe();

        return () => {
            cancelled = true;
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [userUid]);
};
