import React from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';
import { allBranches } from '../../../data/personnel';
import { GridIcon, ListIcon, SearchIcon } from './icons';

interface PersonnelFiltersProps {
    contentAnimationClasses: string;
    searchTerm: string;
    onSearchTermChange: (value: string) => void;
    selectedBranch: string;
    onSelectedBranchChange: (value: string) => void;
    selectedRole: string;
    onSelectedRoleChange: (value: string) => void;
    uniqueRoles: string[];
    viewMode: 'grid' | 'list';
    onViewModeChange: (mode: 'grid' | 'list') => void;
}

export const PersonnelFilters: React.FC<PersonnelFiltersProps> = ({
    contentAnimationClasses,
    searchTerm,
    onSearchTermChange,
    selectedBranch,
    onSelectedBranchChange,
    selectedRole,
    onSelectedRoleChange,
    uniqueRoles,
    viewMode,
    onViewModeChange,
}) => {
    const { t } = useTranslation();

    return (
        <div className={`mb-6 backdrop-blur-md bg-white/30 dark:bg-black/20 shadow-md border border-white/40 dark:border-white/10 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center ${contentAnimationClasses}`}>
            <div className="relative w-full md:flex-1">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500 dark:text-gray-400"><SearchIcon /></div>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) => onSearchTermChange(event.target.value)}
                    placeholder={t('searchByNameEmail', 'Search by name or email...')}
                    className="w-full pl-10 pr-4 py-2 text-sm bg-white/60 dark:bg-black/40 border border-gray-400/50 dark:border-white/20 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            <select
                value={selectedBranch}
                onChange={(event) => onSelectedBranchChange(event.target.value)}
                className="w-full md:w-auto px-3 pr-10 py-2 text-sm bg-white/60 dark:bg-black/40 border border-gray-400/50 dark:border-white/20 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            >
                <option value="All">{t('allBranches', 'All Branches')}</option>
                {allBranches.map((branch) => <option key={branch} value={branch}>{branch}</option>)}
            </select>
            <select
                value={selectedRole}
                onChange={(event) => onSelectedRoleChange(event.target.value)}
                className="w-full md:w-auto px-3 pr-10 py-2 text-sm bg-white/60 dark:bg-black/40 border border-gray-400/50 dark:border-white/20 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            >
                {uniqueRoles.map((role) => <option key={role} value={role}>{role === 'All' ? t('allRoles', 'All Roles') : role}</option>)}
            </select>
            <div className="p-1 rounded-lg bg-gray-200 dark:bg-gray-700">
                <button onClick={() => onViewModeChange('grid')} className={`px-2 py-1 rounded-md ${viewMode === 'grid' ? 'bg-white dark:bg-gray-800 shadow' : ''}`}><GridIcon /></button>
                <button onClick={() => onViewModeChange('list')} className={`px-2 py-1 rounded-md ${viewMode === 'list' ? 'bg-white dark:bg-gray-800 shadow' : ''}`}><ListIcon /></button>
            </div>
        </div>
    );
};
