import React from 'react';
import { formatDateTime } from './archivePageUtils';
import type { ArchiveLeadRow } from './types';
import type { StudentInfoTab } from '../../../leads/types/studentInfoTab';
import {
    formatSubmittedTimestamp,
    getBranchChipClass,
    getStatusChipClass,
    getVisaRefusalClass,
    normalizePhoneDisplay,
    STATUS_OPTIONS,
} from '../../../leads/leads-page/LeadsPageTableUtils';

interface ArchiveLeadsTableProps {
    t: (key: string, defaultValue?: string) => string;
    rows: ArchiveLeadRow[];
    onOpenStudentProfile: (leadId: string, targetTab?: StudentInfoTab, leadDocPath?: string) => void;
    showBranchColumn: boolean;
    showAssignedCounsellor?: boolean;
}

const getLeadStatusChipClass = (status: string) => {
    const trimmedStatus = String(status || '').trim();
    if (!trimmedStatus) return getStatusChipClass('New Lead');

    if (STATUS_OPTIONS.includes(trimmedStatus as (typeof STATUS_OPTIONS)[number])) {
        return getStatusChipClass(trimmedStatus as (typeof STATUS_OPTIONS)[number]);
    }

    switch (trimmedStatus) {
        case 'Consulted':
            return 'border backdrop-blur-sm shadow-sm border-blue-400/35 bg-blue-500/15 text-blue-800 dark:border-blue-300/35 dark:bg-blue-400/20 dark:text-blue-200';
        case 'Still undecided':
            return 'border backdrop-blur-sm shadow-sm border-orange-400/35 bg-orange-500/15 text-orange-800 dark:border-orange-300/35 dark:bg-orange-400/20 dark:text-orange-200';
        case 'Pending Documents':
            return 'border backdrop-blur-sm shadow-sm border-amber-400/35 bg-amber-500/15 text-amber-800 dark:border-amber-300/35 dark:bg-amber-400/20 dark:text-amber-200';
        case 'No Show':
            return 'border backdrop-blur-sm shadow-sm border-red-400/35 bg-red-500/15 text-red-800 dark:border-red-300/35 dark:bg-red-400/20 dark:text-red-200';
        case 'Non-Genuine Student':
            return 'border backdrop-blur-sm shadow-sm border-slate-500/40 bg-slate-700/15 text-slate-800 dark:border-slate-300/35 dark:bg-slate-200/15 dark:text-slate-100';
        default:
            break;
    }

    const lowerStatus = trimmedStatus.toLowerCase();
    if (lowerStatus.includes('granted')) return 'border backdrop-blur-sm shadow-sm border-green-400/30 bg-green-500/15 text-green-800 dark:border-green-300/30 dark:bg-green-400/20 dark:text-green-200';
    if (lowerStatus.includes('unconditional') || lowerStatus.includes('received')) return 'border backdrop-blur-sm shadow-sm border-sky-400/35 bg-sky-500/15 text-sky-800 dark:border-sky-300/35 dark:bg-sky-400/20 dark:text-sky-200';
    if (lowerStatus.includes('required') || lowerStatus.includes('refused') || lowerStatus.includes('withdrawn') || lowerStatus.includes('rejected')) return 'border backdrop-blur-sm shadow-sm border-red-400/35 bg-red-500/15 text-red-800 dark:border-red-300/35 dark:bg-red-400/20 dark:text-red-200';
    if (lowerStatus.includes('conditional') || lowerStatus.includes('refund')) return 'border backdrop-blur-sm shadow-sm border-amber-400/35 bg-amber-500/15 text-amber-800 dark:border-amber-300/35 dark:bg-amber-400/20 dark:text-amber-200';
    if (lowerStatus.includes('submitted') || lowerStatus.includes('lodged') || lowerStatus.includes('processed') || lowerStatus.includes('payment')) return 'border backdrop-blur-sm shadow-sm border-blue-400/35 bg-blue-500/15 text-blue-800 dark:border-blue-300/35 dark:bg-blue-400/20 dark:text-blue-200';

    return 'border backdrop-blur-sm shadow-sm border-gray-400/30 bg-gray-500/15 text-gray-800 dark:border-gray-300/30 dark:bg-gray-400/20 dark:text-gray-200';
};

export const ArchiveLeadsTable: React.FC<ArchiveLeadsTableProps> = ({
    t,
    rows,
    onOpenStudentProfile,
    showBranchColumn,
    showAssignedCounsellor = true,
}) => (
    <table className="w-full min-w-[920px] text-left text-[11px] sm:text-xs">
        <thead className="sticky top-0 bg-white/40 dark:bg-black/40 backdrop-blur-md z-10 text-xs text-gray-500 dark:text-gray-400">
            <tr>
                <th className="px-2 py-2 sm:px-3 sm:py-2 font-semibold whitespace-pre-line leading-tight">{t('submittedTimestamp', 'Submitted Timestamp')}</th>
                <th className="px-2 py-2 sm:px-3 sm:py-2 font-semibold">{t('caseId', 'Case ID')}</th>
                <th className="px-2 py-2 sm:px-3 sm:py-2 font-semibold">{t('fullName', 'Full Name')}</th>
                <th className="px-2 py-2 sm:px-3 sm:py-2 font-semibold">{t('emailAddress', 'Email Address')}</th>
                <th className="px-2 py-2 sm:px-3 sm:py-2 font-semibold">{t('mobileNumber', 'Mobile Number')}</th>
                <th className="px-2 py-2 sm:px-3 sm:py-2 font-semibold text-center">{t('visaRefusal', 'Visa Refusal')}</th>
                {showBranchColumn && (
                    <th className="px-2 py-2 sm:px-3 sm:py-2 font-semibold text-center">{t('branch', 'Branch')}</th>
                )}
                {showAssignedCounsellor && (
                    <th className="px-2 py-2 sm:px-3 sm:py-2 font-semibold">{t('assignedCounsellor', 'Assigned Counsellor')}</th>
                )}
                <th className="px-2 py-2 sm:px-3 sm:py-2 font-semibold">{t('leadStatus', 'Lead Status')}</th>
                <th className="px-2 py-2 sm:px-3 sm:py-2 font-semibold">{t('archivedOn', 'Archived On')}</th>
            </tr>
        </thead>
        <tbody>
            {rows.map((lead) => (
                <tr
                    key={lead.id}
                    onClick={() => onOpenStudentProfile(lead.id, undefined, lead.modalLead?.leadDocPath)}
                    className="border-b border-gray-900/5 dark:border-white/5 transition-colors hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                >
                    <td className="px-2 py-2 sm:px-3 sm:py-2 text-gray-600 dark:text-gray-400">{formatSubmittedTimestamp(lead.submittedAt)}</td>
                    <td className="px-2 py-2 sm:px-3 sm:py-2 text-gray-600 dark:text-gray-400">{lead.caseId || '--'}</td>
                    <td className="px-2 py-2 sm:px-3 sm:py-2 font-semibold text-gray-800 dark:text-gray-200">
                        {lead.fullName || '--'}
                    </td>
                    <td className="px-2 py-2 sm:px-3 sm:py-2 text-gray-600 dark:text-gray-400">{lead.email || '--'}</td>
                    <td className="px-2 py-2 sm:px-3 sm:py-2 text-gray-600 dark:text-gray-400">
                        {normalizePhoneDisplay(lead.phoneNumber, lead.phoneCountryCode)}
                    </td>
                    <td className="px-2 py-2 sm:px-3 sm:py-2">
                        <span className={`inline-flex w-full items-center justify-center text-xs font-semibold rounded-full px-2.5 py-0.5 ${getVisaRefusalClass(lead.visaRefusal)}`}>
                            {lead.visaRefusal}
                        </span>
                    </td>
                    {showBranchColumn && (
                        <td className="px-2 py-2 sm:px-3 sm:py-2">
                            <span className={`inline-flex w-full items-center justify-center text-xs font-semibold rounded-full px-2.5 py-0.5 ${getBranchChipClass(lead.branch)}`}>
                                {lead.branch || '--'}
                            </span>
                        </td>
                    )}
                    {showAssignedCounsellor && (
                        <td className="px-2 py-2 sm:px-3 sm:py-2 text-gray-600 dark:text-gray-400">{lead.assignedCounsellor || '--'}</td>
                    )}
                    <td className="px-2 py-2 sm:px-3 sm:py-2">
                        <span className={`inline-flex w-full items-center justify-center text-xs font-semibold rounded-full px-2.5 py-0.5 ${getLeadStatusChipClass(lead.leadStatus)}`}>
                            {lead.leadStatus || 'New Lead'}
                        </span>
                    </td>
                    <td className="px-2 py-2 sm:px-3 sm:py-2 text-gray-600 dark:text-gray-400">{formatDateTime(lead.archivedAt)}</td>
                </tr>
            ))}
        </tbody>
    </table>
);
