import { useMemo } from 'react';
import type { DailyLog } from '../../../data/timesheet';

export const usePeriodFilteredLogs = (logs: DailyLog[], period: '1-15' | '16-end') =>
    useMemo(() => {
        return logs.filter((log) => {
            const dayOfMonth = new Date(log.date).getDate();
            if (period === '1-15') {
                return dayOfMonth >= 1 && dayOfMonth <= 15;
            }
            return dayOfMonth >= 16;
        });
    }, [logs, period]);
