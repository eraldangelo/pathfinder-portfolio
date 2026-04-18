import React, { useMemo, useState, useCallback } from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';
import NotificationToolbar from './NotificationToolbar';
import NotificationsHeader from './NotificationsHeader';
import NotificationList from './NotificationList';
import { groupNotifications, type NotificationRecord } from '../utils/notificationUtils';
import { useBranchChangeQueue } from '../hooks/useBranchChangeQueue';
import { BranchChangeQueuePanel } from './BranchChangeQueuePanel';
import type { User } from '../../../types';
import {
    applyNotificationRequestDecision,
    canApproveSpecificNotificationRequest,
    canUserApproveNotifications,
} from '../utils/notificationApprovalUtils';

interface NotificationsPageProps {
    isReady: boolean;
    user: User;
    userRole: string;
    notifications: NotificationRecord[];
    unreadCount: number;
    onMarkAllRead: () => void;
}

const NotificationsPage: React.FC<NotificationsPageProps> = ({
    isReady,
    user,
    userRole,
    notifications,
    unreadCount,
    onMarkAllRead,
}) => {
    const { t } = useTranslation();
    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const branchChangeQueue = useBranchChangeQueue({ user, userRole });
    const canApproveRequests = canUserApproveNotifications(user, userRole);

    const canApproveRequest = useCallback(
        (notification: NotificationRecord) => {
            return canApproveSpecificNotificationRequest(notification, {
                userRole,
                userBranch: user.branch,
                canApproveRequests,
            });
        },
        [canApproveRequests, userRole, user.branch]
    );

    const filteredNotifications = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();
        return notifications.filter((notification) => {
            if (filter === 'unread' && notification.read) return false;
            if (!normalizedSearch) return true;
            const searchable = [
                notification.message,
                notification.requesterName,
                notification.requesterBranch,
                notification.requestDate,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return searchable.includes(normalizedSearch);
        });
    }, [filter, notifications, searchTerm]);

    const handleRequestDecision = useCallback(
        async (notification: NotificationRecord, decision: 'yes' | 'no') => {
            await applyNotificationRequestDecision({
                notification,
                decision,
                user,
                userRole,
                canApproveRequests,
                canApproveSpecificRequest: canApproveRequest,
            });
        },
        [canApproveRequests, canApproveRequest, user, userRole]
    );

    const groupedNotifications = useMemo(
        () => groupNotifications(filteredNotifications, t),
        [filteredNotifications, t]
    );

    const totalCount = notifications.length;
    const hasNotifications = totalCount > 0;
    const hasMatches = filteredNotifications.length > 0;

    const contentAnimationClasses = `transition-all duration-500 ease-out delay-100 ${isReady ? 'opacity-100' : 'opacity-0'}`;

    return (
        <div className="relative w-full h-full max-w-[1920px] mx-auto">
            <div className="w-full h-full px-4 pt-24 lg:px-8 pb-16 flex flex-col text-sm text-gray-700 dark:text-gray-300">
                <NotificationsHeader isReady={isReady} totalCount={totalCount} />

                <div className={`space-y-6 ${contentAnimationClasses}`}>
                    <NotificationToolbar
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        filter={filter}
                        onFilterChange={setFilter}
                        unreadCount={unreadCount}
                        onMarkAllRead={onMarkAllRead}
                    />

                    {branchChangeQueue.scope ? (
                        <BranchChangeQueuePanel
                            requests={branchChangeQueue.requests}
                            isLoading={branchChangeQueue.isLoading}
                            error={branchChangeQueue.error}
                            t={t}
                        />
                    ) : null}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="rounded-2xl border border-white/30 dark:border-white/10 bg-white/40 dark:bg-black/20 backdrop-blur-md p-4 shadow-lg">
                            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('totalNotifications', 'Total Notifications')}</p>
                            <p className="text-2xl font-bold text-[#004097] dark:text-blue-300 mt-1">{totalCount}</p>
                        </div>
                        <div className="rounded-2xl border border-white/30 dark:border-white/10 bg-white/40 dark:bg-black/20 backdrop-blur-md p-4 shadow-lg">
                            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('unreadNotifications', 'Unread Notifications')}</p>
                            <p className="text-2xl font-bold text-[#004097] dark:text-blue-300 mt-1">{unreadCount}</p>
                        </div>
                    </div>

                    {hasNotifications && hasMatches ? (
                    <NotificationList
                        groups={groupedNotifications}
                        canApproveRequests={canApproveRequests}
                        canApproveRequest={canApproveRequest}
                        onRequestDecision={handleRequestDecision}
                    />
                    ) : (
                        <div className="rounded-3xl border border-white/30 dark:border-white/10 bg-white/40 dark:bg-black/20 backdrop-blur-md p-10 text-center shadow-lg">
                            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                                {hasNotifications
                                    ? t('noMatchingNotifications', 'No notifications match your filters.')
                                    : t('noNewNotifications', 'No new notifications.')}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                {hasNotifications
                                    ? t('adjustFilters', 'Try adjusting your search or filter settings.')
                                    : t('notificationsWillAppear', 'Notifications will appear here as activity happens.')}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationsPage;
