import type { NotificationRecord } from './notificationUtils';
import { deriveRequestStatus } from './notificationRenderUtils';
import {
    detectEventKey,
    formatLeaveDate,
    formatOffsetHours,
    formatPossessive,
    getStatusLabel,
    parseLegacyMessage,
    stripPathfinderPrefix,
} from './notificationItemUtils';

export type NotificationTranslationFn = (key: string, options?: { [key: string]: string | number } | string) => string;

export interface NotificationPresentation {
    eventKey: string | null;
    legacy: { name: string | null; time: string | null; isTeam: boolean };
    requestStatus: string;
    decisionLabel: string;
    name: string | null;
    time: string | null;
    isLeaveRequest: boolean;
    isLeaveDecision: boolean;
    isOffsetRequest: boolean;
    isOffsetDecision: boolean;
    isRequestEvent: boolean;
    isTeamNotification: boolean;
    cleanMessage: string;
    requesterName: string;
    requesterBranch: string;
    rangeLabel: string;
    dayLabel: string | null;
    offsetRangeLabel: string;
    approverName: string;
    pendingApprovalText: string;
    statusLabel: string;
}

export const buildNotificationPresentation = (
    notification: NotificationRecord,
    t: NotificationTranslationFn
): NotificationPresentation => {
    const eventKey = detectEventKey(notification);
    const legacy = parseLegacyMessage(notification.message);
    const name = notification.actorName || legacy.name;
    const time = notification.eventTime || legacy.time;
    const isLeaveRequest = eventKey === 'leaveRequest';
    const isLeaveDecision = eventKey === 'leaveDecision';
    const isOffsetRequest = eventKey === 'offsetRequest';
    const isOffsetDecision = eventKey === 'offsetDecision';
    const isRequestEvent = isLeaveRequest || isLeaveDecision || isOffsetRequest || isOffsetDecision;
    const isTeamNotification = Boolean(!isRequestEvent && eventKey && (notification.actorName || legacy.isTeam));
    const cleanMessage = stripPathfinderPrefix(notification.message);
    const requestStatus = deriveRequestStatus(notification);
    const decisionLabel = String(requestStatus).toLowerCase();
    const requesterName = notification.requesterName || t('unknownUser', 'Unknown');
    const requesterBranch = notification.requesterBranch ? `(${notification.requesterBranch})` : '';
    const requestFromDate = formatLeaveDate(notification.requestFromDate ?? notification.requestDate);
    const requestToDate = formatLeaveDate(notification.requestToDate ?? notification.requestDate);
    const requestDayCount = typeof notification.requestDayCount === 'number' ? notification.requestDayCount : null;
    const rangeLabel =
        requestFromDate && requestToDate && requestFromDate !== requestToDate
            ? `${requestFromDate} ${t('to', 'to')} ${requestToDate}`
            : requestFromDate || requestToDate || t('requestDate', 'Date');
    const dayLabel =
        requestDayCount !== null
            ? `${requestDayCount} ${requestDayCount === 1 ? t('day', 'Day') : t('days', 'Days')}`
            : null;
    const requestHours = typeof notification.requestHours === 'number' ? notification.requestHours : null;
    const offsetHoursLabel = formatOffsetHours(requestHours, t);
    const requestDateLabel = formatLeaveDate(notification.requestDate);
    const requestStartTime =
        typeof notification.requestStartTime === 'string' && notification.requestStartTime.trim() !== ''
            ? notification.requestStartTime
            : null;
    const requestEndTime =
        typeof notification.requestEndTime === 'string' && notification.requestEndTime.trim() !== ''
            ? notification.requestEndTime
            : null;
    const offsetTimeRange = requestStartTime && requestEndTime ? `${requestStartTime}-${requestEndTime}` : null;
    const offsetRangeLabel = [
        offsetHoursLabel,
        requestDateLabel ? `on ${requestDateLabel}` : null,
        offsetTimeRange ? `(${offsetTimeRange})` : null,
    ]
        .filter(Boolean)
        .join(' ');
    const approverName = notification.approverName || '';
    const approverPossessive = formatPossessive(approverName || 'Manager');
    const pendingApprovalText = t('leavePendingApprovalFor', { approver: approverPossessive });
    const statusLabel = getStatusLabel(eventKey);

    return {
        eventKey,
        legacy,
        requestStatus,
        decisionLabel,
        name,
        time,
        isLeaveRequest,
        isLeaveDecision,
        isOffsetRequest,
        isOffsetDecision,
        isRequestEvent,
        isTeamNotification,
        cleanMessage,
        requesterName,
        requesterBranch,
        rangeLabel,
        dayLabel,
        offsetRangeLabel,
        approverName,
        pendingApprovalText,
        statusLabel,
    };
};
