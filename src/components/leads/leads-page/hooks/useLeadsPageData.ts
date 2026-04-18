import { useEffect, useMemo, useRef, useState } from 'react';
import { ITEMS_PER_PAGE } from '../LeadsPageConstants';
import type { Lead, LeadRow, SortConfig, SortDirection, SortableKeys } from '../LeadsPageTypes';
import { mapAssessmentSubmissionToLeadRow } from '../assessmentSubmissionUtils';
import type { AssessmentSubmission, User } from '../../../../types';
import type { ApplicationInfo } from '../../../../data/applications';
import {
    filterLeads,
    getBranchOptions,
    getCounsellorOptions,
    getMonthOptions,
    getRoleScopedLeads,
    paginateLeads,
    sortLeads,
} from '../LeadsPageDataUtils';
import { useLeadStatusSync } from './useLeadStatusSync';

interface UseLeadsPageDataParams {
    assessmentSubmissions: AssessmentSubmission[];
    applications: ApplicationInfo[];
    allPersonnel: Array<{ uid?: string | null; name?: string | null; role?: string | null; branch?: string | null }>;
    role: string;
    user: User;
    leads: Lead[];
    onUpdateLead: (updatedLead: Lead) => void;
    onAddLogEntry: (studentId: string, logMessage: string) => void;
    showPopup: (message: string) => void;
    t: (key: string, options?: { [key: string]: string | number } | string) => string;
}

export const useLeadsPageData = ({
    assessmentSubmissions,
    applications,
    allPersonnel,
    role,
    user,
    leads,
    onUpdateLead,
    onAddLogEntry,
    showPopup,
    t,
}: UseLeadsPageDataParams) => {
    const getStatusMillis = (value: any) => {
        if (!value) return 0;
        if (typeof value.toMillis === 'function') return value.toMillis();
        if (value instanceof Date) return value.getTime();
        return 0;
    };

    const latestApplicationStatusByStudentId = useMemo(() => {
        const latest = new Map<string, { status: string; changedAt: number }>();
        applications.forEach((application) => {
            const studentId = String(application.studentId || '').trim();
            if (!studentId) return;

            const latestHistoryEntry = Array.isArray(application.history) ? application.history[0] : null;
            const statusValue = String(
                application.status || latestHistoryEntry?.status || '',
            ).trim();
            if (!statusValue) return;

            const changedAt = Math.max(
                getStatusMillis(application.statusChanged),
                getStatusMillis(latestHistoryEntry?.date),
            );
            const existing = latest.get(studentId);
            if (!existing || changedAt >= existing.changedAt) {
                latest.set(studentId, { status: statusValue, changedAt });
            }
        });
        return latest;
    }, [applications]);

    const mappedSubmissionLeads: LeadRow[] = useMemo(
        () =>
            assessmentSubmissions.map((submission) => {
                const mapped = mapAssessmentSubmissionToLeadRow(submission, allPersonnel);
                const latestApplication = latestApplicationStatusByStudentId.get(mapped.id);
                if (!latestApplication) return mapped;
                return {
                    ...mapped,
                    applicationStatus: latestApplication.status as LeadRow['applicationStatus'],
                };
            }),
        [allPersonnel, assessmentSubmissions, latestApplicationStatusByStudentId]
    );

    const tableLeads: LeadRow[] = useMemo(() => {
        const leadRows = leads.map((lead) => {
            const latestApplication = latestApplicationStatusByStudentId.get(lead.id);
            if (!latestApplication) return lead;
            return {
                ...lead,
                applicationStatus: latestApplication.status as LeadRow['applicationStatus'],
            };
        });

        if (!mappedSubmissionLeads.length) return leadRows;

        const seenIds = new Set(leadRows.map((lead) => lead.id));
        const uniqueSubmissionRows = mappedSubmissionLeads.filter((lead) => !seenIds.has(lead.id));
        return [...leadRows, ...uniqueSubmissionRows];
    }, [leads, latestApplicationStatusByStudentId, mappedSubmissionLeads]);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBranch, setSelectedBranch] = useState('All Branches');
    const [selectedCounsellor, setSelectedCounsellor] = useState('All Counsellors');
    const [selectedMonth, setSelectedMonth] = useState('All Months');
    const [sortConfig, setSortConfig] = useState<SortConfig>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const prevLeadsLength = useRef(tableLeads.length);
    useEffect(() => {
        if (tableLeads.length > prevLeadsLength.current) {
            setSortConfig(null);
            setCurrentPage(1);
        }
        prevLeadsLength.current = tableLeads.length;
    }, [tableLeads]);

    const counsellorOptions = useMemo(
        () => getCounsellorOptions(allPersonnel, selectedBranch),
        [allPersonnel, selectedBranch]
    );

    const roleScopedLeads = useMemo(
        () => getRoleScopedLeads(tableLeads, role, user),
        [role, tableLeads, user]
    );

    const branchOptions = useMemo(
        () => getBranchOptions(roleScopedLeads),
        [roleScopedLeads]
    );

    const monthOptions = useMemo(
        () => getMonthOptions(roleScopedLeads, selectedBranch, selectedCounsellor),
        [roleScopedLeads, selectedBranch, selectedCounsellor]
    );

    useEffect(() => {
        if (selectedBranch !== 'All Branches' && !branchOptions.includes(selectedBranch)) {
            setSelectedBranch('All Branches');
        }
    }, [branchOptions, selectedBranch]);

    useEffect(() => {
        if (selectedCounsellor !== 'All Counsellors' && !counsellorOptions.includes(selectedCounsellor)) {
            setSelectedCounsellor('All Counsellors');
        }
    }, [counsellorOptions, selectedCounsellor]);

    useEffect(() => {
        if (selectedMonth !== 'All Months' && !monthOptions.includes(selectedMonth)) {
            setSelectedMonth('All Months');
        }
    }, [monthOptions, selectedMonth]);

    const filteredLeads = useMemo(
        () => filterLeads({
            roleScopedLeads,
            searchTerm,
            selectedBranch,
            selectedCounsellor,
            selectedMonth,
            role,
        }),
        [roleScopedLeads, searchTerm, selectedBranch, selectedCounsellor, selectedMonth, role]
    );

    const sortedLeads = useMemo(
        () => sortLeads(filteredLeads, sortConfig),
        [filteredLeads, sortConfig]
    );

    const paginatedLeads = useMemo(
        () => paginateLeads(sortedLeads, currentPage, ITEMS_PER_PAGE),
        [sortedLeads, currentPage]
    );

    const { paginatedLeadsWithStatus, handleStatusChange } = useLeadStatusSync({
        paginatedLeads,
        leads,
        user,
        onAddLogEntry,
        showPopup,
        t,
    });

    const totalPages = Math.ceil(sortedLeads.length / ITEMS_PER_PAGE);

    const requestSort = (key: SortableKeys) => {
        let direction: SortDirection = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
        setCurrentPage(1);
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedBranch, selectedCounsellor, selectedMonth]);

    return {
        searchTerm,
        setSearchTerm,
        selectedBranch,
        setSelectedBranch,
        selectedCounsellor,
        setSelectedCounsellor,
        selectedMonth,
        setSelectedMonth,
        sortConfig,
        requestSort,
        currentPage,
        setCurrentPage,
        branchOptions,
        counsellorOptions,
        monthOptions,
        sortedLeads,
        paginatedLeads: paginatedLeadsWithStatus,
        totalPages,
        totalCount: sortedLeads.length,
        pageCount: paginatedLeads.length,
        handleStatusChange,
    };
};

export type LeadsPageDataResult = ReturnType<typeof useLeadsPageData>;
