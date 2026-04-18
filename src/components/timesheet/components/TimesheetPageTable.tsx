import React from 'react';
import type { DailyLog } from '../../../data/timesheet';
import { useTranslation } from '../../../contexts/LanguageContext';
import { getStatusChipClass } from '../utils/TimesheetPageUtils';

interface TimesheetPageTableProps {
    logs: DailyLog[];
    onSelectLog: (log: DailyLog) => void;
    onRemarksChange: (date: Date, newRemarks: string) => void;
}

const amGroupClass = 'bg-sky-100/70 text-sky-900 dark:bg-sky-500/15 dark:text-sky-200';
const pmGroupClass = 'bg-amber-100/70 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200';

const formatDate = (date: Date): string => new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
}).format(date).replace(/ /g, '-');

export const TimesheetPageTable: React.FC<TimesheetPageTableProps> = ({
    logs,
    onSelectLog,
    onRemarksChange,
}) => {
    const { t } = useTranslation();

    return (
        <div className="flex-grow rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md dark:backdrop-blur-sm bg-white/20 dark:bg-black/20 border border-white/20 dark:border-white/10">
            <div className="w-full h-full overflow-auto custom-scrollbar">
                <table className="w-full min-w-[1000px] text-center text-sm">
                    <thead className="sticky top-0 bg-white/40 dark:bg-black/40 backdrop-blur-md z-10 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        <tr className="border-b border-gray-900/10 dark:border-white/10">
                            <th scope="col" rowSpan={2} className="px-2 sm:px-4 py-3 font-semibold align-middle">
                                {t('date', 'DATE')}
                            </th>
                            <th scope="col" rowSpan={2} className="px-2 sm:px-4 py-3 font-semibold align-middle">
                                {t('day', 'DAY')}
                            </th>
                            <th scope="colgroup" colSpan={2} className={`px-2 sm:px-4 py-2 font-semibold text-center border-x border-sky-200/60 dark:border-sky-400/30 ${amGroupClass}`}>
                                {t('am', 'AM')}
                            </th>
                            <th scope="colgroup" colSpan={2} className={`px-2 sm:px-4 py-2 font-semibold text-center border-x border-amber-200/60 dark:border-amber-400/30 ${pmGroupClass}`}>
                                {t('pm', 'PM')}
                            </th>
                            <th scope="col" rowSpan={2} className="px-2 sm:px-4 py-3 font-semibold align-middle">
                                {t('totalHours', 'TOTAL HOURS')}
                            </th>
                            <th scope="col" rowSpan={2} className="px-2 sm:px-4 py-3 font-semibold align-middle">
                                {t('status', 'STATUS')}
                            </th>
                            <th scope="col" rowSpan={2} className="px-2 sm:px-4 py-3 font-semibold align-middle">
                                {t('remarks', 'REMARKS')}
                            </th>
                        </tr>
                        <tr className="border-b border-gray-900/10 dark:border-white/10">
                            <th scope="col" className={`px-2 sm:px-4 py-2 font-semibold ${amGroupClass}`}>
                                {t('timeIn', 'TIME IN')}
                            </th>
                            <th scope="col" className={`px-2 sm:px-4 py-2 font-semibold border-r border-sky-200/60 dark:border-sky-400/30 ${amGroupClass}`}>
                                {t('timeOut', 'TIME OUT')}
                            </th>
                            <th scope="col" className={`px-2 sm:px-4 py-2 font-semibold ${pmGroupClass}`}>
                                {t('timeIn', 'TIME IN')}
                            </th>
                            <th scope="col" className={`px-2 sm:px-4 py-2 font-semibold border-r border-amber-200/60 dark:border-amber-400/30 ${pmGroupClass}`}>
                                {t('timeOut', 'TIME OUT')}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map(log => {
                            const isWeekend = log.day === 'Saturday' || log.day === 'Sunday';
                            const isRemarksLocked = ['on leave', 'offset'].includes(log.status.toLowerCase());
                            const canOpen = Boolean(log.timeIn || log.timeOut);
                            const placeholder = <span className="text-gray-400 dark:text-gray-500">--:--</span>;
                            const rowClasses = `border-b border-gray-900/5 dark:border-white/5 last:border-b-0 hover:bg-black/5 dark:hover:bg-white/5 transition-colors duration-200 ${canOpen ? 'cursor-pointer' : 'cursor-default'}`;

                            return (
                                <tr
                                    key={log.date.toString()}
                                    className={rowClasses}
                                    onClick={() => canOpen && onSelectLog(log)}
                                >
                                    <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap font-semibold text-gray-700 dark:text-gray-400">{formatDate(log.date)}</td>
                                    <td className={`px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap font-medium ${isWeekend ? 'text-red-500 dark:text-red-400 font-semibold' : 'text-gray-700 dark:text-gray-400'}`}>{t(log.day.toLowerCase(), log.day)}</td>
                                    <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-gray-700 dark:text-gray-300">{log.timeIn?.time || placeholder}</td>
                                    <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-gray-700 dark:text-gray-300">{log.lunchStart?.time || placeholder}</td>
                                    <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-gray-700 dark:text-gray-300">{log.lunchEnd?.time || placeholder}</td>
                                    <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-gray-700 dark:text-gray-300">{log.timeOut?.time || placeholder}</td>
                                    <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-gray-700 dark:text-gray-300">{log.totalHours || placeholder}</td>
                                    <td className="px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
                                        <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusChipClass(log.status, t)}`}>
                                            {t(log.status.toLowerCase().replace(/\s/g, ''), log.status)}
                                        </span>
                                    </td>
                                    <td className="px-2 py-2 sm:px-4 sm:py-3 w-1/4">
                                            <input
                                                type="text"
                                                value={log.remarks || ''}
                                                onChange={(e) => {
                                                if (isRemarksLocked) return;
                                                onRemarksChange(log.date, e.target.value);
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            placeholder={t('addANote', 'Add a note...')}
                                            readOnly={isRemarksLocked}
                                            className={`w-full bg-transparent outline-none focus:bg-white/20 dark:focus:bg-black/20 focus:ring-1 focus:ring-blue-500 rounded px-2 py-1 transition-all duration-200 text-center text-gray-800 dark:text-gray-200 placeholder:text-gray-500 dark:placeholder:text-gray-400 ${isRemarksLocked ? 'cursor-not-allowed opacity-70' : ''}`}
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
