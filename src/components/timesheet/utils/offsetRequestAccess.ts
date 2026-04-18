import { isBranchManagerRole, isDeveloperRole, isOperationsRole } from '../../../utils/roles';
import type { User } from '../../../types';
import type { OffsetRequestItem } from '../components/TimesheetOffsetTracker';

const normalizeValue = (value?: string | null) => (value ?? '').trim().toLowerCase();

export const getOffsetBranchKey = (branch?: string | null) => {
    const normalized = normalizeValue(branch);
    return normalized.includes('manila')
        ? 'manila'
        : normalized.includes('davao')
          ? 'davao'
          : normalized.includes('cebu')
            ? 'cebu'
            : normalized.includes('pampanga')
              ? 'pampanga'
              : '';
};

const isRequesterOperationsManila = (role?: string | null, branch?: string | null) =>
    normalizeValue(role) === 'operations' && getOffsetBranchKey(branch) === 'manila';

const isRequesterBranchManagerCebu = (role?: string | null, branch?: string | null) =>
    normalizeValue(role) === 'branch manager' && getOffsetBranchKey(branch) === 'cebu';

const isRequesterBranchManagerPampanga = (role?: string | null, branch?: string | null) =>
    normalizeValue(role) === 'branch manager' && getOffsetBranchKey(branch) === 'pampanga';

const isRequesterDavao = (branch?: string | null) => getOffsetBranchKey(branch) === 'davao';
const isRequesterManila = (branch?: string | null) => getOffsetBranchKey(branch) === 'manila';
const isRequesterCebu = (branch?: string | null) => getOffsetBranchKey(branch) === 'cebu';
const isRequesterPampanga = (branch?: string | null) => getOffsetBranchKey(branch) === 'pampanga';

export const getOffsetRequestAccess = (user: User, userRole: string, isAdminPhReadonly: boolean) => {
    const isDeveloper = isDeveloperRole(userRole);
    const currentBranchKey = getOffsetBranchKey(user?.branch);
    const isOperationsDavao = isOperationsRole(userRole) && currentBranchKey === 'davao';
    const canReviewOffsetRequests =
        (isDeveloper || isOperationsRole(userRole) || isBranchManagerRole(userRole)) && !isAdminPhReadonly;
    const canViewAllOffsetRequests = isDeveloper || isAdminPhReadonly;

    return {
        isDeveloper,
        currentBranchKey,
        isOperationsDavao,
        canReviewOffsetRequests,
        canViewAllOffsetRequests,
    };
};

export const isOpsDavaoAllowedOffsetRequest = (request: OffsetRequestItem) =>
    isRequesterDavao(request.requesterBranch) ||
    isRequesterOperationsManila(request.requesterRole, request.requesterBranch) ||
    isRequesterBranchManagerCebu(request.requesterRole, request.requesterBranch) ||
    isRequesterBranchManagerPampanga(request.requesterRole, request.requesterBranch);

export const filterVisibleOffsetRequests = (
    offsetRequests: OffsetRequestItem[],
    userRole: string,
    access: {
        canReviewOffsetRequests: boolean;
        canViewAllOffsetRequests: boolean;
        isOperationsDavao: boolean;
        currentBranchKey: string;
    },
    userBranch?: string | null
) => {
    if (access.canViewAllOffsetRequests) {
        return offsetRequests;
    }
    if (access.isOperationsDavao) {
        return offsetRequests.filter(isOpsDavaoAllowedOffsetRequest);
    }
    if (isOperationsRole(userRole) && access.currentBranchKey === 'manila') {
        return offsetRequests.filter((request) => isRequesterManila(request.requesterBranch));
    }
    if (isBranchManagerRole(userRole) && access.currentBranchKey === 'cebu') {
        return offsetRequests.filter((request) => isRequesterCebu(request.requesterBranch));
    }
    if (isBranchManagerRole(userRole) && access.currentBranchKey === 'pampanga') {
        return offsetRequests.filter((request) => isRequesterPampanga(request.requesterBranch));
    }
    if (!access.canReviewOffsetRequests) {
        return offsetRequests;
    }
    if (!userBranch) {
        return offsetRequests;
    }
    return offsetRequests.filter((request) => request.requesterBranch === userBranch);
};
