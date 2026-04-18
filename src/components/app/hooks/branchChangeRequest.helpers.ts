import type { BranchChangeRequestFormData } from '../../../types/branchChangeRequest';
import { getBranchKey } from './appLeadHandlers/utils/approvalRouting';
import { isBranchManagerRole, isOperationsRole } from '../../../utils/roles';

export const BRANCH_CHANGE_REASON_MIN_LENGTH = 20;

export interface NormalizedBranchChangeRequest {
    reason: string;
    newBranch: string;
    newCountry: string | null;
}

export type BranchChangeValidationError =
    | 'missingBranch'
    | 'shortReason'
    | 'sameBranch';

const normalizeValue = (value: string | null | undefined) => String(value || '').trim();

export const normalizeBranchChangeRequest = (
    data: BranchChangeRequestFormData
): NormalizedBranchChangeRequest => ({
    reason: normalizeValue(data.reason),
    newBranch: normalizeValue(data.newBranch),
    newCountry: normalizeValue(data.newCountry) || null,
});

export const getBranchChangeValidationError = (
    data: NormalizedBranchChangeRequest,
    currentBranch?: string | null
): BranchChangeValidationError | null => {
    if (!data.newBranch) return 'missingBranch';
    if (data.reason.length < BRANCH_CHANGE_REASON_MIN_LENGTH) return 'shortReason';
    const normalizedCurrentBranch = normalizeValue(currentBranch).toLowerCase();
    if (normalizedCurrentBranch && normalizedCurrentBranch === data.newBranch.toLowerCase()) {
        return 'sameBranch';
    }
    return null;
};

export const shouldUseDavaoApproverRouting = (
    userRole: string | null,
    currentBranch: string | null
) => {
    const branchKey = getBranchKey(currentBranch || '');
    return (
        (isOperationsRole(userRole) && branchKey === 'manila')
        || (isBranchManagerRole(userRole) && (branchKey === 'cebu' || branchKey === 'pampanga'))
    );
};

export const buildBranchChangeRequestMessage = ({
    requesterName,
    currentBranch,
    newBranch,
}: {
    requesterName: string;
    currentBranch: string | null;
    newBranch: string;
}) => {
    const fromLabel = currentBranch || 'Current Branch';
    return `${requesterName} requested a branch change from ${fromLabel} to ${newBranch}.`;
};
