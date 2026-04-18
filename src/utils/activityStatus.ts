import type { ActivityStatus, TimeTrackingStatus } from '../types';
import { getLocalDateKey } from './timesheet';

export type ResolvedActivityStatus = {
    status: ActivityStatus['status'];
    time: string | null;
};

const normalizeActivityStatus = (status: ActivityStatus['status'] | string | null | undefined): ActivityStatus['status'] => {
    const normalized = String(status ?? '').trim().toLowerCase();
    if (!normalized) return 'timed-out';

    if (normalized === 'timed-in' || normalized === 'timed-out' || normalized === 'on-lunch') {
        return normalized as TimeTrackingStatus;
    }

    if (normalized === 'leave' || normalized === 'on-leave' || normalized === 'on leave' || normalized.includes('lieu')) {
        return 'leave';
    }

    return 'timed-out';
};

export const resolveActivityStatus = (
    activityStatus?: ActivityStatus | null,
    todayKey: string = getLocalDateKey()
): ResolvedActivityStatus => {
    if (!activityStatus?.status || !activityStatus.dateKey) {
        return { status: 'timed-out', time: null };
    }

    if (activityStatus.dateKey !== todayKey) {
        return { status: 'timed-out', time: null };
    }

    return {
        status: normalizeActivityStatus(activityStatus.status),
        time: activityStatus.time ?? null,
    };
};

export const getActivityStatusColorClass = (status: ActivityStatus['status'] | TimeTrackingStatus): string => {
    switch (status) {
        case 'timed-in':
            return 'bg-green-500';
        case 'on-lunch':
            return 'bg-red-500';
        case 'leave':
            return 'bg-indigo-500';
        case 'timed-out':
        default:
            return 'bg-gray-400';
    }
};

export const getActivityStatusLabelKey = (status: ActivityStatus['status'] | TimeTrackingStatus): string => {
    switch (status) {
        case 'timed-in':
            return 'online';
        case 'on-lunch':
            return 'onLunch';
        case 'leave':
            return 'leave';
        case 'timed-out':
        default:
            return 'offline';
    }
};
