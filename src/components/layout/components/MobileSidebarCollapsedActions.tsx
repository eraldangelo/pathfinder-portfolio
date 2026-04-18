import React from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';
import type { TimeTrackingStatus } from '../../../types';
import {
    BackToWorkIcon,
    LunchIcon,
    LogoutIcon,
    TimeInIcon,
    TimeOutIcon,
} from './MobileSidebarIcons';

interface MobileSidebarCollapsedActionsProps {
    isCollapsed: boolean;
    timeTrackingStatus: TimeTrackingStatus;
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

export const MobileSidebarCollapsedActions: React.FC<MobileSidebarCollapsedActionsProps> = ({
    isCollapsed,
    timeTrackingStatus,
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
        <div className={`mt-auto pt-4 flex-col items-center space-y-3 ${isCollapsed ? 'lg:flex' : 'hidden'}`}>
            <button
                onClick={showTimeOutButton ? onTimeOut : onTimeIn}
                disabled={showTimeOutButton ? isTimeOutButtonDisabled : hasTimedInToday}
                title={showTimeOutButton ? t('timeOut') : t('timeIn')}
                className="glass-btn pathfinder-blue w-12 h-12 rounded-full p-0 disabled:cursor-not-allowed disabled:opacity-60"
            >
                {showTimeOutButton ? <TimeOutIcon /> : <TimeInIcon />}
            </button>

            {timeTrackingStatus === 'on-lunch' ? (
                <button
                    onClick={onEndLunch}
                    title={t('backToWork')}
                    className="glass-btn pathfinder-blue w-12 h-12 rounded-full p-0"
                >
                    <BackToWorkIcon />
                </button>
            ) : (
                <button
                    onClick={onStartLunch}
                    disabled={isLunchButtonDisabled}
                    title={t('lunch')}
                    className="glass-btn pathfinder-blue w-12 h-12 rounded-full p-0 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <LunchIcon />
                </button>
            )}
            <button
                onClick={onLogout}
                disabled={timeTrackingStatus !== 'timed-out'}
                title={t('logout')}
                className="flex items-center justify-center w-12 h-12 text-red-500 hover:bg-red-500/10 rounded-full disabled:text-red-500/50 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
            >
                <LogoutIcon width={22} height={22} strokeWidth={2} />
            </button>
        </div>
    );
};
