import type { User, TimeTrackingStatus, TimeLogEntry } from '../../../types';
import type { SidebarNavItem } from './SidebarNavItem';

export type { SidebarNavItem } from './SidebarNavItem';

export interface MobileSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onLogout: () => void;
    navItems: SidebarNavItem[];
    user: User | null;
    timeTrackingStatus: TimeTrackingStatus;
    onTimeIn: () => void;
    onTimeOut: () => void;
    onStartLunch: () => void;
    onEndLunch: () => void;
    notificationCount: number;
    onClearNotifications: () => void;
    hasTimedInToday: boolean;
    hasTakenLunchToday: boolean;
    timeLog: TimeLogEntry[];
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    logoUrl: string;
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
