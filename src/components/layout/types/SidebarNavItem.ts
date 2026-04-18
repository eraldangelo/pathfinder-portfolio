import type { ComponentType } from 'react';

export interface SidebarNavItem {
    name: string;
    key: string;
    icon: ComponentType<{ width?: string | number; height?: string | number }>;
    active: boolean;
}
