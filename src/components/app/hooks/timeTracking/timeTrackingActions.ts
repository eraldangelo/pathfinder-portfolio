import type { TimeTrackingStatus } from '../../../../types';
import type { TimesheetEventKey } from '../../../../utils/timesheet';
import { getLocalDateKey } from '../../../../utils/timesheet';
import { db, ensureFirebaseReady, serverTimestamp, Timestamp } from '../../../../services/firebase';
import { getOptionalIp } from './timeTrackingNetwork';
import { notifyBranchLeads } from './timeTrackingNotifications';
import type { User } from '../../../../types';

interface PersistEventParams {
    eventKey: TimesheetEventKey;
    nextStatus: TimeTrackingStatus;
    successMessageKey: string;
}

interface PersistEventDeps {
    t: (key: string, fallback?: string) => string;
    showPopup: (message: string, meta?: { eventKey?: string }) => void;
    closeConfirm: () => void;
    user: User | null;
    userRole: string | null;
    addTimeLogEntry: (event: string, eventKey: string, timeOverride?: string) => void;
    setTimeTrackingStatus: (status: TimeTrackingStatus) => void;
}

export const persistTimeEvent = async (
    { eventKey, nextStatus, successMessageKey }: PersistEventParams,
    {
        t,
        showPopup,
        closeConfirm,
        user,
        userRole,
        addTimeLogEntry,
        setTimeTrackingStatus,
    }: PersistEventDeps
) => {
    const eventTime = new Date();
    const time = eventTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    if (!user?.uid) {
        showPopup(t('timeLogSaveFailed', 'Please log in again to record your time.'));
        closeConfirm();
        return;
    }

    const ready = await ensureFirebaseReady();
    if (!ready || !db) {
        showPopup('Firebase is not ready. Please refresh the page and try again.');
        closeConfirm();
        return;
    }

    const ip = await getOptionalIp();
    const dateKey = getLocalDateKey(eventTime);
    const payload = {
        dateKey,
        updatedAt: serverTimestamp ? serverTimestamp() : eventTime,
        [eventKey]: {
            time,
            at: Timestamp ? Timestamp.fromDate(eventTime) : eventTime,
            ip: ip || 'N/A',
        },
    };

    try {
        await db.collection('personnel').doc(user.uid).collection('timesheets').doc(dateKey).set(payload, { merge: true });
        setTimeTrackingStatus(nextStatus);
        addTimeLogEntry(t(eventKey), eventKey, time);
        showPopup(t(successMessageKey), { eventKey });
        void notifyBranchLeads({ eventKey, time, user, userRole: userRole ?? '', t });
        db.collection('personnel')
            .doc(user.uid)
            .set(
                {
                    activityStatus: {
                        status: nextStatus,
                        time,
                        dateKey,
                    },
                    activityStatusUpdatedAt: serverTimestamp ? serverTimestamp() : eventTime,
                },
                { merge: true }
            )
            .catch((err: any) => console.error('Failed to update activity status:', err));
    } catch (error) {
        console.error('Error saving timesheet event:', error);
        showPopup(t('timeLogSaveFailed', 'Failed to save time log. Please try again.'));
    } finally {
        closeConfirm();
    }
};
