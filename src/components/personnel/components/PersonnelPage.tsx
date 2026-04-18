import React from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';
import { canCreatePersonnel } from '../../../utils/roles';
import { usePersonnelFilters } from '../hooks/usePersonnelFilters';
import { PersonnelFilters } from './PersonnelFilters';
import { PersonnelGridView } from './PersonnelGridView';
import { PersonnelTableView } from './PersonnelTableView';
import { StaffIcon, UserPlusIcon } from './icons';
import type { PersonnelPageProps } from '../types/PersonnelTypes';

const PersonnelPage: React.FC<PersonnelPageProps> = ({ isReady, role, allPersonnel, onOpenPersonnelProfile, onOpenCreateModal }) => {
    const { t } = useTranslation();
    const {
        viewMode,
        setViewMode,
        searchTerm,
        setSearchTerm,
        selectedBranch,
        setSelectedBranch,
        selectedRole,
        setSelectedRole,
        uniqueRoles,
        filteredPersonnel,
        groupedPersonnel,
    } = usePersonnelFilters(allPersonnel);

    const titleAnimationClasses = `transition-all duration-700 ease-out ${isReady ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`;
    const contentAnimationClasses = `transition-all duration-500 ease-out delay-100 ${isReady ? 'opacity-100' : 'opacity-0'}`;

    return (
        <div className="relative w-full h-full max-w-[1920px] mx-auto">
            <div className="w-full h-full px-4 pt-24 lg:px-8 pb-16 flex flex-col text-sm text-gray-700 dark:text-gray-300">
                <div className={`relative z-10 mb-6 flex justify-between items-center ${titleAnimationClasses}`}>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-[#004097] dark:text-blue-300">{t('staffsPersonnel', 'Staff / Personnel')}</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        {canCreatePersonnel(role) && (
                            <button
                                onClick={onOpenCreateModal}
                                title={t('createNewPersonnelProfile')}
                                aria-label={t('createNewPersonnelProfile')}
                                className="glass-btn pathfinder-blue w-11 h-11 rounded-full p-0"
                            >
                                <UserPlusIcon className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>

                <PersonnelFilters
                    contentAnimationClasses={contentAnimationClasses}
                    searchTerm={searchTerm}
                    onSearchTermChange={setSearchTerm}
                    selectedBranch={selectedBranch}
                    onSelectedBranchChange={setSelectedBranch}
                    selectedRole={selectedRole}
                    onSelectedRoleChange={setSelectedRole}
                    uniqueRoles={uniqueRoles}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                />

                <div className={`flex-grow ${contentAnimationClasses}`}>
                    {filteredPersonnel.length > 0 ? (
                        viewMode === 'grid' ? (
                            <PersonnelGridView groupedPersonnel={groupedPersonnel} onOpenPersonnelProfile={onOpenPersonnelProfile} />
                        ) : (
                            <PersonnelTableView groupedPersonnel={groupedPersonnel} onOpenPersonnelProfile={onOpenPersonnelProfile} />
                        )
                    ) : (
                        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                            <StaffIcon className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                            <p className="text-lg font-semibold">{t('noPersonnelFound', 'No Personnel Found')}</p>
                            <p className="mt-1">{t('tryAdjustingFilters', 'Try adjusting your search or filters.')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PersonnelPage;
