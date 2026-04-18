import React from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';
import { StatCard } from './TimesheetPageStatCard';
import {
    CalendarPlusIcon,
    ClockIconStat,
    OfficeBuildingIconStat,
    OffsetHoursIcon,
    VacationLeaveIcon,
} from './TimesheetPageIcons';

interface TimesheetPageStatsProps {
    totalWorkHours: string;
    offsetHours: string;
    availableOffsetMinutes: number;
    userBranch?: string;
    leaveBalance: number;
    leaveUsed: number;
    onOpenRequestLeaveModal: () => void;
    onOpenRequestUseOffsetModal: () => void;
}

export const TimesheetPageStats: React.FC<TimesheetPageStatsProps> = ({
    totalWorkHours,
    offsetHours,
    availableOffsetMinutes,
    userBranch,
    leaveBalance,
    leaveUsed,
    onOpenRequestLeaveModal,
    onOpenRequestUseOffsetModal,
}) => {
    const { t } = useTranslation();
    const MIN_OFFSET_USE_MINUTES = 60;
    const branchLabel = userBranch ? t(userBranch.toLowerCase().replace(/[\s()]/g, ''), userBranch) : t('notApplicable', 'N/A');
    const safeLeaveBalance = Number.isFinite(leaveBalance) ? Math.round(leaveBalance) : 0;
    const safeLeaveUsed = Number.isFinite(leaveUsed) ? Math.round(leaveUsed) : 0;
    const safeOffsetMinutes = Number.isFinite(availableOffsetMinutes) ? Math.max(0, Math.round(availableOffsetMinutes)) : 0;
    const daysLeftLabel = t('daysLeft', { count: safeLeaveBalance });
    const resolvedDaysLeftLabel = daysLeftLabel === 'daysLeft' ? `${safeLeaveBalance} days left` : daysLeftLabel;
    const usedLeavesLabel = t('usedLeavesCount', { count: safeLeaveUsed });
    const resolvedUsedLeavesLabel = usedLeavesLabel === 'usedLeavesCount' ? `${safeLeaveUsed} used` : usedLeavesLabel;

    return (
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            <StatCard title={t('myTotalWorkHours', 'My total work hours')} value={totalWorkHours} icon={<ClockIconStat />} color="glass-orb orb-blue text-blue-700 dark:text-blue-200" />
            <StatCard title={t('myBranch', 'My Branch')} value={branchLabel} icon={<OfficeBuildingIconStat />} color="glass-orb orb-indigo text-indigo-700 dark:text-indigo-200" />
            <StatCard
                title={t('leave', 'Leave')}
                value={resolvedDaysLeftLabel}
                icon={<CalendarPlusIcon />}
                color="glass-orb orb-red text-red-700 dark:text-red-200"
                actionButton={
                    <button
                        type="button"
                        onClick={() => {
                            if (safeLeaveBalance <= 0) return;
                            onOpenRequestLeaveModal();
                        }}
                        disabled={safeLeaveBalance <= 0}
                        aria-disabled={safeLeaveBalance <= 0}
                        title={
                            safeLeaveBalance <= 0
                                ? t('noLeaveBalance', 'No leave balance available')
                                : t('requestLeave', 'Request Leave')
                        }
                        className="w-full px-3 py-1.5 text-xs font-semibold bg-gray-300 text-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded-lg transition-colors hover:bg-gray-400 dark:hover:bg-gray-600 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-gray-300 dark:disabled:hover:bg-gray-700"
                    >
                        {t('requestLeave', 'Request Leave')}
                    </button>
                }
            />
            <StatCard
                title={t('usedLeaves', 'Used Leaves')}
                value={resolvedUsedLeavesLabel}
                icon={<VacationLeaveIcon />}
                color="glass-orb orb-teal text-teal-700 dark:text-teal-200"
            />
            <StatCard
                title={t('offsetHours', 'Offset Hours')}
                value={offsetHours}
                icon={<OffsetHoursIcon />}
                color="glass-orb orb-purple text-purple-700 dark:text-purple-200"
                actionButton={
                    <button
                        type="button"
                        onClick={() => {
                            if (safeOffsetMinutes < MIN_OFFSET_USE_MINUTES) return;
                            onOpenRequestUseOffsetModal();
                        }}
                        disabled={safeOffsetMinutes < MIN_OFFSET_USE_MINUTES}
                        aria-disabled={safeOffsetMinutes < MIN_OFFSET_USE_MINUTES}
                        title={
                            safeOffsetMinutes < MIN_OFFSET_USE_MINUTES
                                ? t('noOffsetHoursAvailable', 'No offset hours available')
                                : t('useOffset', 'Use Offset')
                        }
                        className="w-full px-3 py-1.5 text-xs font-semibold bg-gray-300 text-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded-lg transition-colors hover:bg-gray-400 dark:hover:bg-gray-600 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {t('useOffset', 'Use Offset')}
                    </button>
                }
            />
        </div>
    );
};

