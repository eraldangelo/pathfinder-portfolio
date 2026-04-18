import { useEffect, useMemo, useState } from 'react';
import type { StaffProfile } from './useLeaveRequests';
import type { LeaveRequestItem } from '../components/TimesheetLeaveRequests';
import type { OffsetRequestItem } from '../components/TimesheetOffsetTracker';

const branchOptions = ['All Philippines', 'Cebu', 'Davao', 'Makati', 'Pampanga'];
const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'pending', label: 'Pending' },
];
const philippinesBranchKeys = new Set(['makati', 'cebu', 'davao', 'pampanga']);

const normalizeBranchKey = (branch?: string | null) => {
    const normalized = (branch ?? '').trim().toLowerCase();
    if (normalized.includes('makati') || normalized.includes('manila')) return 'makati';
    if (normalized.includes('cebu')) return 'cebu';
    if (normalized.includes('davao')) return 'davao';
    if (normalized.includes('pampanga')) return 'pampanga';
    return '';
};

const getBranchKeyFromFilterValue = (value?: string) => {
    const normalized = (value ?? '').trim().toLowerCase();
    if (normalized.includes('makati') || normalized.includes('manila')) return 'makati';
    if (normalized.includes('cebu')) return 'cebu';
    if (normalized.includes('davao')) return 'davao';
    if (normalized.includes('pampanga')) return 'pampanga';
    return '';
};

interface UseAdminRequestFiltersParams {
    isAdminPhReadonly: boolean;
    staffList: StaffProfile[];
    leaveRequests: LeaveRequestItem[];
    offsetRequests: OffsetRequestItem[];
}

export const useAdminRequestFilters = ({
    isAdminPhReadonly,
    staffList,
    leaveRequests,
    offsetRequests,
}: UseAdminRequestFiltersParams) => {
    const [branchFilter, setBranchFilter] = useState(branchOptions[0]);
    const [selectedStaffId, setSelectedStaffId] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const filteredStaffList = useMemo(() => {
        if (!isAdminPhReadonly) return [];
        const selectedBranchKey = getBranchKeyFromFilterValue(branchFilter);
        if (!selectedBranchKey) return staffList;
        return staffList.filter((staff) => normalizeBranchKey(staff.branch) === selectedBranchKey);
    }, [isAdminPhReadonly, branchFilter, staffList]);

    useEffect(() => {
        if (!isAdminPhReadonly) return;
        if (selectedStaffId && !filteredStaffList.some((staff) => staff.uid === selectedStaffId)) {
            setSelectedStaffId('');
        }
    }, [filteredStaffList, isAdminPhReadonly, selectedStaffId]);

    const staffFilterOptions = useMemo(() => {
        if (!isAdminPhReadonly) return [];
        return [
            { value: '', label: 'All Staff' },
            ...filteredStaffList.map((staff) => ({
                value: staff.uid,
                label: `${staff.name ?? 'Unknown'}${staff.branch ? ` (${staff.branch})` : ''}`,
            })),
        ];
    }, [filteredStaffList, isAdminPhReadonly]);

    const selectedStaffInfo = useMemo(() => {
        const staff = staffList.find((staff) => staff.uid === selectedStaffId);
        if (!staff) return undefined;
        return {
            label: `${staff.name ?? 'Unknown'}${staff.branch ? ` (${staff.branch})` : ''}`,
            leaveBalance: staff.leaveBalance ?? null,
        };
    }, [staffList, selectedStaffId]);

    const filteredLeaveRequests = useMemo(() => {
        if (!isAdminPhReadonly) {
            return leaveRequests;
        }
        const filteredByPhilippines = leaveRequests.filter((request) =>
            philippinesBranchKeys.has(normalizeBranchKey(request.requesterBranch))
        );
        const selectedKey = getBranchKeyFromFilterValue(branchFilter);
        if (!selectedKey) {
            return filteredByPhilippines;
        }
        return filteredByPhilippines.filter((request) => normalizeBranchKey(request.requesterBranch) === selectedKey);
    }, [branchFilter, isAdminPhReadonly, leaveRequests]);

    const filteredOffsetRequests = useMemo(() => {
        if (!isAdminPhReadonly) {
            return offsetRequests;
        }
        const filteredByPhilippines = offsetRequests.filter((request) =>
            philippinesBranchKeys.has(normalizeBranchKey(request.requesterBranch))
        );
        const selectedKey = getBranchKeyFromFilterValue(branchFilter);
        if (!selectedKey) {
            return filteredByPhilippines;
        }
        return filteredByPhilippines.filter((request) => normalizeBranchKey(request.requesterBranch) === selectedKey);
    }, [branchFilter, isAdminPhReadonly, offsetRequests]);

    const finalLeaveRequests = useMemo(() => {
        let current = filteredLeaveRequests;
        if (statusFilter) {
            current = current.filter((request) => request.status === statusFilter);
        }
        if (!isAdminPhReadonly || !selectedStaffId) {
            return current;
        }
        return current.filter((request) => request.ownerId === selectedStaffId);
    }, [filteredLeaveRequests, statusFilter, isAdminPhReadonly, selectedStaffId]);

    const finalOffsetRequests = useMemo(() => {
        let current = filteredOffsetRequests;
        if (statusFilter) {
            current = current.filter((request) => request.status === statusFilter);
        }
        if (!isAdminPhReadonly || !selectedStaffId) {
            return current;
        }
        return current.filter((request) => request.ownerId === selectedStaffId);
    }, [filteredOffsetRequests, statusFilter, isAdminPhReadonly, selectedStaffId]);

    return {
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
    };
};
