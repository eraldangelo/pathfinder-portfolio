import { useMemo } from 'react';
import type { User } from '../../../types';
import type { LeaveRequestItem } from '../components/TimesheetLeaveRequests';
import { useAdminStaffList } from './useAdminStaffList';
import { useLeaveRequestSubscription } from './useLeaveRequestSubscription';
import { canApproveLeaveRequest, filterVisibleLeaveRequests, getLeaveRequestAccess } from '../utils/leaveRequestAccess';

interface UseLeaveRequestsParams {
    user: User;
    userRole: string;
}

export type { StaffProfile } from '../types/leaveRequestTypes';

export const useLeaveRequests = ({ user, userRole }: UseLeaveRequestsParams) => {
    const isAdminPhReadonly = (user?.email || '').toLowerCase() === 'admin_ph@example.com';
    const access = useMemo(
        () => getLeaveRequestAccess(user, userRole, isAdminPhReadonly),
        [isAdminPhReadonly, user, userRole]
    );

    const staffList = useAdminStaffList(isAdminPhReadonly);
    const { leaveRequests, isLeaveRequestsLoading } = useLeaveRequestSubscription({
        user,
        canApproveRequests: access.canApproveRequests,
        canViewAllLeaveRequests: access.canViewAllLeaveRequests,
        isOperationsDavao: access.isOperationsDavao,
    });

    const canApproveRequest = useMemo(
        () => (request: LeaveRequestItem) => canApproveLeaveRequest(request, userRole, access),
        [access, userRole]
    );

    const visibleLeaveRequests = useMemo(
        () =>
            filterVisibleLeaveRequests(
                leaveRequests,
                userRole,
                access,
                user?.branch
            ),
        [leaveRequests, userRole, access, user?.branch]
    );

    return {
        visibleLeaveRequests,
        isLeaveRequestsLoading,
        canApproveRequests: access.canApproveRequests,
        canApproveRequest,
        canViewAllLeaveRequests: access.canViewAllLeaveRequests,
        isOperationsDavao: access.isOperationsDavao,
        staffList,
    };
};
