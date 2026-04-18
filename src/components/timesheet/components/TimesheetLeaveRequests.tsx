import React from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';
import { formatReadableDate } from '../../../utils/date';
import { formatLeaveRequestDate, leaveStatusStyles } from '../utils/leaveRequestFormatting';
import { TimesheetApprovalDecisionCell } from './TimesheetApprovalDecisionCell';
import { RequestFilterOption, TimesheetRequestPanelHeader } from './TimesheetRequestPanelHeader';

export type LeaveRequestStatus = 'pending' | 'approved' | 'rejected';
export type LeaveRequestType = 'leave';

export interface LeaveRequestItem {
    id: string;
    ownerId?: string | null;
    type: LeaveRequestType;
    date?: string;
    fromDate?: string | null;
    toDate?: string | null;
    dayCount?: number | null;
    reason: string;
    status: LeaveRequestStatus;
    createdAt: Date | null;
    requesterName?: string | null;
    requesterBranch?: string | null;
    requesterRole?: string | null;
    approvedByName?: string | null;
}

interface TimesheetLeaveRequestsProps {
    requests: LeaveRequestItem[];
    isLoading: boolean;
    canApprove: boolean;
    showRequester: boolean;
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
    selectedStaffInfo?: { label: string; leaveBalance: number | null };
    canApproveRequest?: (request: LeaveRequestItem) => boolean;
    onDecisionChange: (request: LeaveRequestItem, decision: 'yes' | 'no') => void;
}

export const TimesheetLeaveRequests: React.FC<TimesheetLeaveRequestsProps> = ({
    requests,
    isLoading,
    canApprove,
    showRequester,
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
    selectedStaffInfo,
    canApproveRequest,
    onDecisionChange,
}) => {
    const { t } = useTranslation();

    return (
        <div className="flex-grow rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md dark:backdrop-blur-sm bg-white/20 dark:bg-black/20 border border-white/20 dark:border-white/10">
            <TimesheetRequestPanelHeader
                t={t}
                title={t('leaveOffsetRequests', 'Leave Requests')}
                hint={t('leaveOffsetRequestsHint', 'Track the status of your leave requests.')}
                requestCount={requests.length}
                showBranchFilter={showBranchFilter}
                branchFilterValue={branchFilterValue}
                branchFilterOptions={branchFilterOptions}
                onBranchFilterChange={onBranchFilterChange}
                showStaffFilter={showStaffFilter}
                staffFilterValue={staffFilterValue}
                staffFilterOptions={staffFilterOptions}
                onStaffFilterChange={onStaffFilterChange}
                showStatusFilter={showStatusFilter}
                statusFilterValue={statusFilterValue}
                statusFilterOptions={statusFilterOptions}
                onStatusFilterChange={onStatusFilterChange}
                secondaryInfo={
                    showStaffFilter && staffFilterValue && selectedStaffInfo ? (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            {t('remainingLeaves', 'Remaining Leave Balance')}:
                            <span className="ml-2 font-semibold text-gray-700 dark:text-gray-200">
                                {selectedStaffInfo.leaveBalance ?? '—'}
                            </span>
                        </div>
                    ) : undefined
                }
            />

            <div className="w-full h-full overflow-auto custom-scrollbar">
                {isLoading ? (
                    <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
                        {t('loadingRequests', 'Loading requests...')}
                    </div>
                ) : requests.length === 0 ? (
                    <div className="p-10 text-center">
                        <p className="text-base font-semibold text-gray-700 dark:text-gray-300">
                            {t('noLeaveRequestsTitle', 'No requests yet')}
                        </p>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            {t('noLeaveRequestsBody', 'Submit a leave request and it will appear here for approval tracking.')}
                        </p>
                    </div>
                ) : (
                    <table className={`w-full text-left text-sm ${canApprove || showRequester ? 'min-w-[1120px]' : 'min-w-[820px]'}`}>
                        <thead className="sticky top-0 bg-white/40 dark:bg-black/40 backdrop-blur-md z-10 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            <tr className="border-b border-gray-900/10 dark:border-white/10">
                                {showRequester && <th className="px-4 py-3 font-semibold">{t('requestedBy', 'Requested By')}</th>}
                                <th className="px-4 py-3 font-semibold">{t('dateFrom', 'From')}</th>
                                <th className="px-4 py-3 font-semibold">{t('dateTo', 'To')}</th>
                                <th className="px-4 py-3 font-semibold">{t('numberOfDays', 'Days')}</th>
                                <th className="px-4 py-3 font-semibold">{t('requestReason', 'Reason')}</th>
                                <th className="px-4 py-3 font-semibold">{t('requestStatus', 'Status')}</th>
                                <th className="px-4 py-3 font-semibold">{t('approvedRejectedBy', 'Approved/Rejected by')}</th>
                                <th className="px-4 py-3 font-semibold">{t('requestSubmitted', 'Submitted')}</th>
                                {canApprove && <th className="px-4 py-3 font-semibold">{t('approval', 'Approval')}</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map((request) => {
                                const statusLabel = t(request.status, request.status.charAt(0).toUpperCase() + request.status.slice(1));
                                const fromDate = request.fromDate || request.date;
                                const toDate = request.toDate || request.date;
                                const dayCount = typeof request.dayCount === 'number' ? request.dayCount : null;
                                const submittedAt = request.createdAt
                                    ? formatReadableDate(request.createdAt, { dateStyle: 'medium', timeStyle: 'short' })
                                    : '—';
                                const requesterName = request.requesterName || t('unknownUser', 'Unknown');
                                const requesterBranch = request.requesterBranch ? `(${request.requesterBranch})` : '';
                                const approvedByLabel = request.approvedByName || '—';
                                const isApprovalAllowed = canApprove && (canApproveRequest ? canApproveRequest(request) : true);

                                return (
                                    <tr key={request.id} className="border-b border-gray-900/5 dark:border-white/5 last:border-b-0">
                                        {showRequester && (
                                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                                <div className="font-semibold">{requesterName}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">{requesterBranch}</div>
                                            </td>
                                        )}
                                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{formatLeaveRequestDate(fromDate)}</td>
                                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{formatLeaveRequestDate(toDate)}</td>
                                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{dayCount ?? '—'}</td>
                                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                            <div className="max-w-[360px] whitespace-normal leading-relaxed">{request.reason}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${leaveStatusStyles[request.status]}`}>
                                                {statusLabel}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{approvedByLabel}</td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{submittedAt}</td>
                                        {canApprove && (
                                            <td className="px-4 py-3">
                                                <TimesheetApprovalDecisionCell
                                                    t={t}
                                                    status={request.status}
                                                    isApprovalAllowed={isApprovalAllowed}
                                                    onDecisionChange={(decision) => onDecisionChange(request, decision)}
                                                />
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};
