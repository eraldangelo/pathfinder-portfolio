import { isBranchManagerRole, isDeveloperRole, isOperationsRole } from '../../../utils/roles';
import type { User } from '../../../types';
import type { LeaveRequestItem } from '../components/TimesheetLeaveRequests';

const normalizeValue = (value?: string | null) => (value ?? '').trim().toLowerCase();

export const getBranchKey = (branch?: string | null) => {
    const normalized = normalizeValue(branch);
    return normalized.includes('manila')
        ? 'manila'
        : normalized.includes('makati')
        ? 'makati'
        : normalized.includes('davao')
        ? 'davao'
        : normalized.includes('cebu')
        ? 'cebu'
        : normalized.includes('pampanga')
        ? 'pampanga'
        : '';
};

const isRequesterManilaLike = (branch?: string | null) => {
    const key = getBranchKey(branch);
    return key === 'manila' || key === 'makati';
};

const isRequesterOperationsManila = (role?: string | null, branch?: string | null) =>
    normalizeValue(role) === 'operations' && isRequesterManilaLike(branch);

const isRequesterBranchManagerCebu = (role?: string | null, branch?: string | null) =>
    normalizeValue(role) === 'branch manager' && getBranchKey(branch) === 'cebu';

const isRequesterBranchManagerPampanga = (role?: string | null, branch?: string | null) =>
    normalizeValue(role) === 'branch manager' && getBranchKey(branch) === 'pampanga';

const isRequesterDavao = (branch?: string | null) => getBranchKey(branch) === 'davao';
const isRequesterManila = (branch?: string | null) => isRequesterManilaLike(branch);
const isRequesterCebu = (branch?: string | null) => getBranchKey(branch) === 'cebu';
const isRequesterPampanga = (branch?: string | null) => getBranchKey(branch) === 'pampanga';

export const getLeaveRequestAccess = (user: User, userRole: string, isAdminPhReadonly: boolean) => {
    const isDeveloper = isDeveloperRole(userRole);
    const currentBranchKey = getBranchKey(user?.branch);
    const isOperationsDavao = isOperationsRole(userRole) && currentBranchKey === 'davao';
    const canApproveRequests =
        (isDeveloper || isOperationsRole(userRole) || isBranchManagerRole(userRole)) && !isAdminPhReadonly;
    const canViewAllLeaveRequests = isDeveloper || isAdminPhReadonly;

    return {
        isDeveloper,
        currentBranchKey,
        isOperationsDavao,
        canApproveRequests,
        canViewAllLeaveRequests,
    };
};

export const isOpsDavaoAllowedRequest = (request: LeaveRequestItem) =>
    isRequesterDavao(request.requesterBranch) ||
    isRequesterOperationsManila(request.requesterRole, request.requesterBranch) ||
    isRequesterBranchManagerCebu(request.requesterRole, request.requesterBranch) ||
    isRequesterBranchManagerPampanga(request.requesterRole, request.requesterBranch);

export const canApproveLeaveRequest = (
    request: LeaveRequestItem,
    userRole: string,
    access: {
        isDeveloper: boolean;
        isOperationsDavao: boolean;
        canApproveRequests: boolean;
        currentBranchKey: string;
    }
) => {
    if (!access.canApproveRequests) return false;
    if (access.isDeveloper) return true;
    if (access.isOperationsDavao) return isOpsDavaoAllowedRequest(request);
    if (isOperationsRole(userRole) && access.currentBranchKey === 'manila') {
        return isRequesterManila(request.requesterBranch);
    }
    if (isBranchManagerRole(userRole) && access.currentBranchKey === 'cebu') {
        return isRequesterCebu(request.requesterBranch);
    }
    if (isBranchManagerRole(userRole) && access.currentBranchKey === 'pampanga') {
        return isRequesterPampanga(request.requesterBranch);
    }
    if (access.currentBranchKey) {
        return getBranchKey(request.requesterBranch) === access.currentBranchKey;
    }
    return false;
};

export const filterVisibleLeaveRequests = (
    leaveRequests: LeaveRequestItem[],
    userRole: string,
    access: {
        canApproveRequests: boolean;
        canViewAllLeaveRequests: boolean;
        isOperationsDavao: boolean;
        currentBranchKey: string;
    },
    userBranch?: string | null
) => {
    if (access.canViewAllLeaveRequests) {
        return leaveRequests;
    }
    if (access.isOperationsDavao) {
        return leaveRequests.filter(isOpsDavaoAllowedRequest);
    }
    if (isOperationsRole(userRole) && access.currentBranchKey === 'manila') {
        return leaveRequests.filter((request) => isRequesterManila(request.requesterBranch));
    }
    if (isBranchManagerRole(userRole) && access.currentBranchKey === 'cebu') {
        return leaveRequests.filter((request) => isRequesterCebu(request.requesterBranch));
    }
    if (isBranchManagerRole(userRole) && access.currentBranchKey === 'pampanga') {
        return leaveRequests.filter((request) => isRequesterPampanga(request.requesterBranch));
    }
    if (!access.canApproveRequests) {
        return leaveRequests;
    }
    if (!userBranch) {
        return leaveRequests;
    }
    return leaveRequests.filter((request) => request.requesterBranch === userBranch);
};
