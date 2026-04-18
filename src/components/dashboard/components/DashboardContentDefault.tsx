import React, { useEffect, useState } from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';
import type { DashboardContentProps } from '../types/DashboardContentTypes';
import type { TrendData } from '../types/types';
import DefaultDashboardLayout from './default-dashboard/DefaultDashboardLayout';
import { buildDefaultDashboardFunnelTitle } from './default-dashboard/buildDefaultDashboardFunnelTitle';
import { buildDefaultDashboardTitles } from './default-dashboard/dashboardContentDefaultTitles';
import { useGlobalBranchManagerRankings } from './default-dashboard/useGlobalBranchManagerRankings';
import { useDefaultDashboardData } from './default-dashboard/useDefaultDashboardData';
import { auth, ensureFirebaseReady } from '../../../services/firebase';

const DashboardContentDefault: React.FC<DashboardContentProps> = ({
    role,
    user,
    leads,
    applications,
    allPersonnel,
    assessmentSubmissions,
    genuineSubmissionIds,
    theme,
    widgetAnimationClasses,
    selectedFunnelLocation,
    onFunnelLocationChange,
    selectedFunnelMonth,
    onFunnelMonthChange,
    selectedFunnelYear,
    selectedQuarter,
    onQuarterChange,
    selectedFunnelStaffRole,
    onFunnelStaffRoleChange,
    selectedLocation,
    trendData,
}) => {
    const { t } = useTranslation();
    const [globalTrendData, setGlobalTrendData] = useState<TrendData | null>(null);
    const {
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
    } = useDefaultDashboardData({
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
    });

    const { globalTopCounsellors, globalTopStaffReferrers } = useGlobalBranchManagerRankings({
        enabled: shouldLoadGlobalRankings,
        authUid: user.uid,
    });
    const shouldUseGlobalTrendData = isBranchManagerDashboard || isAdministrativeStaffDashboard;

    useEffect(() => {
        let cancelled = false;

        const loadGlobalTrendData = async () => {
            if (!shouldUseGlobalTrendData) {
                setGlobalTrendData(null);
                return;
            }

            try {
                const firebaseReady = await ensureFirebaseReady();
                if (!firebaseReady || !auth?.currentUser) return;
                const token = await auth.currentUser.getIdToken();
                const response = await fetch('/api/dashboard/global-visa-approval-trend', {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (cancelled || !response.ok) return;
                const payload = (await response.json()) as {
                    ok?: boolean;
                    data?: TrendData;
                };
                if (payload?.data && typeof payload.data === 'object') {
                    setGlobalTrendData(payload.data);
                }
            } catch (error) {
                console.error('Failed to load global visa trend for branch manager dashboard:', error);
            }
        };

        void loadGlobalTrendData();
        return () => {
            cancelled = true;
        };
    }, [shouldUseGlobalTrendData, user.uid]);
    const effectiveTrendData = shouldUseGlobalTrendData
        ? (globalTrendData ?? ({} as TrendData))
        : trendData;

    const {
        funnelHeadingLabel,
        targetVsActualTitle,
        topCountryTitle,
        preferredCourseTitle,
        topLeadSourceTitle,
        topStaffReferrersTitle,
    } = buildDefaultDashboardTitles({
        isBranchScopedDefaultDashboard,
        isBranchManagerDashboard,
        branchScopedLocation,
        t,
    });

    const funnelTitle = buildDefaultDashboardFunnelTitle({
        t,
        funnelHeadingLabel,
        isBranchScopedDashboard: isBranchScopedDefaultDashboard,
        selectedFunnelLocation,
        onFunnelLocationChange,
        funnelLocationOptions,
        selectedFunnelMonth,
        onFunnelMonthChange,
        selectedQuarter,
        onQuarterChange,
        showStaffRoleFilter,
        selectedFunnelStaffRole,
        onFunnelStaffRoleChange,
        funnelStaffOptions,
    });

    return (
        <DefaultDashboardLayout
            widgetAnimationClasses={widgetAnimationClasses}
            funnelTitle={funnelTitle}
            activeFunnelData={activeFunnelData}
            isBranchScopedDefaultDashboard={isBranchScopedDefaultDashboard}
            branchScopedWidgetsProps={{
                widgetAnimationClasses,
                t,
                targetVsActualTitle,
                applications,
                targetMetricApplications: staffRoleFilteredApplications,
                branchFilteredApplications,
                effectiveFunnelLocation,
                selectedFunnelMonth,
                selectedQuarter,
                selectedFunnelYear,
                effectiveTrendLocation,
                theme,
                trendData: effectiveTrendData,
                topLeadSourceTitle,
                filteredTopLeadSourcesData,
                isAdministrativeStaffDashboard,
                branchFilteredLeads,
                filteredAssessmentSubmissions,
                allPersonnel,
                isBranchManagerDashboard,
                leads,
                assessmentSubmissions,
                globalTopCounsellors,
                topCountryTitle,
                filteredTopDestinationsData,
                preferredCourseTitle,
                filteredPreferredCoursesData,
                topStaffReferrersTitle,
                globalTopStaffReferrers,
            }}
            globalWidgetsProps={{
                widgetAnimationClasses,
                t,
                applications,
                leads,
                targetMetricApplications: staffRoleFilteredApplications,
                heatmapApplications: staffRoleFilteredApplications,
                heatmapAssessmentSubmissions: staffRoleFilteredAssessmentSubmissions,
                effectiveFunnelLocation,
                selectedFunnelMonth,
                selectedQuarter,
                selectedFunnelYear,
                effectiveTrendLocation,
                theme,
                trendData: effectiveTrendData,
                assessmentSubmissions,
                filteredLeadsByBranchData,
                filteredTopDestinationsData,
                filteredPreferredCoursesData,
                filteredTopLeadSourcesData,
                allPersonnel,
                globalTopCounsellors,
                globalTopStaffReferrers,
            }}
        />
    );
};

export default DashboardContentDefault;
