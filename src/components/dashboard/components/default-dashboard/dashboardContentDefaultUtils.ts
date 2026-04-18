import type { ApplicationInfo } from '../../../../data/applications';
import type { PersonnelWithDetails } from '../../../../data/personnel';
import type { AssessmentSubmission } from '../../../../types';
import type { Lead } from '../../../leads/leads-page/LeadsPage';
import {
    DEFAULT_FUNNEL_LOCATION,
    Pathfinder_OVERALL,
    locationMatchesBranch,
    matchesMonthYearFilter,
} from '../../utils/funnelFilters';

export const STAFF_FILTER_ALL = 'all';
const normalizeKey = (value?: string | null) => String(value ?? '').trim().toLowerCase();
const buildStaffFilterUidValue = (uid: string) => `uid:${uid}`;
const buildStaffFilterNameValue = (nameKey: string) => `name:${nameKey}`;

export const buildFunnelStaffOptions = (
    allPersonnel: PersonnelWithDetails[],
    effectiveFunnelLocation: string,
) => {
    const eligible = allPersonnel
        .filter((person) => {
            const roleKey = normalizeKey(person.role);
            const isEligibleRole = roleKey === 'branch manager' || roleKey === 'education consultant';
            if (!isEligibleRole) return false;
            return locationMatchesBranch(effectiveFunnelLocation, person.branch);
        })
        .sort((a, b) => String(a.name ?? '').localeCompare(String(b.name ?? ''), undefined, { sensitivity: 'base' }));

    const options: Array<{ value: string; label: string }> = [{ value: STAFF_FILTER_ALL, label: 'All Staffs' }];
    const seenValues = new Set<string>([STAFF_FILTER_ALL]);

    eligible.forEach((person) => {
        const uidKey = normalizeKey(person.uid);
        const nameKey = normalizeKey(person.name);
        if (!uidKey && !nameKey) return;

        const value = uidKey ? buildStaffFilterUidValue(uidKey) : buildStaffFilterNameValue(nameKey);
        if (seenValues.has(value)) return;
        seenValues.add(value);

        const label = String(person.name ?? '').trim() || String(person.email ?? '').trim() || value;
        options.push({ value, label });
    });

    return options;
};

export const buildFunnelStaffIdentityByValue = (
    allPersonnel: PersonnelWithDetails[],
    effectiveFunnelLocation: string,
) => {
    const lookup = new Map<string, { uidKey: string; nameKey: string }>();
    lookup.set(STAFF_FILTER_ALL, { uidKey: '', nameKey: '' });

    allPersonnel
        .filter((person) => {
            const roleKey = normalizeKey(person.role);
            const isEligibleRole = roleKey === 'branch manager' || roleKey === 'education consultant';
            if (!isEligibleRole) return false;
            return locationMatchesBranch(effectiveFunnelLocation, person.branch);
        })
        .forEach((person) => {
            const uidKey = normalizeKey(person.uid);
            const nameKey = normalizeKey(person.name);
            if (!uidKey && !nameKey) return;

            const primaryValue = uidKey ? buildStaffFilterUidValue(uidKey) : buildStaffFilterNameValue(nameKey);
            lookup.set(primaryValue, { uidKey, nameKey });

            if (nameKey) {
                const secondaryValue = buildStaffFilterNameValue(nameKey);
                if (!lookup.has(secondaryValue)) {
                    lookup.set(secondaryValue, { uidKey, nameKey });
                }
            }
        });

    return lookup;
};

export const matchesSelectedStaff = ({
    effectiveFunnelStaffRole,
    funnelStaffIdentityByValue,
    assignedUid,
    assignedName,
}: {
    effectiveFunnelStaffRole: string;
    funnelStaffIdentityByValue: Map<string, { uidKey: string; nameKey: string }>;
    assignedUid?: string | null;
    assignedName?: string | null;
}) => {
    if (effectiveFunnelStaffRole === STAFF_FILTER_ALL) return true;

    const selectedIdentity = funnelStaffIdentityByValue.get(effectiveFunnelStaffRole);
    if (!selectedIdentity) return true;

    const normalizedAssignedUid = normalizeKey(assignedUid);
    const normalizedAssignedName = normalizeKey(assignedName);

    if (selectedIdentity.uidKey) {
        if (normalizedAssignedUid && normalizedAssignedUid === selectedIdentity.uidKey) return true;
    }
    if (selectedIdentity.nameKey) {
        if (normalizedAssignedName && normalizedAssignedName === selectedIdentity.nameKey) return true;
    }

    return false;
};

export const buildAssignedStaffByLeadId = (
    leads: Lead[],
    assessmentSubmissions: AssessmentSubmission[],
) => {
    const staffByLeadId = new Map<string, { assignedUid: string; assignedName: string }>();
    leads.forEach((lead) => {
        const leadId = String(lead.id ?? '').trim();
        if (!leadId) return;
        const assignedUid = String(lead.assignedCounsellorUid ?? '').trim();
        const assignedName = String(lead.assignedCounsellor ?? '').trim();
        if (!assignedUid && !assignedName) return;
        staffByLeadId.set(leadId, { assignedUid, assignedName });
    });
    assessmentSubmissions.forEach((submission) => {
        const leadId = String(submission.id ?? '').trim();
        if (!leadId) return;
        const assignedUid = String(submission.assignedCounsellorUid ?? '').trim();
        const assignedName = String(submission.assignedCounsellor ?? '').trim();
        if (!assignedUid && !assignedName) return;
        staffByLeadId.set(leadId, { assignedUid, assignedName });
    });
    return staffByLeadId;
};

export const buildStaffRoleScopedData = ({
    effectiveFunnelStaffRole,
    branchFilteredApplications,
    branchFilteredAssessmentSubmissions,
    assignedStaffByLeadId,
    funnelStaffIdentityByValue,
}: {
    effectiveFunnelStaffRole: string;
    branchFilteredApplications: ApplicationInfo[];
    branchFilteredAssessmentSubmissions: AssessmentSubmission[];
    assignedStaffByLeadId: Map<string, { assignedUid: string; assignedName: string }>;
    funnelStaffIdentityByValue: Map<string, { uidKey: string; nameKey: string }>;
}) => {
    if (effectiveFunnelStaffRole === STAFF_FILTER_ALL) {
        return {
            staffRoleFilteredApplications: branchFilteredApplications,
            staffRoleFilteredAssessmentSubmissions: branchFilteredAssessmentSubmissions,
        };
    }

    const staffRoleFilteredApplications = branchFilteredApplications.filter((application) => {
        const appAssignedUid = String(
            (application as unknown as { assignedCounsellorUid?: string | null }).assignedCounsellorUid ?? '',
        ).trim();
        const appAssignedName = String(
            (application as unknown as { assignedCounsellor?: string | null }).assignedCounsellor ?? '',
        ).trim();
        const fallbackStaff = assignedStaffByLeadId.get(String(application.studentId ?? '').trim());
        return matchesSelectedStaff({
            effectiveFunnelStaffRole,
            funnelStaffIdentityByValue,
            assignedUid: appAssignedUid || fallbackStaff?.assignedUid || '',
            assignedName: appAssignedName || fallbackStaff?.assignedName || '',
        });
    });

    const staffRoleFilteredAssessmentSubmissions = branchFilteredAssessmentSubmissions.filter((submission) =>
        matchesSelectedStaff({
            effectiveFunnelStaffRole,
            funnelStaffIdentityByValue,
            assignedUid: submission.assignedCounsellorUid,
            assignedName: submission.assignedCounsellor,
        }),
    );

    return {
        staffRoleFilteredApplications,
        staffRoleFilteredAssessmentSubmissions,
    };
};

export const buildStaffRoleAndDateFilteredLeads = ({
    branchFilteredLeads,
    effectiveFunnelStaffRole,
    funnelStaffIdentityByValue,
    selectedFunnelMonth,
    selectedFunnelYear,
    selectedQuarter,
}: {
    branchFilteredLeads: Lead[];
    effectiveFunnelStaffRole: string;
    funnelStaffIdentityByValue: Map<string, { uidKey: string; nameKey: string }>;
    selectedFunnelMonth: string;
    selectedFunnelYear: string;
    selectedQuarter: string;
}) =>
    branchFilteredLeads.filter((lead) =>
        matchesSelectedStaff({
            effectiveFunnelStaffRole,
            funnelStaffIdentityByValue,
            assignedUid: lead.assignedCounsellorUid,
            assignedName: lead.assignedCounsellor,
        })
        && matchesMonthYearFilter(
            lead.submittedAt ?? null,
            selectedFunnelMonth,
            selectedFunnelYear,
            selectedQuarter
        )
    );

type FunnelDataBucket = {
    totalLeads: string;
    genuineStudents: string;
    applications: string;
    offers: string;
    coe: string;
    lodged: string;
    granted: string;
    refused: string;
};

export const resolveActiveFunnelData = (
    filteredFunnelDataByLocation: Record<string, FunnelDataBucket>,
    effectiveFunnelLocation: string,
): FunnelDataBucket =>
    filteredFunnelDataByLocation[effectiveFunnelLocation]
    ?? filteredFunnelDataByLocation[DEFAULT_FUNNEL_LOCATION]
    ?? filteredFunnelDataByLocation[Pathfinder_OVERALL]
    ?? {
        totalLeads: '0',
        genuineStudents: '0',
        applications: '0',
        offers: '0',
        coe: '0',
        lodged: '0',
        granted: '0',
        refused: '0',
    };
