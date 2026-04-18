import React from 'react';
import { renderHighlightedMessage } from '../utils/notificationItemUtils';
import { NotificationPresentation, NotificationTranslationFn } from '../utils/notificationPresentationUtils';

interface NotificationMessageContentProps {
    presentation: NotificationPresentation;
    t: NotificationTranslationFn;
}

const NotificationMessageContent: React.FC<NotificationMessageContentProps> = ({ presentation, t }) => {
    const {
        isLeaveDecision,
        isOffsetDecision,
        isLeaveRequest,
        isOffsetRequest,
        isTeamNotification,
        rangeLabel,
        dayLabel,
        decisionLabel,
        approverName,
        offsetRangeLabel,
        pendingApprovalText,
        requesterName,
        requesterBranch,
        name,
        statusLabel,
        time,
        cleanMessage,
    } = presentation;

    if (isLeaveDecision) {
        return (
            <>
                <span>{t('yourLeaveRequestFor', 'Your leave request for')}</span>{' '}
                <span className="font-semibold text-gray-900 dark:text-white">{rangeLabel}</span>{' '}
                {dayLabel ? <span className="text-gray-600 dark:text-gray-300">({dayLabel})</span> : null}{' '}
                <span>{t('was', 'was')}</span>{' '}
                <span className="font-semibold text-gray-900 dark:text-white">{decisionLabel}</span>
                {approverName ? (
                    <>
                        {' '}
                        <span>{t('by', 'by')}</span>{' '}
                        <span className="font-semibold text-gray-900 dark:text-white">{approverName}</span>
                    </>
                ) : null}
                .
            </>
        );
    }

    if (isOffsetDecision) {
        return (
            <>
                <span>{t('yourOffsetRequestFor', 'Your offset request for')}</span>{' '}
                <span className="font-semibold text-gray-900 dark:text-white">{offsetRangeLabel || t('requestDate', 'Date')}</span>{' '}
                <span>{t('was', 'was')}</span>{' '}
                <span className="font-semibold text-gray-900 dark:text-white">{decisionLabel}</span>
                {approverName ? (
                    <>
                        {' '}
                        <span>{t('by', 'by')}</span>{' '}
                        <span className="font-semibold text-gray-900 dark:text-white">{approverName}</span>
                    </>
                ) : null}
                .
            </>
        );
    }

    if (isLeaveRequest && approverName) {
        return (
            <>
                <span>{t('yourLeaveRequestFrom', 'Your leave request from')}</span>{' '}
                <span className="font-semibold text-gray-900 dark:text-white">{rangeLabel}</span>{' '}
                {dayLabel ? <span className="text-gray-600 dark:text-gray-300">({dayLabel})</span> : null}{' '}
                <span>{pendingApprovalText}</span>
            </>
        );
    }

    if (isOffsetRequest && approverName) {
        return (
            <>
                <span>{t('yourOffsetRequestFor', 'Your offset request for')}</span>{' '}
                <span className="font-semibold text-gray-900 dark:text-white">{offsetRangeLabel || t('requestDate', 'Date')}</span>{' '}
                <span>{pendingApprovalText}</span>
            </>
        );
    }

    if (isLeaveRequest) {
        return (
            <>
                <span className="font-semibold text-gray-900 dark:text-white">{requesterName}</span>{' '}
                <span className="text-gray-600 dark:text-gray-300">{requesterBranch}</span>{' '}
                <span>{t('requestedLeaveFrom', 'requested leave from')}</span>{' '}
                <span className="font-semibold text-gray-900 dark:text-white">{rangeLabel}</span>
                {dayLabel ? <span className="text-gray-600 dark:text-gray-300">({dayLabel})</span> : null}
            </>
        );
    }

    if (isOffsetRequest) {
        return (
            <>
                <span className="font-semibold text-gray-900 dark:text-white">{requesterName}</span>{' '}
                <span className="text-gray-600 dark:text-gray-300">{requesterBranch}</span>{' '}
                <span>{t('requestedOffsetFor', 'requested offset for')}</span>{' '}
                <span className="font-semibold text-gray-900 dark:text-white">{offsetRangeLabel || t('requestDate', 'Date')}</span>
            </>
        );
    }

    if (isTeamNotification) {
        return (
            <>
                <span className="text-gray-600 dark:text-gray-300">Team Notification:</span>{' '}
                <span className="font-semibold text-gray-900 dark:text-white">{name}</span> is now{' '}
                <span className="font-semibold text-gray-900 dark:text-white">{statusLabel}</span>
                {time ? <span className="text-gray-700 dark:text-gray-300">{` at ${time}`}</span> : null}
            </>
        );
    }

    return <>{renderHighlightedMessage(cleanMessage)}</>;
};

export default NotificationMessageContent;
