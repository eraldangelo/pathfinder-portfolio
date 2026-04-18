import React from 'react';
import {
    DASHBOARD_QUARTER_OPTIONS,
    getDashboardMonthOptions,
} from './constants';

interface FunnelWidgetTitleProps {
    t: (key: string, defaultValue?: string) => string;
    funnelHeadingLabel: string;
    isBranchScopedDashboard: boolean;
    showStaffRoleFilter: boolean;
    selectedFunnelLocation: string;
    onFunnelLocationChange: (value: string) => void;
    funnelLocationOptions: string[];
    selectedFunnelMonth: string;
    onFunnelMonthChange: (value: string) => void;
    selectedQuarter: string;
    onQuarterChange: (value: string) => void;
    selectedFunnelStaffRole: string;
    onFunnelStaffRoleChange: (value: string) => void;
    funnelStaffOptions: Array<{ value: string; label: string }>;
}

const selectClassName =
    'min-w-[120px] rounded-lg border border-gray-300/70 bg-white/70 px-2 py-1 text-sm font-medium text-gray-700 shadow-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-white/20 dark:bg-black/50 dark:text-gray-200';

const FunnelWidgetTitle: React.FC<FunnelWidgetTitleProps> = ({
    t,
    funnelHeadingLabel,
    isBranchScopedDashboard,
    showStaffRoleFilter,
    selectedFunnelLocation,
    onFunnelLocationChange,
    funnelLocationOptions,
    selectedFunnelMonth,
    onFunnelMonthChange,
    selectedQuarter,
    onQuarterChange,
    selectedFunnelStaffRole,
    onFunnelStaffRoleChange,
    funnelStaffOptions,
}) => (
    <span className="inline-flex flex-wrap items-center gap-2">
        <span>{funnelHeadingLabel}</span>
        <span className="pl-1 text-sm font-medium text-gray-500 dark:text-gray-400">
            {t('filterBy', 'Filter by:')}
        </span>
        {!isBranchScopedDashboard && (
            <select
                value={selectedFunnelLocation}
                onChange={(event) => onFunnelLocationChange(event.target.value)}
                className={`min-w-[140px] ${selectClassName}`}
                aria-label={t('branch', 'Branch')}
            >
                {funnelLocationOptions.map((location) => (
                    <option key={location} value={location}>
                        {location}
                    </option>
                ))}
            </select>
        )}
        <select
            value={selectedFunnelMonth}
            onChange={(event) => onFunnelMonthChange(event.target.value)}
            className={selectClassName}
            aria-label={t('month', 'Month')}
        >
            {getDashboardMonthOptions(selectedQuarter).map((month) => (
                <option key={month.value} value={month.value}>
                    {t(month.label, month.label)}
                </option>
            ))}
        </select>
        <select
            value={selectedQuarter}
            onChange={(event) => onQuarterChange(event.target.value)}
            className={selectClassName}
            aria-label={t('quarter', 'Quarter')}
        >
            {DASHBOARD_QUARTER_OPTIONS.map((quarter) => (
                <option key={quarter.value} value={quarter.value}>
                    {t(quarter.label, quarter.label)}
                </option>
            ))}
        </select>
        {showStaffRoleFilter && (
            <select
                value={selectedFunnelStaffRole}
                onChange={(event) => onFunnelStaffRoleChange(event.target.value)}
                className={`min-w-[190px] ${selectClassName}`}
                aria-label={t('staff', 'Staff')}
            >
                {funnelStaffOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        )}
    </span>
);

export default FunnelWidgetTitle;
