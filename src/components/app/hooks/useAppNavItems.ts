import { useMemo } from 'react';
import type { View } from '../../../types';
import { isSatelliteOfficeRole } from '../../../utils/roles';
import {
    AcademicCapIcon,
    BellIcon,
    BriefcaseIcon,
    ClockIcon,
    DocumentTextIcon,
    HomeIcon,
    UsersIcon,
} from '../icons';

interface UseAppNavItemsParams {
    t: (key: string, options?: { [key: string]: string | number } | string) => string;
    userRole: string | null;
    view: View;
    isNotificationDropdownOpen: boolean;
}

export const useAppNavItems = ({ t, userRole, view, isNotificationDropdownOpen }: UseAppNavItemsParams) => {
    return useMemo(
        () => {
            const allItems = [
                { name: t('dashboard'), key: 'dashboard', icon: HomeIcon, active: view === 'dashboard' },
                { name: t('profiles'), key: 'leads', icon: BriefcaseIcon, active: view === 'leads' },
                { name: t('applications'), key: 'applications', icon: DocumentTextIcon, active: view === 'applications' || view === 'application-detail' },
                { name: t('educationProviders'), key: 'education-providers', icon: AcademicCapIcon, active: view === 'education-providers' },
                { name: t('timesheet'), key: 'timesheet', icon: ClockIcon, active: view === 'timesheet' },
                { name: t('personnel'), key: 'personnel', icon: UsersIcon, active: view === 'personnel' },
                { name: t('notifications'), key: 'notifications', icon: BellIcon, active: view === 'notifications' || isNotificationDropdownOpen },
            ];

            if (!isSatelliteOfficeRole(userRole)) {
                return allItems;
            }

            return allItems.filter(
                (item) =>
                    item.key !== 'applications' &&
                    item.key !== 'education-providers' &&
                    item.key !== 'personnel'
            );
        },
        [isNotificationDropdownOpen, t, userRole, view]
    );
};
