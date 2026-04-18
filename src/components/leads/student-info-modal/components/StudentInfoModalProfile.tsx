import React from 'react';
import { useTranslation } from '../../../../contexts/LanguageContext';
import { OfficeBuildingIcon } from '../../components/icons';
import type { Lead } from '../../leads-page/LeadsPageTypes';
import type { Tab } from '../utils/StudentInfoModalTypes';

interface StudentInfoModalProfileProps {
    editedLead: Lead;
    visibleTabs: Tab[];
    activeTab: Tab;
    isEditing: boolean;
    isActionAllowed: boolean;
    isCaseIdEditing: boolean;
    caseIdDraft: string;
    isCaseIdSaving: boolean;
    canEditCaseId: boolean;
    onEdit: () => void;
    onCaseIdEdit: () => void;
    onCaseIdDraftChange: (value: string) => void;
    onCaseIdCancel: () => void;
    onCaseIdSave: () => void;
    onTabClick: (tab: Tab) => void;
}

const EditIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6 9 17l-5-5" />
    </svg>
);

const XIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 6 6 18" />
        <path d="M6 6l12 12" />
    </svg>
);

const CounsellorIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="#004097" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 20v-2a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
    </svg>
);

const TabButton: React.FC<{ tab: Tab; label: string; isActive: boolean; onClick: () => void }> = ({
    tab,
    label,
    isActive,
    onClick,
}) => (
    <button
        onClick={onClick}
        className={`whitespace-nowrap py-4 px-3 rounded-t-lg font-medium text-sm transition-all duration-200 ${
            isActive
                ? 'text-[#004097] dark:text-blue-400 border-b-2 border-[#004097] dark:border-blue-400'
                : 'text-gray-400 dark:text-gray-500 border-b-2 border-transparent hover:bg-black/5 dark:hover:bg-white/5 hover:text-gray-600 dark:hover:text-gray-300'
        }`}
        aria-current={isActive ? 'page' : undefined}
    >
        {label}
    </button>
);

export const StudentInfoModalProfile: React.FC<StudentInfoModalProfileProps> = ({
    editedLead,
    visibleTabs,
    activeTab,
    isEditing,
    isActionAllowed,
    isCaseIdEditing,
    caseIdDraft,
    isCaseIdSaving,
    canEditCaseId,
    onEdit,
    onCaseIdEdit,
    onCaseIdDraftChange,
    onCaseIdCancel,
    onCaseIdSave,
    onTabClick,
}) => {
    const { t } = useTranslation();
    const branchLabel = String(editedLead.branch || '').trim();
    const branchTranslationKey = branchLabel.toLowerCase().replace(/[\s()]/g, '');
    const getTabLabel = (tab: Tab) => {
        if (tab === 'admin') return t('adminTab', 'Admin');
        return t(tab);
    };

    return (
        <>
            <div className="flex flex-col items-center text-center pb-4">
                <div className="flex flex-col items-center gap-2">
                    <h3 className="text-2xl font-bold text-[#004097] dark:text-blue-400">
                        {editedLead.fullName}
                    </h3>
                    {isActionAllowed && !isEditing && (
                        <button
                            onClick={onEdit}
                            title={t('edit')}
                            aria-label={t('edit')}
                            className="w-8 h-8 rounded-full bg-white/90 dark:bg-black/70 border border-black/10 dark:border-white/10 text-gray-700 dark:text-gray-200 shadow-md flex items-center justify-center hover:bg-white dark:hover:bg-black transition-colors"
                        >
                            <EditIcon />
                        </button>
                    )}
                </div>
                <div className="mt-2 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    {canEditCaseId && !isCaseIdEditing && (
                        <button
                            type="button"
                            onClick={onCaseIdEdit}
                            title={t('edit')}
                            aria-label={`${t('edit')} ${t('caseId')}`}
                            className="text-gray-400 hover:text-[#004097] dark:hover:text-blue-400 transition-colors"
                        >
                            <EditIcon className="w-4 h-4" />
                        </button>
                    )}
                    <span className="whitespace-nowrap">{t('caseId')}:</span>
                    {!isCaseIdEditing ? (
                        <span className="font-semibold text-gray-700 dark:text-gray-200">{editedLead.caseId || ''}</span>
                    ) : (
                        <div className="flex items-center gap-2">
                            <input
                                value={caseIdDraft}
                                onChange={(e) => onCaseIdDraftChange(e.target.value)}
                                placeholder={t('caseId')}
                                className="w-40 text-sm font-semibold bg-white/80 dark:bg-black/40 px-3 py-1.5 rounded-md border border-black/10 dark:border-white/15 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                type="button"
                                onClick={onCaseIdSave}
                                disabled={isCaseIdSaving}
                                title={t('save')}
                                aria-label={t('save')}
                                className="text-[#004097] dark:text-blue-400 hover:text-[#003070] dark:hover:text-blue-300 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                            >
                                <CheckIcon />
                            </button>
                            <button
                                type="button"
                                onClick={onCaseIdCancel}
                                disabled={isCaseIdSaving}
                                title={t('cancel')}
                                aria-label={t('cancel')}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                            >
                                <XIcon />
                            </button>
                        </div>
                    )}
                </div>
                <div className="flex flex-wrap items-start justify-center gap-x-8 gap-y-4 mt-4">
                    <div className="text-left flex items-start gap-2">
                        <div className="mt-0.5 text-[#004097]">
                            <OfficeBuildingIcon className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{t('branch')}</p>
                            <p className="text-sm font-semibold text-gray-800 dark:text-white">
                                {t(branchTranslationKey, branchLabel || '--')}
                            </p>
                        </div>
                    </div>
                    <div className="text-left flex items-start gap-2">
                        <div className="mt-0.5 text-[#004097]">
                            <CounsellorIcon className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{t('assignedCounsellor')}</p>
                            <p className="text-sm font-semibold text-gray-800 dark:text-white">{editedLead.assignedCounsellor}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="border-b border-black/5 dark:border-white/5 -mx-4 sm:-mx-6 px-2 sm:px-4">
                <nav className="-mb-px flex space-x-2 overflow-x-auto" aria-label="Tabs">
                    {visibleTabs.map((tab) => (
                        <TabButton
                            key={tab}
                            tab={tab}
                            label={getTabLabel(tab)}
                            isActive={activeTab === tab}
                            onClick={() => onTabClick(tab)}
                        />
                    ))}
                </nav>
            </div>
        </>
    );
};
