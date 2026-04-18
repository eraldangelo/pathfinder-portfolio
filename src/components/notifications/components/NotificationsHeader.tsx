import React from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';

interface NotificationsHeaderProps {
    isReady: boolean;
    totalCount: number;
}

const NotificationsHeader: React.FC<NotificationsHeaderProps> = ({ isReady, totalCount }) => {
    const { t } = useTranslation();
    const titleAnimationClasses = `transition-all duration-700 ease-out ${isReady ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`;
    const summaryFallback = 'You have {{count}} notifications.';
    const summary = t('notificationSummary', summaryFallback).replace('{{count}}', String(totalCount));

    return (
        <div className={`flex flex-col gap-2 mb-6 ${titleAnimationClasses}`}>
            <div>
                <h1 className="text-3xl font-bold text-[#004097] dark:text-blue-300">{t('notifications')}</h1>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {summary}
                </p>
            </div>
        </div>
    );
};

export default NotificationsHeader;
