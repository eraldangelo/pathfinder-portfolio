import React from 'react';
import FunnelWidgetTitle from './FunnelWidgetTitle';

interface BuildDefaultDashboardFunnelTitleParams {
    t: (key: string, defaultValue?: string) => string;
    funnelHeadingLabel: string;
    isBranchScopedDashboard: boolean;
    selectedFunnelLocation: string;
    onFunnelLocationChange: (value: string) => void;
    funnelLocationOptions: string[];
    selectedFunnelMonth: string;
    onFunnelMonthChange: (value: string) => void;
    selectedQuarter: string;
    onQuarterChange: (value: string) => void;
    showStaffRoleFilter: boolean;
    selectedFunnelStaffRole: string;
    onFunnelStaffRoleChange: (value: string) => void;
    funnelStaffOptions: Array<{ value: string; label: string }>;
}

export const buildDefaultDashboardFunnelTitle = ({
    t,
    funnelHeadingLabel,
    isBranchScopedDashboard,
    selectedFunnelLocation,
    onFunnelLocationChange,
    funnelLocationOptions,
    selectedFunnelMonth,
    onFunnelMonthChange,
    selectedQuarter,
    onQuarterChange,
    showStaffRoleFilter,
    selectedFunnelStaffRole,
    onFunnelStaffRoleChange,
    funnelStaffOptions,
}: BuildDefaultDashboardFunnelTitleParams) => (
    <FunnelWidgetTitle
        t={t}
        funnelHeadingLabel={funnelHeadingLabel}
        isBranchScopedDashboard={isBranchScopedDashboard}
        selectedFunnelLocation={selectedFunnelLocation}
        onFunnelLocationChange={onFunnelLocationChange}
        funnelLocationOptions={funnelLocationOptions}
        selectedFunnelMonth={selectedFunnelMonth}
        onFunnelMonthChange={onFunnelMonthChange}
        selectedQuarter={selectedQuarter}
        onQuarterChange={onQuarterChange}
        showStaffRoleFilter={showStaffRoleFilter}
        selectedFunnelStaffRole={selectedFunnelStaffRole}
        onFunnelStaffRoleChange={onFunnelStaffRoleChange}
        funnelStaffOptions={funnelStaffOptions}
    />
);
