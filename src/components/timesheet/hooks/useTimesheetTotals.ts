import { useMemo } from 'react';
import type { DailyLog } from '../../../data/timesheet';

export const useTimesheetTotals = (displayedLogs: DailyLog[], offsetBalance?: number | null) => {
    const totalWorkHours = useMemo(() => {
        const totalMinutes = displayedLogs.reduce((acc, log) => {
            if (log.totalHours) {
                const parts = log.totalHours.match(/(\d+)h\s*(\d+)m/);
                if (parts) {
                    const hours = parseInt(parts[1], 10);
                    const minutes = parseInt(parts[2], 10);
                    return acc + hours * 60 + minutes;
                }
            }
            return acc;
        }, 0);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${hours}h ${minutes}m`;
    }, [displayedLogs]);

    const totalOffsetHours = useMemo(() => {
        const balance = Number.isFinite(offsetBalance) ? Math.max(0, Number(offsetBalance ?? 0)) : 0;
        const totalMinutes = Math.round(balance * 60);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${hours}h ${minutes}m`;
    }, [offsetBalance]);

    const availableOffsetMinutes = useMemo(() => {
        if (!Number.isFinite(offsetBalance)) return 0;
        return Math.max(0, Number(offsetBalance ?? 0) * 60);
    }, [offsetBalance]);

    return { totalWorkHours, totalOffsetHours, availableOffsetMinutes };
};
