import React from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';
import type { SortConfig, SortableKeys } from './LeadsPageTypes';
import { SortAscIcon, SortDescIcon } from '../components/icons';

interface LeadsPageTableHeaderProps {
    sortConfig: SortConfig;
    onRequestSort: (key: SortableKeys) => void;
    showBranchColumn: boolean;
    showAssignedCounsellor: boolean;
}

export const LeadsPageTableHeader: React.FC<LeadsPageTableHeaderProps> = ({
    sortConfig,
    onRequestSort,
    showBranchColumn,
    showAssignedCounsellor,
}) => {
    const { t } = useTranslation();

    const getSortIndicator = (key: SortableKeys) => {
        if (!sortConfig || sortConfig.key !== key) return null;
        return sortConfig.direction === 'ascending' ? <SortAscIcon /> : <SortDescIcon />;
    };

    return (
        <thead className="sticky top-0 bg-white/40 dark:bg-black/40 backdrop-blur-md z-10 text-xs text-gray-500 dark:text-gray-400">
            <tr className="border-b border-gray-900/10 dark:border-white/10">
                <th className="px-2 py-2 sm:px-3 sm:py-2 font-semibold whitespace-pre-line leading-tight">{t('submittedTimestamp')}</th>
                <th className="px-2 py-2 sm:px-3 sm:py-2">
                    <button onClick={() => onRequestSort('caseId')} className="flex items-center gap-1 font-semibold">{t('caseId')} {getSortIndicator('caseId')}</button>
                </th>
                <th className="px-2 py-2 sm:px-3 sm:py-2">
                    <button onClick={() => onRequestSort('fullName')} className="flex items-center gap-1 font-semibold">{t('fullName')} {getSortIndicator('fullName')}</button>
                </th>
                <th className="px-2 py-2 sm:px-3 sm:py-2">
                    <button onClick={() => onRequestSort('email')} className="flex items-center gap-1 font-semibold">{t('emailAddress')} {getSortIndicator('email')}</button>
                </th>
                <th className="px-2 py-2 sm:px-3 sm:py-2 font-semibold">{t('mobileNumber')}</th>
                <th className="px-2 py-2 sm:px-3 sm:py-2 font-semibold text-center">{t('visaRefusal')}</th>
                {showBranchColumn && (
                    <th className="px-2 py-2 sm:px-3 sm:py-2 text-center">
                        <button onClick={() => onRequestSort('branch')} className="inline-flex w-full items-center justify-center gap-1 font-semibold">{t('branch')} {getSortIndicator('branch')}</button>
                    </th>
                )}
                <th className="px-2 py-2 sm:px-3 sm:py-2 font-semibold text-center">{t('resume', 'Resume')}</th>
                {showAssignedCounsellor && (
                    <th className="px-2 py-2 sm:px-3 sm:py-2">
                        <button onClick={() => onRequestSort('assignedCounsellor')} className="flex items-center gap-1 font-semibold">{t('assignedCounsellor')} {getSortIndicator('assignedCounsellor')}</button>
                    </th>
                )}
                <th className="px-2 py-2 sm:px-3 sm:py-2">
                    <button onClick={() => onRequestSort('leadStatus')} className="flex items-center gap-1 font-semibold">{t('leadStatus')} {getSortIndicator('leadStatus')}</button>
                </th>
            </tr>
        </thead>
    );
};
