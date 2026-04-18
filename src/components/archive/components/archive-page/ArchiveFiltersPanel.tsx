import React from 'react';
import { CalendarIcon, ChevronDownIcon, OfficeBuildingIcon, SearchIcon } from '../../../leads/components/icons';

interface ArchiveFiltersPanelProps {
    t: (key: string, defaultValue?: string) => string;
    selectedYear: string;
    onSelectedYearChange: (value: string) => void;
    yearOptions: string[];
    selectedBranch: string;
    onSelectedBranchChange: (value: string) => void;
    branchOptions: string[];
    isBranchSelectionLocked: boolean;
    searchTerm: string;
    onSearchTermChange: (value: string) => void;
}

const ArchiveFiltersPanel: React.FC<ArchiveFiltersPanelProps> = ({
    t,
    selectedYear,
    onSelectedYearChange,
    yearOptions,
    selectedBranch,
    onSelectedBranchChange,
    branchOptions,
    isBranchSelectionLocked,
    searchTerm,
    onSearchTermChange,
}) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-6 backdrop-blur-md bg-white/30 dark:bg-black/20 shadow-md border border-white/40 dark:border-white/10 rounded-2xl p-4">
        <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('year', 'Year')}
            </label>
            <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500 dark:text-gray-400">
                    <CalendarIcon />
                </div>
                <select
                    value={selectedYear}
                    onChange={(event) => onSelectedYearChange(event.target.value)}
                    className="w-full pl-10 pr-8 py-2 text-sm bg-white/60 dark:bg-black/40 border border-gray-400/50 dark:border-white/20 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                >
                    {yearOptions.map((year) => (
                        <option key={year} value={year}>
                            {year === 'all' ? t('allYears', 'All Years') : year}
                        </option>
                    ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                    <ChevronDownIcon />
                </div>
            </div>
        </div>

        <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('branch', 'Branch')}
            </label>
            <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500 dark:text-gray-400">
                    <OfficeBuildingIcon />
                </div>
                <select
                    value={selectedBranch}
                    onChange={(event) => onSelectedBranchChange(event.target.value)}
                    className="w-full pl-10 pr-8 py-2 text-sm bg-white/60 dark:bg-black/40 border border-gray-400/50 dark:border-white/20 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                    disabled={isBranchSelectionLocked}
                >
                    {branchOptions.map((branch) => (
                        <option key={branch} value={branch}>
                            {branch === 'all' ? t('allBranches', 'All Branches') : branch}
                        </option>
                    ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                    <ChevronDownIcon />
                </div>
            </div>
        </div>

        <div className="col-span-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('keywords', 'Keywords')}
            </label>
            <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500 dark:text-gray-400">
                    <SearchIcon />
                </div>
                <input
                    value={searchTerm}
                    onChange={(event) => onSearchTermChange(event.target.value)}
                    placeholder={t('archiveSearchPlaceholder', 'Search by name, case ID, lead ID, school...')}
                    className="w-full pl-10 pr-4 py-2 text-sm bg-white/60 dark:bg-black/40 border border-gray-400/50 dark:border-white/20 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
        </div>
    </div>
);

export default ArchiveFiltersPanel;
