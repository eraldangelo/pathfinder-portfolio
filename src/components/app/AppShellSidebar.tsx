import React from 'react';
import MobileSidebar from '../layout/components/MobileSidebar';
import type { TimeLogEntry, TimeTrackingStatus, User } from '../../types';
import type { SidebarNavItem } from './AppShell.types';

interface AppShellSidebarProps {
    isOpen: boolean;
    isCollapsed: boolean;
    navItems: SidebarNavItem[];
    user: User;
    timeTrackingStatus: TimeTrackingStatus;
    timeLog: TimeLogEntry[];
    hasTimedInToday: boolean;
    hasTakenLunchToday: boolean;
    notificationCount: number;
    logoUrl: string;
    onClose: () => void;
    onToggleCollapse: () => void;
    onLogout: () => void;
    onClearNotifications: () => void;
    onTimeIn: () => void;
    onTimeOut: () => void;
    onStartLunch: () => void;
    onEndLunch: () => void;
    onOpenProfile: () => void;
    onGoToDashboard: () => void;
    onGoToLeads: () => void;
    onGoToApplications: () => void;
    onGoToArchive: () => void;
    onGoToEducationProviders: () => void;
    onGoToTimesheet: () => void;
    onGoToPersonnel: () => void;
    onGoToNotifications: () => void;
}

const AppShellSidebar: React.FC<AppShellSidebarProps> = ({
    isOpen,
    isCollapsed,
    navItems,
    user,
    timeTrackingStatus,
    timeLog,
    hasTimedInToday,
    hasTakenLunchToday,
    notificationCount,
    logoUrl,
    onClose,
    onToggleCollapse,
    onLogout,
    onClearNotifications,
    onTimeIn,
    onTimeOut,
    onStartLunch,
    onEndLunch,
    onOpenProfile,
    onGoToDashboard,
    onGoToLeads,
    onGoToApplications,
    onGoToArchive,
    onGoToEducationProviders,
    onGoToTimesheet,
    onGoToPersonnel,
    onGoToNotifications,
}) => (
    <MobileSidebar
        isOpen={isOpen}
        onClose={onClose}
        onLogout={onLogout}
        navItems={navItems}
        user={user}
        timeTrackingStatus={timeTrackingStatus}
        onTimeIn={onTimeIn}
        onTimeOut={onTimeOut}
        onStartLunch={onStartLunch}
        onEndLunch={onEndLunch}
        notificationCount={notificationCount}
        onClearNotifications={onClearNotifications}
        hasTimedInToday={hasTimedInToday}
        hasTakenLunchToday={hasTakenLunchToday}
        timeLog={timeLog}
        isCollapsed={isCollapsed}
        onToggleCollapse={onToggleCollapse}
        logoUrl={logoUrl}
        onOpenProfile={onOpenProfile}
        onGoToDashboard={onGoToDashboard}
        onGoToLeads={onGoToLeads}
        onGoToApplications={onGoToApplications}
        onGoToArchive={onGoToArchive}
        onGoToEducationProviders={onGoToEducationProviders}
        onGoToTimesheet={onGoToTimesheet}
        onGoToPersonnel={onGoToPersonnel}
        onGoToNotifications={onGoToNotifications}
    />
);

export default AppShellSidebar;
