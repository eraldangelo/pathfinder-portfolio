import { useEffect, useMemo } from 'react';
import type { DashboardContentProps } from '../../types/DashboardContentTypes';
import { buildManagerFunnelData } from '../../hooks/metrics/funnelMetrics';
import { buildLeadsByBranchData, buildTopLeadSourcesData } from '../../hooks/metrics/leadMetrics';
import { buildTopDestinationsData } from '../../hooks/metrics/destinationMetrics';
import { buildPreferredCoursesData } from '../../hooks/metrics/courseMetrics';
import { DEFAULT_FUNNEL_LOCATION, Pathfinder_OVERALL, buildFunnelLocationOptions, filterDashboardByFunnelScope, getSubmissionDate, matchesMonthYearFilter } from '../../utils/funnelFilters';
import { isAdministrativeStaffRole, isBranchManagerRole, isDeveloperRole, isMarketingRole, isOperationsLikeRole } from '../../../../utils/roles';
import { STAFF_FILTER_ALL, buildAssignedStaffByLeadId, buildFunnelStaffIdentityByValue, buildFunnelStaffOptions, buildStaffRoleAndDateFilteredLeads, buildStaffRoleScopedData, resolveActiveFunnelData } from './dashboardContentDefaultUtils';

type UseDefaultDashboardDataParams = Pick<DashboardContentProps, 'role' | 'user' | 'leads' | 'applications' | 'allPersonnel' | 'assessmentSubmissions' | 'genuineSubmissionIds' | 'selectedFunnelLocation' | 'onFunnelLocationChange' | 'selectedFunnelMonth' | 'selectedQuarter' | 'selectedFunnelYear' | 'selectedFunnelStaffRole' | 'onFunnelStaffRoleChange' | 'selectedLocation'>;

export const useDefaultDashboardData = ({
    role,
    user,
    leads,
    applications,
    allPersonnel,
    assessmentSubmissions,
    genuineSubmissionIds,
    selectedFunnelLocation,
    onFunnelLocationChange,
    selectedFunnelMonth,
    selectedQuarter,
    selectedFunnelYear,
    selectedFunnelStaffRole,
    onFunnelStaffRoleChange,
    selectedLocation,
}: UseDefaultDashboardDataParams) => {
    const isBranchScopedDefaultDashboard =
        isAdministrativeStaffRole(role) || isBranchManagerRole(role);
    const showStaffRoleFilter =
        isOperationsLikeRole(role) || isDeveloperRole(role) || isMarketingRole(role);
    const effectiveFunnelStaffRole = showStaffRoleFilter ? selectedFunnelStaffRole : STAFF_FILTER_ALL;
    const isBranchManagerDashboard = isBranchManagerRole(role);
    const isAdministrativeStaffDashboard = isAdministrativeStaffRole(role);
    const shouldLoadGlobalRankings =
        isBranchManagerDashboard
        || isAdministrativeStaffDashboard
        || isOperationsLikeRole(role)
        || isDeveloperRole(role)
        || isMarketingRole(role);

    const branchScopedLocation = String(user.branch ?? '').trim();
    const effectiveFunnelLocation =
        isBranchScopedDefaultDashboard && branchScopedLocation
            ? branchScopedLocation
            : selectedFunnelLocation;
    const effectiveTrendLocation =
        isAdministrativeStaffDashboard || isBranchManagerDashboard
            ? Pathfinder_OVERALL
            : selectedLocation;

    const funnelLocationOptions = useMemo(
        () => buildFunnelLocationOptions(leads, applications, assessmentSubmissions),
        [applications, assessmentSubmissions, leads]
    );

    useEffect(() => {
        if (isBranchScopedDefaultDashboard) return;
        if (funnelLocationOptions.includes(selectedFunnelLocation)) return;
        onFunnelLocationChange(DEFAULT_FUNNEL_LOCATION);
    }, [funnelLocationOptions, isBranchScopedDefaultDashboard, onFunnelLocationChange, selectedFunnelLocation]);

    const funnelStaffOptions = useMemo(
        () => buildFunnelStaffOptions(allPersonnel, effectiveFunnelLocation),
        [allPersonnel, effectiveFunnelLocation],
    );

    const funnelStaffIdentityByValue = useMemo(
        () => buildFunnelStaffIdentityByValue(allPersonnel, effectiveFunnelLocation),
        [allPersonnel, effectiveFunnelLocation],
    );

    useEffect(() => {
        if (!showStaffRoleFilter) return;
        const selectedExists = funnelStaffOptions.some((option) => option.value === selectedFunnelStaffRole);
        if (selectedExists) return;
        onFunnelStaffRoleChange(STAFF_FILTER_ALL);
    }, [funnelStaffOptions, onFunnelStaffRoleChange, selectedFunnelStaffRole, showStaffRoleFilter]);

    const {
        branchFilteredApplications,
        branchFilteredAssessmentSubmissions,
        branchFilteredLeads,
        filteredAssessmentSubmissions,
    } = useMemo(
        () =>
            filterDashboardByFunnelScope({
                selectedLocation: effectiveFunnelLocation,
                selectedMonth: selectedFunnelMonth,
                selectedQuarter,
                selectedYear: selectedFunnelYear,
                leads,
                applications,
                assessmentSubmissions,
            }),
        [
            applications,
            assessmentSubmissions,
            effectiveFunnelLocation,
            leads,
            selectedFunnelMonth,
            selectedQuarter,
            selectedFunnelYear,
        ]
    );

    const assignedStaffByLeadId = useMemo(
        () => buildAssignedStaffByLeadId(leads, assessmentSubmissions),
        [assessmentSubmissions, leads],
    );

    const { staffRoleFilteredApplications, staffRoleFilteredAssessmentSubmissions } = useMemo(
        () =>
            buildStaffRoleScopedData({
                effectiveFunnelStaffRole,
                branchFilteredApplications,
                branchFilteredAssessmentSubmissions,
                assignedStaffByLeadId,
                funnelStaffIdentityByValue,
            }),
        [
            assignedStaffByLeadId,
            branchFilteredApplications,
            branchFilteredAssessmentSubmissions,
            effectiveFunnelStaffRole,
            funnelStaffIdentityByValue,
        ],
    );

    const filteredFunnelDataByLocation = useMemo(() => buildManagerFunnelData(
        staffRoleFilteredApplications,
        staffRoleFilteredAssessmentSubmissions,
        genuineSubmissionIds,
        selectedFunnelMonth,
        selectedFunnelYear,
        selectedQuarter,
    ), [
        genuineSubmissionIds,
        selectedFunnelMonth,
        selectedQuarter,
        selectedFunnelYear,
        staffRoleFilteredApplications,
        staffRoleFilteredAssessmentSubmissions,
    ]);

    const activeFunnelData = resolveActiveFunnelData(filteredFunnelDataByLocation, effectiveFunnelLocation);

    const staffRoleAndDateFilteredAssessmentSubmissions = useMemo(
        () =>
            staffRoleFilteredAssessmentSubmissions.filter((submission) =>
                matchesMonthYearFilter(
                    getSubmissionDate(submission),
                    selectedFunnelMonth,
                    selectedFunnelYear,
                    selectedQuarter
                )
            ),
        [
            selectedFunnelMonth,
            selectedQuarter,
            selectedFunnelYear,
            staffRoleFilteredAssessmentSubmissions,
        ],
    );

    const staffRoleAndDateFilteredLeads = useMemo(
        () =>
            buildStaffRoleAndDateFilteredLeads({
                branchFilteredLeads,
                effectiveFunnelStaffRole,
                funnelStaffIdentityByValue,
                selectedFunnelMonth,
                selectedFunnelYear,
                selectedQuarter,
            }),
        [
            branchFilteredLeads,
            effectiveFunnelStaffRole,
            funnelStaffIdentityByValue,
            selectedFunnelMonth,
            selectedFunnelYear,
            selectedQuarter,
        ],
    );

    const filteredTopDestinationsData = useMemo(
        () => buildTopDestinationsData(staffRoleAndDateFilteredAssessmentSubmissions),
        [staffRoleAndDateFilteredAssessmentSubmissions]
    );
    const filteredPreferredCoursesData = useMemo(
        () => buildPreferredCoursesData(staffRoleAndDateFilteredAssessmentSubmissions),
        [staffRoleAndDateFilteredAssessmentSubmissions]
    );
    const filteredTopLeadSourcesData = useMemo(
        () => buildTopLeadSourcesData(staffRoleAndDateFilteredAssessmentSubmissions),
        [staffRoleAndDateFilteredAssessmentSubmissions]
    );
    const filteredLeadsByBranchData = useMemo(
        () => buildLeadsByBranchData(staffRoleAndDateFilteredAssessmentSubmissions, staffRoleAndDateFilteredLeads),
        [staffRoleAndDateFilteredAssessmentSubmissions, staffRoleAndDateFilteredLeads]
    );

    return {
        isBranchScopedDefaultDashboard,
        showStaffRoleFilter,
        isBranchManagerDashboard,
        isAdministrativeStaffDashboard,
        shouldLoadGlobalRankings,
        branchScopedLocation,
        effectiveFunnelLocation,
        effectiveTrendLocation,
        branchFilteredApplications,
        branchFilteredLeads,
        filteredAssessmentSubmissions,
        staffRoleFilteredApplications,
        staffRoleFilteredAssessmentSubmissions,
        activeFunnelData,
        filteredLeadsByBranchData,
        filteredTopDestinationsData,
        filteredPreferredCoursesData,
        filteredTopLeadSourcesData,
        funnelLocationOptions,
        funnelStaffOptions,
    };
};
