import React from 'react';
import type { BranchChangeQueueItem } from '../hooks/useBranchChangeQueue';

interface BranchChangeQueuePanelProps {
    requests: BranchChangeQueueItem[];
    isLoading: boolean;
    error: string | null;
    t: (key: string, options?: { [key: string]: string | number } | string) => string;
}

const formatQueueDate = (value: Date | null) => {
    if (!value) return '--';
    return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })
        .format(value)
        .replace(/ /g, '-');
};

const notificationStatusClass: Record<string, string> = {
    sent: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    failed: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30',
    pending: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
};

export const BranchChangeQueuePanel: React.FC<BranchChangeQueuePanelProps> = ({
    requests,
    isLoading,
    error,
    t,
}) => {
    return (
        <section className="rounded-3xl border border-white/30 dark:border-white/10 bg-white/40 dark:bg-black/20 backdrop-blur-md p-5 shadow-lg">
            <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-[#004097] dark:text-blue-300 uppercase tracking-wide">
                    {t('pendingBranchChangeRequests', 'Pending Branch-Change Requests')}
                </h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                    {requests.length}
                </span>
            </div>

            {isLoading ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                    {t('loadingBranchChangeQueue', 'Loading queue...')}
                </p>
            ) : null}

            {!isLoading && error ? (
                <p className="text-sm text-red-600 dark:text-red-300 mt-4">{error}</p>
            ) : null}

            {!isLoading && !error && !requests.length ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                    {t('noPendingBranchChangeRequests', 'No pending branch-change requests for your approval scope.')}
                </p>
            ) : null}

            {!isLoading && !error && requests.length ? (
                <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 border-b border-black/5 dark:border-white/10">
                                <th className="py-2 pr-3">{t('requestDate', 'Date')}</th>
                                <th className="py-2 pr-3">{t('requester', 'Requester')}</th>
                                <th className="py-2 pr-3">{t('branchChangeRoute', 'Route')}</th>
                                <th className="py-2 pr-3">{t('notificationStatus', 'Notification')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map((request) => (
                                <tr
                                    key={request.id}
                                    className="border-b border-black/5 dark:border-white/10 last:border-0"
                                >
                                    <td className="py-2 pr-3 whitespace-nowrap text-gray-700 dark:text-gray-200">
                                        {formatQueueDate(request.createdAt)}
                                    </td>
                                    <td className="py-2 pr-3 text-gray-700 dark:text-gray-200">
                                        <div className="font-medium">{request.requesterName}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {request.requesterRole || '--'}
                                        </div>
                                    </td>
                                    <td className="py-2 pr-3 text-gray-700 dark:text-gray-200">
                                        {(request.currentBranch || '--') + ' -> ' + (request.requestedBranch || '--')}
                                    </td>
                                    <td className="py-2 pr-3">
                                        <span
                                            className={`inline-flex items-center px-2 py-1 rounded-full border text-xs font-medium ${notificationStatusClass[request.notificationStatus] || notificationStatusClass.pending}`}
                                        >
                                            {request.notificationStatus}
                                        </span>
                                        {request.notificationStatus === 'failed' && request.notificationError ? (
                                            <div className="mt-1 text-xs text-red-600 dark:text-red-300">
                                                {request.notificationError}
                                            </div>
                                        ) : null}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : null}
        </section>
    );
};
