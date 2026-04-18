import type { LeadHandlersBaseDeps } from './types';

export interface SubmitTransferParams {
    leadId: string;
    reason: string;
    newBranch: string;
    newCounsellor?: string;
}

export const submitTransferRequest = (
    { user, t, showPopup }: LeadHandlersBaseDeps,
    { leadId, reason, newBranch, newCounsellor }: SubmitTransferParams,
    closeTransferModal: () => void
) => {
    const logMessage = t('userRequestedBranchChange', {
        name: user?.displayName || 'User',
        branch: newBranch,
        reason,
    });
    console.log('Transfer Request:', { leadId, reason, newBranch, newCounsellor, logMessage });
    showPopup(t('transferProcessing'));
    closeTransferModal();
};

