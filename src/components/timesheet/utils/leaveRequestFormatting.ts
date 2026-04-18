import { parseLocalDateKey } from '../../../utils/timesheet';
import type { LeaveRequestStatus } from '../components/TimesheetLeaveRequests';

export const leaveStatusStyles: Record<LeaveRequestStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
    approved: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
};

export const formatLeaveRequestDate = (dateKey?: string | null) => {
    if (!dateKey) return '--';
    const parsed = parseLocalDateKey(dateKey);
    return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })
        .format(parsed)
        .replace(/ /g, '-');
};
