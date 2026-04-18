import React from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';

interface NotificationToolbarProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    filter: 'all' | 'unread';
    onFilterChange: (value: 'all' | 'unread') => void;
    unreadCount: number;
    onMarkAllRead: () => void;
}

const NotificationToolbar: React.FC<NotificationToolbarProps> = ({
    searchTerm,
    onSearchChange,
    filter,
    onFilterChange,
    unreadCount,
    onMarkAllRead,
}) => {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between backdrop-blur-md bg-white/30 dark:bg-black/20 border border-white/30 dark:border-white/10 rounded-2xl p-4 shadow-md">
            <div className="flex-1 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder={t('searchNotifications', 'Search notifications...')}
                        className="w-full pl-4 pr-4 py-2 text-sm bg-white/60 dark:bg-black/40 border border-gray-400/50 dark:border-white/20 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => onFilterChange('all')}
                        className={`px-4 py-2 text-sm rounded-full border transition-colors ${
                            filter === 'all'
                                ? 'bg-blue-500 text-white border-blue-500'
                                : 'bg-white/60 dark:bg-black/40 text-gray-700 dark:text-gray-300 border-gray-300/60 dark:border-white/20'
                        }`}
                    >
                        {t('all', 'All')}
                    </button>
                    <button
                        onClick={() => onFilterChange('unread')}
                        className={`px-4 py-2 text-sm rounded-full border transition-colors ${
                            filter === 'unread'
                                ? 'bg-blue-500 text-white border-blue-500'
                                : 'bg-white/60 dark:bg-black/40 text-gray-700 dark:text-gray-300 border-gray-300/60 dark:border-white/20'
                        }`}
                    >
                        {t('unread', 'Unread')}
                    </button>
                </div>
            </div>

            <button
                onClick={onMarkAllRead}
                disabled={unreadCount === 0}
                className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
                    unreadCount > 0
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
                }`}
            >
                {t('markAllAsRead')}
            </button>
        </div>
    );
};

export default NotificationToolbar;
