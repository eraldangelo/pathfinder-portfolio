import React from 'react';

type TranslationFn = (key: string, options?: { [key: string]: string | number } | string) => string;

interface TimesheetApprovalDecisionCellProps {
    t: TranslationFn;
    status: 'pending' | 'approved' | 'rejected';
    isApprovalAllowed: boolean;
    onDecisionChange: (decision: 'yes' | 'no') => void;
}

export const TimesheetApprovalDecisionCell: React.FC<TimesheetApprovalDecisionCellProps> = ({
    t,
    status,
    isApprovalAllowed,
    onDecisionChange,
}) => {
    const decisionValue = status === 'approved' ? 'yes' : status === 'rejected' ? 'no' : '';

    if (!isApprovalAllowed) {
        return <span className="text-xs text-gray-500 dark:text-gray-400">{t('restricted', 'Restricted')}</span>;
    }

    return (
        <select
            value={decisionValue}
            onChange={(event) => onDecisionChange(event.target.value === 'yes' ? 'yes' : 'no')}
            disabled={status !== 'pending'}
            className="w-28 bg-white/70 dark:bg-black/30 border border-gray-400/40 dark:border-white/10 rounded-lg px-2 py-1 text-sm text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
        >
            <option value="" disabled>
                {t('pending', 'Pending')}
            </option>
            <option value="yes">{t('yes', 'Yes')}</option>
            <option value="no">{t('no', 'No')}</option>
        </select>
    );
};
