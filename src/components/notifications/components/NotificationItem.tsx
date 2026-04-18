import React from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';
import NotificationMessageContent from './NotificationMessageContent';
import NotificationRequestActions from './NotificationRequestActions';
import { formatRelativeTime, type NotificationRecord } from '../utils/notificationUtils';
import { renderNotificationIcon } from '../utils/notificationRenderUtils';
import { buildNotificationPresentation } from '../utils/notificationPresentationUtils';

interface NotificationItemProps {
    notification: NotificationRecord;
    canApproveRequests: boolean;
    canApproveRequest?: (notification: NotificationRecord) => boolean;
    onRequestDecision: (notification: NotificationRecord, decision: 'yes' | 'no') => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, canApproveRequests, canApproveRequest, onRequestDecision }) => {
    const { t } = useTranslation();
    const presentation = buildNotificationPresentation(notification, t);
    const isApprovalAllowed = canApproveRequests && (canApproveRequest ? canApproveRequest(notification) : true);
    const showRequestActions =
        isApprovalAllowed &&
        (presentation.isLeaveRequest || presentation.isOffsetRequest) &&
        presentation.requestStatus === 'pending' &&
        notification.requestId &&
        notification.requestOwnerId;

    return (
        <div
            className={`flex items-start gap-4 rounded-2xl border border-white/30 dark:border-white/10 bg-white/40 dark:bg-black/20 backdrop-blur-md p-4 shadow-lg transition-all ${
                notification.read ? 'opacity-70' : ''
            }`}
        >
            <div className="flex-shrink-0 mt-0.5">{renderNotificationIcon(presentation.eventKey, presentation.requestStatus, 'w-10 h-10')}</div>
            <div className="flex-1">
                <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-gray-800 dark:text-gray-200 leading-tight">
                        <NotificationMessageContent presentation={presentation} t={t} />
                    </p>
                    {!notification.read && (
                        <span className="text-[10px] uppercase tracking-wide text-blue-600 dark:text-blue-300 bg-blue-100/70 dark:bg-blue-500/20 px-2 py-0.5 rounded-full">
                            {t('new', 'New')}
                        </span>
                    )}
                </div>
                {(presentation.isLeaveRequest || presentation.isOffsetRequest) && (
                    <NotificationRequestActions
                        t={t}
                        requestStatus={presentation.requestStatus}
                        showRequestActions={Boolean(showRequestActions)}
                        onDecision={(decision) => onRequestDecision(notification, decision)}
                    />
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{formatRelativeTime(notification.timestamp, t)}</p>
            </div>
        </div>
    );
};

export default NotificationItem;
