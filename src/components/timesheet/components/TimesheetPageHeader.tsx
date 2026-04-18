import React from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';

interface TimesheetPageHeaderProps {
    isReady: boolean;
    userDisplayName: string;
    activeTab: string;
    onTabChange: (tab: string) => void;
    showMyTeamTab?: boolean;
    showTimesheetDownloadTab?: boolean;
}

export const TimesheetPageHeader: React.FC<TimesheetPageHeaderProps> = ({
    isReady,
    userDisplayName,
    activeTab,
    onTabChange,
    showMyTeamTab = false,
    showTimesheetDownloadTab = false,
}) => {
    const { t } = useTranslation();
    const titleAnimationClasses = `transition-all duration-700 ease-out ${isReady ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`;

    return (
        <>
            <div className={`relative z-10 mb-6 ${titleAnimationClasses}`}>
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold text-[#004097] dark:text-blue-300">{t('timesheetTitle', 'Timesheet')}</h1>
                </div>
                <p className="text-gray-500 dark:text-gray-400">{t('viewingTimesheetFor', { name: userDisplayName })}</p>
            </div>

            <div className="mb-6 border-b border-gray-300 dark:border-white/10 flex items-center">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button
                        onClick={() => onTabChange('my-timesheet')}
                        className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                            activeTab === 'my-timesheet'
                                ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-300'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500'
                        }`}
                    >
                        {t('myTimesheet', 'My Timesheet')}
                    </button>
                    <button
                        onClick={() => onTabChange('leave-requests')}
                        className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                            activeTab === 'leave-requests'
                                ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-300'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500'
                        }`}
                    >
                        {t('leaveOffsetRequests', 'Leave Requests')}
                    </button>
                    <button
                        onClick={() => onTabChange('offset-tracker')}
                        className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                            activeTab === 'offset-tracker'
                                ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-300'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500'
                        }`}
                    >
                        {t('offsetTracker', 'Offset Tracker')}
                    </button>
                    {showMyTeamTab && (
                        <button
                            onClick={() => onTabChange('my-team')}
                            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === 'my-team'
                                    ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-300'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500'
                            }`}
                        >
                            {t('myTeam', 'My Team')}
                        </button>
                    )}
                    {showTimesheetDownloadTab && (
                        <button
                            onClick={() => onTabChange('timesheet-download')}
                            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === 'timesheet-download'
                                    ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-300'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500'
                            }`}
                        >
                            {t('timesheetDownloadTitle', 'Timesheet Download')}
                        </button>
                    )}
                </nav>
            </div>
        </>
    );
};
