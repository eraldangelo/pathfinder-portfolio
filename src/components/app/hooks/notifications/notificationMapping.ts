import { normalizeLeadEndorsedMessage } from '../../../notifications/utils/notificationItemUtils';
import type { NotificationRecord } from '../../../notifications/utils/notificationUtils';

const toDate = (value: any) => {
    if (!value) return new Date();
    if (value instanceof Date) return value;
    if (typeof value?.toDate === 'function') return value.toDate();
    return new Date();
};

const shouldHideForAdminPh = (item: NotificationRecord, isAdminPhReadonly: boolean) => {
    if (!isAdminPhReadonly) return false;
    if (item.eventKey === 'leaveRequest' || item.eventKey === 'leaveDecision') return true;
    return item.message.toLowerCase().includes('leave request');
};

export const mapNotificationSnapshot = (snapshot: any, isAdminPhReadonly: boolean) => {
    const toMigrate: Array<{ id: string; message: string }> = [];
    const items = snapshot.docs
        .map((doc: any) => {
            const data = doc.data() || {};
            const rawMessage = String(data.message ?? '');
            const normalizedMessage = normalizeLeadEndorsedMessage(rawMessage);
            if (normalizedMessage && normalizedMessage !== rawMessage) {
                toMigrate.push({ id: doc.id, message: normalizedMessage });
            }
            return {
                id: doc.id,
                message: normalizedMessage || rawMessage,
                timestamp: toDate(data.createdAt),
                read: Boolean(data.read),
                eventKey: data.eventKey ?? null,
                actorName: data.actorName ?? null,
                actorRole: data.actorRole ?? null,
                actorBranch: data.actorBranch ?? null,
                eventTime: data.eventTime ?? null,
                requestId: data.requestId ?? null,
                requestOwnerId: data.requestOwnerId ?? null,
                requestStatus: data.requestStatus ?? null,
                requestType: data.requestType ?? null,
                requestDate: data.requestDate ?? null,
                requestFromDate: data.requestFromDate ?? null,
                requestToDate: data.requestToDate ?? null,
                requestDayCount: typeof data.requestDayCount === 'number' ? data.requestDayCount : null,
                requestHours: typeof data.requestHours === 'number' ? data.requestHours : null,
                requestStartTime: data.requestStartTime ?? null,
                requestEndTime: data.requestEndTime ?? null,
                requestReason: data.requestReason ?? null,
                requesterName: data.requesterName ?? null,
                requesterBranch: data.requesterBranch ?? null,
                requesterRole: data.requesterRole ?? null,
                approverName: data.approverName ?? null,
            } as NotificationRecord;
        })
        .filter((item: NotificationRecord) => !shouldHideForAdminPh(item, isAdminPhReadonly));

    return { items, toMigrate };
};
