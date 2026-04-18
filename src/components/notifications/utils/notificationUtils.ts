export type NotificationRecord = {
    id: string;
    message: string;
    timestamp: Date;
    read?: boolean;
    eventKey?: string | null;
    actorName?: string | null;
    actorRole?: string | null;
    actorBranch?: string | null;
    eventTime?: string | null;
    requestId?: string | null;
    requestOwnerId?: string | null;
    requestStatus?: 'pending' | 'approved' | 'rejected' | string | null;
    requestType?: 'leave' | 'offset' | string | null;
    requestDate?: string | null;
    requestFromDate?: string | null;
    requestToDate?: string | null;
    requestDayCount?: number | null;
    requestHours?: number | null;
    requestStartTime?: string | null;
    requestEndTime?: string | null;
    requestReason?: string | null;
    requesterName?: string | null;
    requesterBranch?: string | null;
    requesterRole?: string | null;
    approverName?: string | null;
};

export type NotificationGroup = {
    label: string;
    items: NotificationRecord[];
};

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const isSameDay = (a: Date, b: Date) => startOfDay(a).getTime() === startOfDay(b).getTime();

const isYesterday = (date: Date) => {
    const today = startOfDay(new Date());
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    return isSameDay(date, yesterday);
};

export const groupNotifications = (
    notifications: NotificationRecord[],
    t: (key: string, options?: { [key: string]: string | number } | string) => string
): NotificationGroup[] => {
    const groups: Record<string, NotificationRecord[]> = {
        [t('today', 'Today')]: [],
        [t('yesterday', 'Yesterday')]: [],
        [t('earlier', 'Earlier')]: [],
    };

    notifications.forEach((notification) => {
        if (isSameDay(notification.timestamp, new Date())) {
            groups[t('today', 'Today')].push(notification);
            return;
        }
        if (isYesterday(notification.timestamp)) {
            groups[t('yesterday', 'Yesterday')].push(notification);
            return;
        }
        groups[t('earlier', 'Earlier')].push(notification);
    });

    return Object.entries(groups)
        .map(([label, items]) => ({ label, items }))
        .filter((group) => group.items.length > 0);
};

export const formatRelativeTime = (
    date: Date,
    t: (key: string, options?: { [key: string]: string | number } | string) => string
) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return t('yearsAgo', { count: Math.floor(interval) });
    interval = seconds / 2592000;
    if (interval > 1) return t('monthsAgo', { count: Math.floor(interval) });
    interval = seconds / 86400;
    if (interval > 1) return t('daysAgo', { count: Math.floor(interval) });
    interval = seconds / 3600;
    if (interval > 1) return t('hoursAgo', { count: Math.floor(interval) });
    interval = seconds / 60;
    if (interval > 1) return t('minutesAgo', { count: Math.floor(interval) });
    return t('justNow');
};
