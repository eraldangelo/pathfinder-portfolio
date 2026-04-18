import React from 'react';
import type { LogEntry } from '../leads-page/LeadsPage';
import { useTranslation } from '../../../contexts/LanguageContext';

interface LogsTabProps {
    logs: LogEntry[];
}

const LogsTab: React.FC<LogsTabProps> = ({ logs }) => {
    const { t } = useTranslation();

    const formatTimestamp = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        }).format(date);
    };

    return (
        <div className="space-y-2 max-h-[30rem] overflow-y-auto custom-scrollbar pr-2 -mr-2">
            {logs.length === 0 ? (
                <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                    {t('noLogsAvailable')}
                </div>
            ) : (
                <div className="w-full">
                    {logs.map((log, index) => (
                        <div key={`${log.id}-${index}`} className="grid grid-cols-[1fr_auto] gap-x-4 items-center p-2 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                            <p className="text-sm text-gray-800 dark:text-gray-200 truncate" title={`${log.author} ${log.action}`}>
                                <strong className="font-bold text-[#004097] dark:text-blue-400">{log.author}</strong>
                                {' ' + log.action}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">{formatTimestamp(log.timestamp)}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LogsTab;

