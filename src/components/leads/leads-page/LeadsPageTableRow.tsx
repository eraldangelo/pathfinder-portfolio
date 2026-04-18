import React from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';
import type { AdminStatus, LeadRow } from './LeadsPageTypes';
import { storage } from '../../../services/firebase';
import {
    STATUS_OPTIONS,
    formatSubmittedTimestamp,
    getBranchChipClass,
    getStatusChipClass,
    getVisaRefusalClass,
    normalizePhoneDisplay,
} from './LeadsPageTableUtils';
import { DownloadIcon } from '../components/icons';

interface LeadsPageTableRowProps {
    lead: LeadRow;
    onOpenStudentProfile: (leadId: string) => void;
    onStatusChange: (leadId: string, status: AdminStatus) => void;
    showBranchColumn: boolean;
    showAssignedCounsellor: boolean;
    canEditStatus: boolean;
}

const getConsultationStatusChipClass = (status: string) => {
    switch (status) {
        case 'Consulted':
            return 'border backdrop-blur-sm shadow-sm border-blue-400/35 bg-blue-500/15 text-blue-800 dark:border-blue-300/35 dark:bg-blue-400/20 dark:text-blue-200';
        case 'Still undecided':
            return 'border backdrop-blur-sm shadow-sm border-orange-400/35 bg-orange-500/15 text-orange-800 dark:border-orange-300/35 dark:bg-orange-400/20 dark:text-orange-200';
        case 'Pending Documents':
            return 'border backdrop-blur-sm shadow-sm border-amber-400/35 bg-amber-500/15 text-amber-800 dark:border-amber-300/35 dark:bg-amber-400/20 dark:text-amber-200';
        case 'Submitted Application':
            return 'border backdrop-blur-sm shadow-sm border-blue-400/35 bg-blue-500/15 text-blue-800 dark:border-blue-300/35 dark:bg-blue-400/20 dark:text-blue-200';
        case 'No Show':
            return 'border backdrop-blur-sm shadow-sm border-red-400/35 bg-red-500/15 text-red-800 dark:border-red-300/35 dark:bg-red-400/20 dark:text-red-200';
        case 'Non-Genuine Student':
            return 'border backdrop-blur-sm shadow-sm border-slate-500/40 bg-slate-700/15 text-slate-800 dark:border-slate-300/35 dark:bg-slate-200/15 dark:text-slate-100';
        default:
            return 'border backdrop-blur-sm shadow-sm border-gray-400/30 bg-gray-500/15 text-gray-800 dark:border-gray-300/30 dark:bg-gray-400/20 dark:text-gray-200';
    }
};

const getApplicationStatusChipClass = (status: string) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('granted')) return 'border backdrop-blur-sm shadow-sm border-green-400/30 bg-green-500/15 text-green-800 dark:border-green-300/30 dark:bg-green-400/20 dark:text-green-200';
    if (lowerStatus.includes('unconditional') || lowerStatus.includes('received')) return 'border backdrop-blur-sm shadow-sm border-sky-400/35 bg-sky-500/15 text-sky-800 dark:border-sky-300/35 dark:bg-sky-400/20 dark:text-sky-200';
    if (lowerStatus.includes('required') || lowerStatus.includes('refused') || lowerStatus.includes('withdrawn') || lowerStatus.includes('rejected')) return 'border backdrop-blur-sm shadow-sm border-red-400/35 bg-red-500/15 text-red-800 dark:border-red-300/35 dark:bg-red-400/20 dark:text-red-200';
    if (lowerStatus.includes('conditional') || lowerStatus.includes('refund')) return 'border backdrop-blur-sm shadow-sm border-amber-400/35 bg-amber-500/15 text-amber-800 dark:border-amber-300/35 dark:bg-amber-400/20 dark:text-amber-200';
    if (lowerStatus.includes('submitted') || lowerStatus.includes('lodged') || lowerStatus.includes('processed') || lowerStatus.includes('payment')) return 'border backdrop-blur-sm shadow-sm border-blue-400/35 bg-blue-500/15 text-blue-800 dark:border-blue-300/35 dark:bg-blue-400/20 dark:text-blue-200';
    return 'border backdrop-blur-sm shadow-sm border-gray-400/30 bg-gray-500/15 text-gray-800 dark:border-gray-300/30 dark:bg-gray-400/20 dark:text-gray-200';
};

export const LeadsPageTableRow: React.FC<LeadsPageTableRowProps> = ({
    lead,
    onOpenStudentProfile,
    onStatusChange,
    showBranchColumn,
    showAssignedCounsellor,
    canEditStatus,
}) => {
    const { t } = useTranslation();
    const statusValue = lead.adminStatus || 'New Lead';
    const applicationStatus = (lead.applicationStatus || '').trim();
    const consultationStatus = (lead.consultationStatus || '').trim();
    const hasApplicationOverride = Boolean(lead.isSubmission && applicationStatus);
    const hasConsultationOverride = Boolean(
        lead.isSubmission && !hasApplicationOverride && consultationStatus && consultationStatus !== 'Genuine Student'
    );
    const submissionStatusLabel = hasApplicationOverride
        ? applicationStatus
        : hasConsultationOverride
            ? consultationStatus
            : statusValue;
    const submissionStatusClass = hasApplicationOverride
        ? getApplicationStatusChipClass(applicationStatus)
        : hasConsultationOverride
        ? getConsultationStatusChipClass(consultationStatus)
        : getStatusChipClass(statusValue);
    const isNewLeadLocked = Boolean(lead.adminStatus && lead.adminStatus !== 'New Lead');
    const resumePath = (lead.resumeStoragePath || '').trim();

    const handleResumeDownload = async (event: React.MouseEvent) => {
        event.stopPropagation();
        if (!resumePath) return;

        try {
            if (/^https?:\/\//i.test(resumePath)) {
                window.open(resumePath, '_blank', 'noopener,noreferrer');
                return;
            }

            const fileRef = storage?.ref(resumePath);
            if (!fileRef) return;

            const url = await fileRef.getDownloadURL();
            window.open(url, '_blank', 'noopener,noreferrer');
        } catch (error) {
            console.error('Error downloading resume:', error);
        }
    };

    return (
        <tr
            onClick={() => onOpenStudentProfile(lead.id)}
            className="border-b border-gray-900/5 dark:border-white/5 transition-colors hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
        >
            <td className="px-2 py-2 sm:px-3 sm:py-2 text-gray-600 dark:text-gray-400">{formatSubmittedTimestamp(lead.submittedAt)}</td>
            <td className="px-2 py-2 sm:px-3 sm:py-2 text-gray-600 dark:text-gray-400">{lead.caseId}</td>
            <td className="px-2 py-2 sm:px-3 sm:py-2 font-semibold text-gray-800 dark:text-gray-200">{lead.fullName}</td>
            <td className="px-2 py-2 sm:px-3 sm:py-2 text-gray-600 dark:text-gray-400">{lead.email}</td>
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
            <td className="px-2 py-2 sm:px-3 sm:py-2 text-center">
                {resumePath ? (
                    <button
                        type="button"
                        onClick={handleResumeDownload}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-white/10 transition-colors"
                        aria-label={t('downloadResume', 'Download resume')}
                        title={t('downloadResume', 'Download resume')}
                    >
                        <DownloadIcon className="w-4 h-4" />
                    </button>
                ) : null}
            </td>
            {showAssignedCounsellor && (
                <td className="px-2 py-2 sm:px-3 sm:py-2 text-gray-600 dark:text-gray-400">{lead.assignedCounsellor}</td>
            )}
            <td className="px-2 py-2 sm:px-3 sm:py-2">
                {lead.isSubmission ? (
                    <span
                        className={`inline-flex w-full items-center justify-center text-xs font-semibold rounded-full px-2.5 py-0.5 ${submissionStatusClass}`}
                    >
                        {submissionStatusLabel}
                    </span>
                ) : (
                    <select
                        value={statusValue}
                        onChange={(event) => onStatusChange(lead.id, event.target.value as AdminStatus)}
                        onClick={(event) => event.stopPropagation()}
                        disabled={!canEditStatus}
                        className={`w-full text-xs font-semibold rounded-full px-2.5 py-0.5 appearance-none text-center outline-none focus:ring-2 focus:ring-blue-500 ${canEditStatus ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'} ${getStatusChipClass(statusValue)}`}
                    >
                        {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status} disabled={status === 'New Lead' && isNewLeadLocked}>
                                {status}
                            </option>
                        ))}
                    </select>
                )}
            </td>
        </tr>
    );
};
