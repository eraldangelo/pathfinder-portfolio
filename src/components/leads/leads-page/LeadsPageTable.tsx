import React from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';
import type { AdminStatus, LeadRow, SortConfig, SortableKeys } from './LeadsPageTypes';
import { LeadsPageTableHeader } from './LeadsPageTableHeader';
import { LeadsPageTableRow } from './LeadsPageTableRow';

interface LeadsPageTableProps {
    leads: LeadRow[];
    sortConfig: SortConfig;
    onRequestSort: (key: SortableKeys) => void;
    onOpenStudentProfile: (leadId: string) => void;
    onStatusChange: (leadId: string, status: AdminStatus) => void;
    showBranchColumn: boolean;
    showAssignedCounsellor: boolean;
    canEditStatus: boolean;
}

export const LeadsPageTable: React.FC<LeadsPageTableProps> = ({
    leads,
    sortConfig,
    onRequestSort,
    onOpenStudentProfile,
    onStatusChange,
    showBranchColumn,
    showAssignedCounsellor,
    canEditStatus,
}) => {
    const { t } = useTranslation();

    return (
        <div className="flex-1 min-h-0 min-w-0 w-full max-w-[1700px] mx-auto rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md dark:backdrop-blur-sm bg-white/20 dark:bg-black/20 border border-white/20 dark:border-white/10">
            <div className="w-full overflow-auto custom-scrollbar">
                <table className="w-full min-w-[1100px] xl:min-w-[1400px] text-left text-[11px] sm:text-xs">
                    <LeadsPageTableHeader
                        sortConfig={sortConfig}
                        onRequestSort={onRequestSort}
                        showBranchColumn={showBranchColumn}
                        showAssignedCounsellor={showAssignedCounsellor}
                    />
                    <tbody>
                        {leads.map((lead) => (
                            <LeadsPageTableRow
                                key={lead.id}
                                lead={lead}
                                onOpenStudentProfile={onOpenStudentProfile}
                                onStatusChange={onStatusChange}
                                showBranchColumn={showBranchColumn}
                                showAssignedCounsellor={showAssignedCounsellor}
                                canEditStatus={canEditStatus}
                            />
                        ))}
                    </tbody>
                </table>
                {leads.length === 0 && (
                    <div className="text-center py-16">
                        <p className="font-semibold">{t('noLeadsFound')}</p>
                        <p className="text-gray-500 dark:text-gray-400">{t('tryAdjustingFilters')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

