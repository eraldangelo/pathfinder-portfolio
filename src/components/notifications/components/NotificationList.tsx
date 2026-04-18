import React from 'react';
import type { NotificationGroup, NotificationRecord } from '../utils/notificationUtils';
import NotificationItem from './NotificationItem';

interface NotificationListProps {
    groups: NotificationGroup[];
    canApproveRequests: boolean;
    canApproveRequest?: (notification: NotificationRecord) => boolean;
    onRequestDecision: (notification: NotificationRecord, decision: 'yes' | 'no') => void;
}

const NotificationList: React.FC<NotificationListProps> = ({ groups, canApproveRequests, canApproveRequest, onRequestDecision }) => {
    return (
        <div className="space-y-6">
            {groups.map((group) => (
                <section key={group.label} className="space-y-3">
                    <h3 className="text-sm font-semibold text-[#004097] dark:text-blue-300 uppercase tracking-wide">
                        {group.label}
                    </h3>
                    <div className="space-y-3">
                        {group.items.map((notification) => (
                            <NotificationItem
                                key={notification.id}
                                notification={notification}
                                canApproveRequests={canApproveRequests}
                                canApproveRequest={canApproveRequest}
                                onRequestDecision={onRequestDecision}
                            />
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
};

export default NotificationList;
