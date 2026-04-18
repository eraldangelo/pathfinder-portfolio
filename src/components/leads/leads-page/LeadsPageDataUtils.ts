import { isAdminLikeRole, isBranchManagerRole, isConsultantLikeRole, isDeveloperRole } from '../../../utils/roles';
import type { LeadRow, SortConfig } from './LeadsPageTypes';
import type { User } from '../../../types';
import { matchesSearchTerm } from '../../../utils/searchMatcher';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const normalizeValue = (value?: string | null) => (value ?? '').trim().toLowerCase();

const isLeadAssignedToUser = (lead: LeadRow, user: User) => {
    const assignedUid = (lead.assignedCounsellorUid || '').trim();
    if (assignedUid) {
        return Boolean(user.uid) && user.uid === assignedUid;
    }
    const assignedName = normalizeValue(lead.assignedCounsellor);
    const userName = normalizeValue(user.displayName);
    return Boolean(assignedName && userName && assignedName === userName);
};

export const getCounsellorOptions = (
    allPersonnel: Array<{ name?: string | null; role?: string | null; branch?: string | null }>,
    selectedBranch: string
) => {
    const normalizeRole = (roleValue?: string | null) => (roleValue ?? '').trim().toLowerCase();
    const excludedRoles = new Set([
        'operations',
        'administrative staff',
        'satellite office staff',
        'marketing staff',
        'marketing',
    ]);

    const counsellors = allPersonnel
        .filter((person) => {
            if (isDeveloperRole(person.role)) return false;
            const roleKey = normalizeRole(person.role);
            if (excludedRoles.has(roleKey)) return false;
            if (selectedBranch !== 'All Branches') {
                return (person.branch || '').trim() === selectedBranch;
            }
            return true;
        })
        .map((person) => person.name)
        .filter(Boolean) as string[];

    return ['All Counsellors', ...Array.from(new Set(counsellors)).sort()];
};

export const getRoleScopedLeads = (tableLeads: LeadRow[], role: string, user: User) => {
    if (isBranchManagerRole(role) && user.branch) {
        const userBranchKey = normalizeValue(user.branch);
        return tableLeads.filter((lead) => normalizeValue(lead.branch) === userBranchKey);
    }
    if (isConsultantLikeRole(role)) {
        return tableLeads.filter((lead) => isLeadAssignedToUser(lead, user));
    }
    if (isAdminLikeRole(role) && user.branch) {
        const userBranchKey = normalizeValue(user.branch);
        return tableLeads.filter((lead) => normalizeValue(lead.branch) === userBranchKey);
    }
    return tableLeads;
};

export const getBranchOptions = (roleScopedLeads: LeadRow[]) => {
    const branches = roleScopedLeads
        .map((lead) => (lead.branch || '').trim())
        .filter(Boolean);
    return ['All Branches', ...Array.from(new Set(branches)).sort((a, b) => a.localeCompare(b))];
};

export const getMonthOptions = (
    roleScopedLeads: LeadRow[],
    selectedBranch: string,
    selectedCounsellor: string
) => {
    const base = roleScopedLeads.filter((lead) => {
        const branchMatch = selectedBranch === 'All Branches' || lead.branch === selectedBranch;
        const counsellorMatch = selectedCounsellor === 'All Counsellors' || lead.assignedCounsellor === selectedCounsellor;
        return branchMatch && counsellorMatch;
    });

    const months = base
        .map((lead) => lead.submittedAt)
        .filter((d): d is Date => d instanceof Date)
        .map((d) => d.getMonth());

    const unique = Array.from(new Set(months)).sort((a, b) => a - b);
    return ['All Months', ...unique.map((idx) => MONTH_NAMES[idx])];
};

export const filterLeads = ({
    roleScopedLeads,
    searchTerm,
    selectedBranch,
    selectedCounsellor,
    selectedMonth,
    role,
}: {
    roleScopedLeads: LeadRow[];
    searchTerm: string;
    selectedBranch: string;
    selectedCounsellor: string;
    selectedMonth: string;
    role: string;
}) => {
    return roleScopedLeads.filter((lead) => {
        const searchMatch = matchesSearchTerm({
            searchTerm,
            textCandidates: [
                lead.fullName,
                lead.firstName,
                lead.middleName,
                lead.lastName,
                lead.caseId,
                lead.email,
                lead.assignedCounsellor,
            ],
            numericCandidates: [
                lead.phoneCountryCode,
                lead.phoneNumber,
                `${lead.phoneCountryCode}${lead.phoneNumber}`,
                `${lead.phoneCountryCode} ${lead.phoneNumber}`,
            ],
        });

        const branchMatch = isAdminLikeRole(role)
            ? true
            : (selectedBranch === 'All Branches' || lead.branch === selectedBranch);

        const counsellorMatch = selectedCounsellor === 'All Counsellors' || lead.assignedCounsellor === selectedCounsellor;

        const monthMatch = selectedMonth === 'All Months'
            || (lead.submittedAt instanceof Date && MONTH_NAMES[lead.submittedAt.getMonth()] === selectedMonth);

        return searchMatch && branchMatch && counsellorMatch && monthMatch;
    });
};

export const sortLeads = (filteredLeads: LeadRow[], sortConfig: SortConfig) => {
    const sortableItems = [...filteredLeads];
    const submittedAtMillis = (lead: LeadRow) =>
        lead.submittedAt instanceof Date ? lead.submittedAt.getTime() : 0;

    if (sortConfig !== null) {
        sortableItems.sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (a[sortConfig.key] > b[sortConfig.key]) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return submittedAtMillis(b) - submittedAtMillis(a);
        });
        return sortableItems;
    }

    // Default ordering for leads table: newest submitted date first.
    sortableItems.sort((a, b) => submittedAtMillis(b) - submittedAtMillis(a));
    return sortableItems;
};

export const paginateLeads = (sortedLeads: LeadRow[], currentPage: number, itemsPerPage: number) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedLeads.slice(startIndex, startIndex + itemsPerPage);
};
