import React from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';
import { formatReadableDate } from '../../../utils/date';
import {
    formatOffsetRequestDate,
    formatOffsetRequestHours,
    formatOffsetRequestTimeRange,
    offsetStatusStyles,
} from '../utils/offsetRequestFormatting';
import { TimesheetApprovalDecisionCell } from './TimesheetApprovalDecisionCell';
import TimesheetOffsetTrackerIcon from './TimesheetOffsetTrackerIcon';
import { RequestFilterOption, TimesheetRequestPanelHeader } from './TimesheetRequestPanelHeader';

export type OffsetRequestStatus = 'pending' | 'approved' | 'rejected';
export type OffsetRequestType = 'offset';

export interface OffsetRequestItem {
    id: string;
    ownerId?: string | null;
    type: OffsetRequestType;
    mode?: 'add' | 'use';
    date?: string | null;
    hours?: number | null;
    startTime?: string | null;
    endTime?: string | null;
    reason: string;
    status: OffsetRequestStatus;
    createdAt: Date | null;
    requesterName?: string | null;
    requesterBranch?: string | null;
    requesterRole?: string | null;
    approvedByName?: string | null;
}

interface TimesheetOffsetTrackerProps {
    requests: OffsetRequestItem[];
    isLoading: boolean;
    showRequester: boolean;
    canApprove: boolean;
    onDecisionChange: (request: OffsetRequestItem, decision: 'yes' | 'no') => void;
    onOpenRequestOffsetModal: () => void;
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
}

export const TimesheetOffsetTracker: React.FC<TimesheetOffsetTrackerProps> = ({
    requests,
    isLoading,
    showRequester,
    canApprove,
    onDecisionChange,
    onOpenRequestOffsetModal,
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
}) => {
    const { t } = useTranslation();

    const requestModeLabel = (mode?: 'add' | 'use') => (mode === 'use' ? t('use', 'Use') : t('add', 'Add'));

    return (
        <div className="flex-grow rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md dark:backdrop-blur-sm bg-white/20 dark:bg-black/20 border border-white/20 dark:border-white/10">
            <TimesheetRequestPanelHeader
                t={t}
                title={t('offsetTracker', 'Offset Tracker')}
                hint={t('offsetTrackerHint', 'Track offset hours and submit offset requests.')}
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
                filterRowClassName="flex flex-wrap items-center gap-3"
                actionContent={
                    <button
                        type="button"
                        onClick={onOpenRequestOffsetModal}
                        className="w-9 h-9 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30 flex items-center justify-center"
                        aria-label={t('requestOffset', 'Request Offset')}
                        title={t('requestOffset', 'Request Offset')}
                    >
                        <TimesheetOffsetTrackerIcon />
                    </button>
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
                            {t('noOffsetRequestsTitle', 'No offset activity yet.')}
                        </p>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            {t('noOffsetRequestsBody', 'Submit an offset request and it will appear here for status tracking.')}
                        </p>
                    </div>
                ) : (
                    <table className={`w-full text-left text-sm ${showRequester || canApprove ? 'min-w-[1120px]' : 'min-w-[800px]'}`}>
                        <thead className="sticky top-0 bg-white/40 dark:bg-black/40 backdrop-blur-md z-10 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            <tr className="border-b border-gray-900/10 dark:border-white/10">
                                {showRequester && <th className="px-4 py-3 font-semibold">{t('requestedBy', 'Requested By')}</th>}
                                <th className="px-4 py-3 font-semibold">{t('requestType', 'Type')}</th>
                                <th className="px-4 py-3 font-semibold">{t('requestDate', 'Date')}</th>
                                <th className="px-4 py-3 font-semibold">{t('offsetHours', 'Offset Hours')}</th>
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
                                const submittedAt = request.createdAt
                                    ? formatReadableDate(request.createdAt, { dateStyle: 'medium', timeStyle: 'short' })
                                    : '-';
                                const requesterName = request.requesterName || t('unknownUser', 'Unknown');
                                const requesterBranch = request.requesterBranch ? `(${request.requesterBranch})` : '';
                                const approvedByLabel = request.approvedByName || '-';

                                return (
                                    <tr key={request.id} className="border-b border-gray-900/5 dark:border-white/5 last:border-b-0">
                                        {showRequester && (
                                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                                <div className="font-semibold">{requesterName}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">{requesterBranch}</div>
                                            </td>
                                        )}
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                                    request.mode === 'use'
                                                        ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                                                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                                }`}
                                            >
                                                {requestModeLabel(request.mode)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                            <div>{formatOffsetRequestDate(request.date)}</div>
                                            {request.mode === 'use' ? (
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    {formatOffsetRequestTimeRange(request.startTime, request.endTime)}
                                                </div>
                                            ) : null}
                                        </td>
                                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                            {formatOffsetRequestHours(request.hours, request.mode, request.startTime, request.endTime)}
                                        </td>
                                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                            <div className="max-w-[360px] whitespace-normal leading-relaxed">{request.reason}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${offsetStatusStyles[request.status]}`}>
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
                                                    isApprovalAllowed={true}
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
