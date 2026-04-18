import React from 'react';
import NotificationMessageContent from '../../notifications/components/NotificationMessageContent';
import NotificationRequestActions from '../../notifications/components/NotificationRequestActions';
import type { NotificationRecord } from '../../notifications/utils/notificationUtils';
import { formatRelativeTime } from '../../notifications/utils/notificationUtils';
import { renderNotificationIcon } from '../../notifications/utils/notificationRenderUtils';
import { buildNotificationPresentation, NotificationTranslationFn } from '../../notifications/utils/notificationPresentationUtils';

interface NotificationDropdownItemProps {
    notification: NotificationRecord;
    t: NotificationTranslationFn;
    canApproveRequests: boolean;
    canApproveSpecificRequest: (notification: NotificationRecord) => boolean;
    onDecision: (notification: NotificationRecord, decision: 'yes' | 'no') => void;
}

const NotificationDropdownItem: React.FC<NotificationDropdownItemProps> = ({
    notification,
    t,
    canApproveRequests,
    canApproveSpecificRequest,
    onDecision,
}) => {
    const presentation = buildNotificationPresentation(notification, t);
    const showRequestActions =
        canApproveRequests &&
        (presentation.isLeaveRequest || presentation.isOffsetRequest) &&
        presentation.requestStatus === 'pending' &&
        notification.requestId &&
        notification.requestOwnerId &&
        canApproveSpecificRequest(notification);

    return (
        <li
            className={`p-2 flex items-start gap-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${
                notification.read ? 'opacity-70' : ''
            }`}
        >
            <div className="flex-shrink-0 mt-0.5">{renderNotificationIcon(presentation.eventKey, presentation.requestStatus, 'w-9 h-9')}</div>
            <div className="flex-1">
                <p className="text-sm text-gray-800 dark:text-gray-200 leading-tight">
                    <NotificationMessageContent presentation={presentation} t={t} />
                </p>
                {(presentation.isLeaveRequest || presentation.isOffsetRequest) && (
                    <NotificationRequestActions
                        t={t}
                        requestStatus={presentation.requestStatus}
                        showRequestActions={Boolean(showRequestActions)}
                        onDecision={(decision) => onDecision(notification, decision)}
                        variant="compact"
                    />
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatRelativeTime(notification.timestamp, t)}</p>
            </div>
        </li>
    );
};

export default NotificationDropdownItem;
