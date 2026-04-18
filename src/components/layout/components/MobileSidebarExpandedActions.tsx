import React from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';
import { LEGAL_NOTICE } from '../../../config/legalNotice';
import type { TimeLogEntry, TimeTrackingStatus } from '../../../types';
import { LogoutIcon } from './MobileSidebarIcons';

interface MobileSidebarExpandedActionsProps {
    timeTrackingStatus: TimeTrackingStatus;
    timeLog: TimeLogEntry[];
    showTimeOutButton: boolean;
    isTimeOutButtonDisabled: boolean;
    isLunchButtonDisabled: boolean;
    hasTimedInToday: boolean;
    onTimeIn: () => void;
    onTimeOut: () => void;
    onStartLunch: () => void;
    onEndLunch: () => void;
    onLogout: () => void;
}

export const MobileSidebarExpandedActions: React.FC<MobileSidebarExpandedActionsProps> = ({
    timeTrackingStatus,
    timeLog,
    showTimeOutButton,
    isTimeOutButtonDisabled,
    isLunchButtonDisabled,
    hasTimedInToday,
    onTimeIn,
    onTimeOut,
    onStartLunch,
    onEndLunch,
    onLogout,
}) => {
    const { t } = useTranslation();

    return (
        <div className="mt-auto pt-4">
            <div className="p-4 bg-black/10 dark:bg-white/10 rounded-xl">
                <h4 className="text-xs font-bold text-red-500 uppercase tracking-wider">{t('todaysActivity')}</h4>
                <div className="overflow-y-auto mt-2 max-h-40 -mr-2 pr-2 custom-scrollbar">
                    {timeLog.length > 0 ? (
                        <table className="w-full text-sm">
                            <tbody>
                                {timeLog.map((entry, index) => (
                                    <tr key={index} className="border-t border-gray-500/20">
                                        <td className="py-1 px-1 text-gray-800 dark:text-gray-200">{t(entry.eventKey)}</td>
                                        <td className="py-1 px-1 text-right text-gray-700 dark:text-gray-300 font-mono">{entry.time}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="text-center text-sm text-gray-600 dark:text-gray-300 py-2">{t('noActivityRecorded')}</p>
                    )}
                </div>
            </div>
            <div className="mt-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={showTimeOutButton ? onTimeOut : onTimeIn}
                        disabled={showTimeOutButton ? isTimeOutButtonDisabled : hasTimedInToday}
                        className="glass-btn pathfinder-blue w-full py-2 rounded-lg text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {showTimeOutButton ? t('timeOut') : t('timeIn')}
                    </button>

                    {timeTrackingStatus === 'on-lunch' ? (
                        <button
                            onClick={onEndLunch}
                            className="glass-btn pathfinder-blue w-full py-2 rounded-lg text-sm font-semibold"
                        >
                            {t('backToWork')}
                        </button>
                    ) : (
                        <button
                            onClick={onStartLunch}
                            disabled={isLunchButtonDisabled}
                            className="glass-btn pathfinder-blue w-full py-2 rounded-lg text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {t('lunch')}
                        </button>
                    )}
                </div>

                <button
                    onClick={onLogout}
                    disabled={timeTrackingStatus !== 'timed-out'}
                    className="flex items-center justify-center gap-2 w-full text-red-500 hover:text-red-400 disabled:text-red-500/50 disabled:cursor-not-allowed text-sm font-semibold transition-colors py-1"
                >
                    <LogoutIcon />
                    <span>{t('logout')}</span>
                </button>
            </div>
            <footer className="pt-3 mt-3 border-t border-gray-500/20 text-center text-xs text-gray-600 dark:text-gray-400">
                <p>{LEGAL_NOTICE.productName}</p>
                <p>{LEGAL_NOTICE.creatorLine}</p>
                <p>{LEGAL_NOTICE.rightsLine}</p>
            </footer>
        </div>
    );
};
