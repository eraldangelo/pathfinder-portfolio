import React from 'react';
import Header from '../layout/components/Header';
import type { Theme, TimeTrackingStatus, User } from '../../types';
import type { PersistentNotificationItem } from './hooks/useNotifications';

interface AppShellHeaderProps {
    user: User;
    userRole: string;
    theme: Theme;
    toggleTheme: () => void;
    timeTrackingStatus: TimeTrackingStatus;
    isReady: boolean;
    isSidebarCollapsed: boolean;
    isNotificationDropdownOpen: boolean;
    persistentNotifications: PersistentNotificationItem[];
    notificationCount: number;
    onMenuClick: () => void;
    onClearNotifications: () => void;
    onNotificationDropdownToggle: (value: boolean | ((prev: boolean) => boolean)) => void;
    onOpenNotifications: () => void;
}

const AppShellHeader: React.FC<AppShellHeaderProps> = ({
    user,
    userRole,
    theme,
    toggleTheme,
    timeTrackingStatus,
    isReady,
    isSidebarCollapsed,
    isNotificationDropdownOpen,
    persistentNotifications,
    notificationCount,
    onMenuClick,
    onClearNotifications,
    onNotificationDropdownToggle,
    onOpenNotifications,
}) => (
    <Header
        user={user}
        userRole={userRole}
        theme={theme}
        toggleTheme={toggleTheme}
        timeTrackingStatus={timeTrackingStatus}
        isReady={isReady}
        onMenuClick={onMenuClick}
        notificationCount={notificationCount}
        onClearNotifications={onClearNotifications}
        isSidebarCollapsed={isSidebarCollapsed}
        isNotificationDropdownOpen={isNotificationDropdownOpen}
        setNotificationDropdownOpen={onNotificationDropdownToggle}
        persistentNotifications={persistentNotifications}
        onOpenNotifications={onOpenNotifications}
    />
);

export default AppShellHeader;

