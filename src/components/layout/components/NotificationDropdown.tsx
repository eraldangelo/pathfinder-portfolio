



import React, { useCallback } from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';
import { dropdownPanel } from '../../common/styles/ui';
import type { NotificationRecord } from '../../notifications/utils/notificationUtils';
import type { User } from '../../../types';
import {
    applyNotificationRequestDecision,
    canApproveSpecificNotificationRequest,
    canUserApproveNotifications,
} from '../../notifications/utils/notificationApprovalUtils';
import NotificationDropdownItem from './NotificationDropdownItem';

interface NotificationDropdownProps {
    isOpen: boolean;
    notifications: NotificationRecord[];
    onMarkAllRead: () => void;
    onViewAll: () => void;
    user: User;
    userRole: string;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, notifications, onMarkAllRead, onViewAll, user, userRole }) => {
    const { t } = useTranslation();
    const canApproveRequests = canUserApproveNotifications(user, userRole);

    const canApproveSpecificRequest = useCallback(
        (notification: NotificationRecord) => {
            return canApproveSpecificNotificationRequest(notification, {
                userRole,
                userBranch: user.branch,
                canApproveRequests,
            });
        },
        [canApproveRequests, userRole, user.branch]
    );

    const handleRequestDecision = useCallback(
        async (notification: NotificationRecord, decision: 'yes' | 'no') => {
            await applyNotificationRequestDecision({
                notification,
                decision,
                user,
                userRole,
                canApproveRequests,
                canApproveSpecificRequest,
            });
        },
        [canApproveRequests, canApproveSpecificRequest, user, userRole]
    );

    if (!isOpen) return null;

    const notificationCount = notifications.length;
    const unreadCount = notifications.filter((notification) => !notification.read).length;

    return (
        <div 
            className={`${dropdownPanel} liquid-glass absolute top-full right-0 mt-3 w-80 max-w-sm rounded-2xl text-gray-900 dark:text-white transform transition-all duration-200 origin-top-right animate-fade-in-down`}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="notifications-title"
        >
            <style>{`
                @keyframes fade-in-down {
                    from { opacity: 0; transform: translateY(-10px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .animate-fade-in-down {
                    animation: fade-in-down 0.2s ease-out forwards;
                }
            `}</style>

            <div className="p-3 flex justify-between items-center border-b border-black/10 dark:border-white/10">
                <h3 id="notifications-title" className="font-semibold text-floating">{t('notifications')}</h3>
                {unreadCount > 0 && (
                    <button onClick={onMarkAllRead} className="text-xs font-semibold px-3 py-1 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors text-floating">
                        {t('markAllAsRead')}
                    </button>
                )}
            </div>

            <div className="max-h-96 overflow-y-auto custom-scrollbar">
                {notificationCount > 0 ? (
                    <ul className="p-2">
                        {notifications.map((notification) => (
                            <NotificationDropdownItem
                                key={notification.id}
                                notification={notification}
                                t={t}
                                canApproveRequests={canApproveRequests}
                                canApproveSpecificRequest={canApproveSpecificRequest}
                                onDecision={handleRequestDecision}
                            />
                        ))}
                    </ul>
                ) : (
                    <div className="p-4 min-h-[12rem] flex items-center justify-center">
                        <p className="text-sm text-center text-gray-700 dark:text-gray-300 text-floating">{t('noNewNotifications')}</p>
                    </div>
                )}
            </div>
            
            {notificationCount > 0 && (
                <div className="p-2 border-t border-black/10 dark:border-white/10">
                    <a 
                        href="#" 
                        onClick={(e) => {
                            e.preventDefault();
                            onViewAll();
                        }}
                        className="block w-full text-center text-sm font-semibold text-blue-600 dark:text-blue-400 hover:bg-black/5 dark:hover:bg-white/5 py-2 rounded-lg transition-colors"
                    >
                        {t('seeAllNotifications')}
                    </a>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
