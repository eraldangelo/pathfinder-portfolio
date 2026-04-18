import React from 'react';
import type { SidebarNavItem } from '../types/MobileSidebarTypes';

interface MobileSidebarNavProps {
    navItems: SidebarNavItem[];
    isCollapsed: boolean;
    notificationCount: number;
    onClose: () => void;
    onGoToDashboard: () => void;
    onGoToLeads: () => void;
    onGoToApplications: () => void;
    onGoToArchive: () => void;
    onGoToEducationProviders: () => void;
    onGoToTimesheet: () => void;
    onGoToPersonnel: () => void;
    onGoToNotifications: () => void;
}

export const MobileSidebarNav: React.FC<MobileSidebarNavProps> = ({
    navItems,
    isCollapsed,
    notificationCount,
    onClose,
    onGoToDashboard,
    onGoToLeads,
    onGoToApplications,
    onGoToArchive,
    onGoToEducationProviders,
    onGoToTimesheet,
    onGoToPersonnel,
    onGoToNotifications,
}) => {
    const handleItemClick = (item: SidebarNavItem) => {
        const actions: { [key: string]: () => void } = {
            dashboard: onGoToDashboard,
            leads: onGoToLeads,
            applications: onGoToApplications,
            archive: onGoToArchive,
            'education-providers': onGoToEducationProviders,
            timesheet: onGoToTimesheet,
            personnel: onGoToPersonnel,
            notifications: onGoToNotifications,
        };

        const action = actions[item.key];
        if (action) {
            action();
        } else if (item.active) {
            onClose();
        } else {
            onClose();
        }
    };

    return (
        <nav className="space-y-1 mt-4">
            {navItems.map(item => {
                const Icon = item.icon;
                const isNotifications = item.key === 'notifications';
                return (
                    <a
                        href="#"
                        key={item.key}
                        onClick={(e) => {
                            e.preventDefault();
                            handleItemClick(item);
                        }}
                        title={isCollapsed ? item.name : undefined}
                        className={`relative flex items-center rounded-lg text-sm transition-all duration-200 ${item.active ? 'bg-white text-[#004097] dark:bg-blue-500/30 dark:text-blue-300 font-semibold' : 'text-gray-500 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/10'} px-3 py-2.5 ${isCollapsed ? 'lg:justify-center lg:h-12 lg:w-12 lg:mx-auto lg:p-0 lg:rounded-full' : ''}`}
                    >
                        <Icon width="20" height="20" />
                        <span className={`ml-3 flex-1 ${isCollapsed ? 'lg:hidden' : ''}`}>{item.name}</span>

                        {isNotifications && notificationCount > 0 && (
                            <span className={`flex items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white h-5 w-5 ${isCollapsed ? 'lg:absolute lg:-top-1 lg:-right-1' : ''}`}>
                                {notificationCount > 9 ? '9+' : notificationCount}
                            </span>
                        )}
                    </a>
                );
            })}
        </nav>
    );
};
