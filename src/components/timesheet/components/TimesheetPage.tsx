import React, { useEffect, useState } from 'react';
import type { DailyLog } from '../../../data/timesheet';
import TimeLogDetailModal from './TimeLogDetailModal';
import type { TimesheetPageProps } from '../types/TimesheetPageTypes';
import { TimesheetPageControls } from './TimesheetPageControls';
import { TimesheetPageHeader } from './TimesheetPageHeader';
import { TimesheetPageStats } from './TimesheetPageStats';
import { TimesheetPageTable } from './TimesheetPageTable';
import { TimesheetMyTeam } from './TimesheetMyTeam';
import TimesheetDownloadTab from './TimesheetDownloadTab';
import { applyLeaveDecision } from '../../../utils/leaveApproval';
import { applyOffsetDecision } from '../../../utils/offsetApproval';
import { TimesheetLeaveRequests, type LeaveRequestItem } from './TimesheetLeaveRequests';
import { TimesheetOffsetTracker, type OffsetRequestItem } from './TimesheetOffsetTracker';
import { useLeaveRequests } from '../hooks/useLeaveRequests';
import { useOffsetRequests } from '../hooks/useOffsetRequests';
import { useTimesheetLogs } from '../hooks/useTimesheetLogs';
import { useMyTeamTimesheet } from '../hooks/useMyTeamTimesheet';
import { useApprovedLeaveAutoPlot } from '../hooks/useApprovedLeaveAutoPlot';
import { useAdminRequestFilters } from '../hooks/useAdminRequestFilters';
import { useTimesheetPeriod } from '../hooks/useTimesheetPeriod';
import { usePeriodFilteredLogs } from '../hooks/usePeriodFilteredLogs';
import { useTimesheetTotals } from '../hooks/useTimesheetTotals';
import { useTeamScope } from '../hooks/useTeamScope';

// Make jsPDF available from the window object loaded via CDN
declare var jspdf: any;

export type { TimesheetPageProps } from '../types/TimesheetPageTypes';

const TimesheetPage: React.FC<TimesheetPageProps> = ({ isReady, user, userRole, onOpenRequestLeaveModal, onOpenRequestOffsetModal, onOpenRequestUseOffsetModal }) => {
    const { currentDate, setCurrentDate, period, setPeriod } = useTimesheetPeriod();
    const [selectedLogForDetail, setSelectedLogForDetail] = useState<DailyLog | null>(null);
    const [activeTab, setActiveTab] = useState('my-timesheet');
    const isAdminPhReadonly = (user?.email || '').toLowerCase() === 'admin_ph@example.com';
    const { logs, updateRemarks } = useTimesheetLogs({
        currentDate,
        userUid: user?.uid,
    });
    useApprovedLeaveAutoPlot(user?.uid);
    const {
        visibleLeaveRequests,
        isLeaveRequestsLoading,
        canApproveRequests,
        canApproveRequest,
        canViewAllLeaveRequests,
        staffList,
    } = useLeaveRequests({ user, userRole });
    const {
        visibleOffsetRequests,
        isOffsetRequestsLoading,
        canReviewOffsetRequests,
        canApproveOffsetRequests,
        canViewAllOffsetRequests,
    } = useOffsetRequests({ user, userRole });
    const { teamScope, showMyTeamTab } = useTeamScope(user, userRole);
    const { rows: teamRows, isLoading: isTeamLoading } = useMyTeamTimesheet(showMyTeamTab, teamScope);
    useEffect(() => {
        if (!showMyTeamTab && activeTab === 'my-team') {
            setActiveTab('my-timesheet');
        }
    }, [activeTab, showMyTeamTab]);
    useEffect(() => {
        if (!isAdminPhReadonly && activeTab === 'timesheet-download') {
            setActiveTab('my-timesheet');
        }
    }, [activeTab, isAdminPhReadonly]);
    const {
        branchOptions,
        branchFilter,
        setBranchFilter,
        statusOptions,
        statusFilter,
        setStatusFilter,
        staffFilterOptions,
        selectedStaffId,
        setSelectedStaffId,
        selectedStaffInfo,
        finalLeaveRequests,
        finalOffsetRequests,
    } = useAdminRequestFilters({
        isAdminPhReadonly,
        staffList,
        leaveRequests: visibleLeaveRequests,
        offsetRequests: visibleOffsetRequests,
    });

    const displayedLogs = usePeriodFilteredLogs(logs, period);
    const { totalWorkHours, totalOffsetHours, availableOffsetMinutes } = useTimesheetTotals(displayedLogs, user?.offsetBalance);

    const handleLeaveDecisionChange = async (request: LeaveRequestItem, decision: 'yes' | 'no') => {
        if (!canApproveRequests) return;
        if (!canApproveRequest(request)) return;
        if (!request?.id || !request?.ownerId) return;

        try {
            await applyLeaveDecision({
                requestOwnerId: request.ownerId,
                requestId: request.id,
                decision,
                requestDate: request.date ?? null,
                requestFromDate: request.fromDate ?? null,
                requestToDate: request.toDate ?? null,
                requestDayCount: typeof request.dayCount === 'number' ? request.dayCount : null,
                approverId: user.uid,
                approverName: user.displayName ?? user.email ?? null,
                approverRole: userRole ?? null,
            });
        } catch (err) {
            console.error('Failed to update leave request status:', err);
        }
    };


    const handleOffsetDecisionChange = async (request: OffsetRequestItem, decision: 'yes' | 'no') => {
        if (!canApproveOffsetRequests) return;
        if (!request?.id || !request?.ownerId) return;

        try {
            await applyOffsetDecision({
                requestOwnerId: request.ownerId,
                requestId: request.id,
                decision,
                requestDate: request.date ?? null,
                requestHours: typeof request.hours === 'number' ? request.hours : null,
                requestStartTime: request.startTime ?? null,
                requestEndTime: request.endTime ?? null,
                approverId: user.uid,
                approverName: user.displayName ?? user.email ?? null,
                approverRole: userRole ?? null,
            });
        } catch (err) {
            console.error('Failed to update offset request status:', err);
        }
    };

    return (
        <div className="relative w-full h-full max-w-[1920px] mx-auto">
            <div className="w-full h-full px-4 pt-24 lg:px-8 pb-16 flex flex-col text-sm text-gray-700 dark:text-gray-300">
                <TimesheetPageHeader
                    isReady={isReady}
                    userDisplayName={user.displayName || ''}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    showMyTeamTab={showMyTeamTab}
                    showTimesheetDownloadTab={isAdminPhReadonly}
                />

                {activeTab === 'my-timesheet' ? (
                    <>
                        <TimesheetPageControls
                            currentDate={currentDate}
                            period={period}
                            onMonthChange={setCurrentDate}
                            onPeriodChange={setPeriod}
                        />

                        <TimesheetPageStats
                            totalWorkHours={totalWorkHours}
                            offsetHours={totalOffsetHours}
                            availableOffsetMinutes={availableOffsetMinutes}
                            userBranch={user.branch || undefined}
                            leaveBalance={user.leaveBalance ?? 0}
                            leaveUsed={user.leaveUsed ?? 0}
                            onOpenRequestLeaveModal={onOpenRequestLeaveModal}
                            onOpenRequestUseOffsetModal={onOpenRequestUseOffsetModal}
                        />

                        <TimesheetPageTable
                            logs={displayedLogs}
                            onSelectLog={setSelectedLogForDetail}
                            onRemarksChange={updateRemarks}
                        />
                    </>
                ) : activeTab === 'my-team' ? (
                    <TimesheetMyTeam rows={teamRows} isLoading={isTeamLoading} />
                ) : activeTab === 'leave-requests' ? (
                    <TimesheetLeaveRequests
                        requests={finalLeaveRequests}
                        isLoading={isLeaveRequestsLoading}
                        canApprove={canApproveRequests}
                        showRequester={canApproveRequests || canViewAllLeaveRequests}
                        showBranchFilter={isAdminPhReadonly}
                        branchFilterValue={branchFilter}
                        branchFilterOptions={branchOptions}
                        onBranchFilterChange={setBranchFilter}
                        showStaffFilter={isAdminPhReadonly}
                        staffFilterValue={selectedStaffId}
                        staffFilterOptions={staffFilterOptions}
                        onStaffFilterChange={setSelectedStaffId}
                        showStatusFilter={isAdminPhReadonly}
                        statusFilterValue={statusFilter}
                        statusFilterOptions={statusOptions}
                        onStatusFilterChange={setStatusFilter}
                        selectedStaffInfo={selectedStaffInfo}
                        canApproveRequest={canApproveRequest}
                        onDecisionChange={handleLeaveDecisionChange}
                    />
                ) : activeTab === 'timesheet-download' ? (
                    <TimesheetDownloadTab user={user} />
                ) : (
                    <TimesheetOffsetTracker
                        requests={finalOffsetRequests}
                        isLoading={isOffsetRequestsLoading}
                        showRequester={canReviewOffsetRequests || canViewAllOffsetRequests}
                        canApprove={canApproveOffsetRequests}
                        showBranchFilter={isAdminPhReadonly}
                        branchFilterValue={branchFilter}
                        branchFilterOptions={branchOptions}
                        onBranchFilterChange={setBranchFilter}
                        showStaffFilter={isAdminPhReadonly}
                        staffFilterValue={selectedStaffId}
                        staffFilterOptions={staffFilterOptions}
                        onStaffFilterChange={setSelectedStaffId}
                        showStatusFilter={isAdminPhReadonly}
                        statusFilterValue={statusFilter}
                        statusFilterOptions={statusOptions}
                        onStatusFilterChange={setStatusFilter}
                        onDecisionChange={handleOffsetDecisionChange}
                        onOpenRequestOffsetModal={onOpenRequestOffsetModal}
                    />
                )}
            </div>
            {activeTab === 'my-timesheet' && (
                <TimeLogDetailModal log={selectedLogForDetail} onClose={() => setSelectedLogForDetail(null)} />
            )}
             <style>{`.animate-fade-in-fast { animation: fade-in-fast 0.2s ease-out forwards; } @keyframes fade-in-fast { from { opacity: 0; } to { opacity: 1; } }`}</style>
        </div>
    );
};

export default TimesheetPage;
