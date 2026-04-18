import { parseLocalDateKey } from '../../../utils/timesheet';
import { getOffsetUseUsageHours } from '../../../utils/offsetUse';
import type { OffsetRequestStatus } from '../components/TimesheetOffsetTracker';

export const offsetStatusStyles: Record<OffsetRequestStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
    approved: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
};

export const formatOffsetRequestDate = (dateKey?: string | null) => {
    if (!dateKey) return '-';
    const parsed = parseLocalDateKey(dateKey);
    return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })
        .format(parsed)
        .replace(/ /g, '-');
};

export const formatOffsetRequestHours = (
    hours?: number | null,
    mode?: 'add' | 'use',
    startTime?: string | null,
    endTime?: string | null
) => {
    const effectiveUseHours = mode === 'use' ? getOffsetUseUsageHours(startTime, endTime) : null;
    const resolvedHours =
        typeof effectiveUseHours === 'number' && Number.isFinite(effectiveUseHours)
            ? effectiveUseHours
            : hours;
    if (typeof resolvedHours !== 'number' || !Number.isFinite(resolvedHours)) return '-';
    const resolved = Number.isInteger(resolvedHours) ? resolvedHours.toFixed(0) : String(resolvedHours);
    return `${resolved}h`;
};

export const formatOffsetRequestTimeRange = (startTime?: string | null, endTime?: string | null) => {
    const hasStart = typeof startTime === 'string' && startTime.trim() !== '';
    const hasEnd = typeof endTime === 'string' && endTime.trim() !== '';
    if (!hasStart || !hasEnd) return '-';
    return `${startTime}-${endTime}`;
};
