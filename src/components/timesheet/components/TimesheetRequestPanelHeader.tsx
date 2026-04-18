import React from 'react';

type TranslationFn = (key: string, options?: { [key: string]: string | number } | string) => string;

export interface RequestFilterOption {
    value: string;
    label: string;
}

interface TimesheetRequestPanelHeaderProps {
    t: TranslationFn;
    title: string;
    hint: string;
    requestCount: number;
    showBranchFilter?: boolean;
    branchFilterValue?: string;
    branchFilterOptions?: string[];
    onBranchFilterChange?: (value: string) => void;
    showStaffFilter?: boolean;
    staffFilterValue?: string;
    staffFilterOptions?: RequestFilterOption[];
    onStaffFilterChange?: (value: string) => void;
    showStatusFilter?: boolean;
    statusFilterValue?: string;
    statusFilterOptions?: RequestFilterOption[];
    onStatusFilterChange?: (value: string) => void;
    actionContent?: React.ReactNode;
    secondaryInfo?: React.ReactNode;
    filterRowClassName?: string;
}

export const TimesheetRequestPanelHeader: React.FC<TimesheetRequestPanelHeaderProps> = ({
    t,
    title,
    hint,
    requestCount,
    showBranchFilter = false,
    branchFilterValue = '',
    branchFilterOptions = [],
    onBranchFilterChange,
    showStaffFilter = false,
    staffFilterValue = '',
    staffFilterOptions = [],
    onStaffFilterChange,
    showStatusFilter = false,
    statusFilterValue = '',
    statusFilterOptions = [],
    onStatusFilterChange,
    actionContent,
    secondaryInfo,
    filterRowClassName = 'flex items-center gap-3',
}) => {
    return (
        <div className="p-6 border-b border-white/10 dark:border-white/10 bg-white/20 dark:bg-black/20 backdrop-blur-md">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                    <h3 className="text-lg font-semibold text-[#004097] dark:text-blue-300">{title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{hint}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <div className={filterRowClassName}>
                        {showBranchFilter && branchFilterOptions.length > 0 && (
                            <label className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                <span className="font-semibold">{t('branch', 'Branch')}:</span>
                                <select
                                    value={branchFilterValue}
                                    onChange={(event) => onBranchFilterChange?.(event.target.value)}
                                    className="bg-white/70 dark:bg-black/30 border border-gray-400/40 dark:border-white/10 rounded-lg px-2 py-1 text-xs text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    {branchFilterOptions.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        )}
                        {showStaffFilter && staffFilterOptions.length > 0 && (
                            <label className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                <span className="font-semibold">{t('staff', 'Staff')}:</span>
                                <select
                                    value={staffFilterValue}
                                    onChange={(event) => onStaffFilterChange?.(event.target.value)}
                                    className="bg-white/70 dark:bg-black/30 border border-gray-400/40 dark:border-white/10 rounded-lg px-2 py-1 text-xs text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    {staffFilterOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        )}
                        {showStatusFilter && statusFilterOptions.length > 0 && (
                            <label className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                <span className="font-semibold">{t('status', 'Status')}:</span>
                                <select
                                    value={statusFilterValue}
                                    onChange={(event) => onStatusFilterChange?.(event.target.value)}
                                    className="bg-white/70 dark:bg-black/30 border border-gray-400/40 dark:border-white/10 rounded-lg px-2 py-1 text-xs text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    {statusFilterOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        )}
                        {actionContent}
                    </div>
                    {secondaryInfo}
                    <div className="text-xs text-gray-500 dark:text-gray-400">{t('requestCount', { count: requestCount })}</div>
                </div>
            </div>
        </div>
    );
};
