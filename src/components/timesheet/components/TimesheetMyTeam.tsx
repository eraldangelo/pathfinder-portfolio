import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';
import { getActivityStatusColorClass, getActivityStatusLabelKey, resolveActivityStatus } from '../../../utils/activityStatus';
import type { TeamTimesheetRow } from '../hooks/useMyTeamTimesheet';

interface TimesheetMyTeamProps {
    rows: TeamTimesheetRow[];
    isLoading: boolean;
}

const tableHeaders: Array<{ key: string; fallback: string }> = [
    { key: 'name', fallback: 'NAME' },
    { key: 'status', fallback: 'STATUS' },
    { key: 'amTimeIn', fallback: 'AM TIME IN' },
    { key: 'amTimeOut', fallback: 'AM TIME OUT' },
    { key: 'pmTimeIn', fallback: 'PM TIME IN' },
    { key: 'totalHours', fallback: 'TOTAL HOURS' },
];

export const TimesheetMyTeam: React.FC<TimesheetMyTeamProps> = ({ rows, isLoading }) => {
    const { t } = useTranslation();
    const placeholder = <span className="text-gray-400 dark:text-gray-500">--:--</span>;

    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const dateText = useMemo(() => {
        return now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    }, [now]);

    const timeText = useMemo(() => {
        return now.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
        });
    }, [now]);

    const getStatusMeta = (row: TeamTimesheetRow) => {
        const resolved = resolveActivityStatus(row.activityStatus);
        const labelKey = getActivityStatusLabelKey(resolved.status);
        const fallback =
            labelKey === 'online'
                ? 'Online'
                : labelKey === 'onLunch'
                ? 'On Lunch'
                : labelKey === 'leave'
                ? 'Leave'
                : 'Offline';
        const label = t(labelKey, fallback);
        const tooltip = resolved.time ? `${label} · ${resolved.time}` : label;
        return {
            colorClass: getActivityStatusColorClass(resolved.status),
            label,
            tooltip,
        };
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center rounded-2xl shadow-2xl p-10 backdrop-blur-md dark:backdrop-blur-sm bg-white/20 dark:bg-black/20 border border-white/20 dark:border-white/10">
                <div className="text-sm text-gray-500 dark:text-gray-400">{t('loading', 'Loading...')}</div>
            </div>
        );
    }

    if (!rows.length) {
        return (
            <div className="flex items-center justify-center rounded-2xl shadow-2xl p-10 backdrop-blur-md dark:backdrop-blur-sm bg-white/20 dark:bg-black/20 border border-white/20 dark:border-white/10">
                <div className="text-sm text-gray-500 dark:text-gray-400">{t('noTeamLogs', 'No team logs found for today.')}</div>
            </div>
        );
    }

    return (
        <div className="flex-grow rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md dark:backdrop-blur-sm bg-white/20 dark:bg-black/20 border border-white/20 dark:border-white/10">
            <div className="px-3 sm:px-5 py-3 border-b border-gray-900/10 dark:border-white/10 bg-white/10 dark:bg-black/10">
                <div className="flex items-center gap-3">
                    <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        {t('today', 'Today')}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        <span className="font-semibold text-gray-700 dark:text-gray-200">{dateText}</span>
                        <span className="mx-2 text-gray-400 dark:text-gray-500">•</span>
                        <span className="font-semibold text-gray-700 dark:text-gray-200">{timeText}</span>
                    </div>
                </div>
            </div>
            <div className="w-full h-full overflow-auto custom-scrollbar">
                <table className="w-full min-w-[900px] text-left text-sm">
                    <thead className="sticky top-0 bg-white/40 dark:bg-black/40 backdrop-blur-md z-10 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        <tr className="border-b border-gray-900/10 dark:border-white/10">
                            {tableHeaders.map((header) => (
                                <th key={header.key} scope="col" className="px-2 sm:px-4 py-3 font-semibold">
                                    {t(header.key, header.fallback)}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.uid} className="border-b border-gray-900/5 dark:border-white/5 last:border-b-0 hover:bg-black/5 dark:hover:bg-white/5 transition-colors duration-200">
                                <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap font-semibold text-gray-700 dark:text-gray-200">
                                    {row.name}
                                </td>
                                <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
                                    {(() => {
                                        const statusMeta = getStatusMeta(row);
                                        return (
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`h-3 w-3 rounded-full ${statusMeta.colorClass}`}
                                                    title={statusMeta.tooltip}
                                                    aria-label={statusMeta.tooltip}
                                                />
                                                <span className="text-sm text-gray-700 dark:text-gray-200">{statusMeta.label}</span>
                                            </div>
                                        );
                                    })()}
                                </td>
                                <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-gray-700 dark:text-gray-300">
                                    {row.log.timeIn?.time || placeholder}
                                </td>
                                <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-gray-700 dark:text-gray-300">
                                    {row.log.lunchStart?.time || placeholder}
                                </td>
                                <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-gray-700 dark:text-gray-300">
                                    {row.log.lunchEnd?.time || placeholder}
                                </td>
                                <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-gray-700 dark:text-gray-300">
                                    {row.log.totalHours || placeholder}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
