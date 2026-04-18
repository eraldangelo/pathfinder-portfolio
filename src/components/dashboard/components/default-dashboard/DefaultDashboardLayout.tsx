import React from 'react';
import { Widget } from '../common';
import StatsCardsRow from '../../widgets/StatsCardsRow';
import BranchScopedWidgets from './BranchScopedWidgets';
import GlobalWidgets from './GlobalWidgets';
import type { DashboardContentProps } from '../../types/DashboardContentTypes';
import type { TopCounsellorRanking, TopStaffReferrerRanking } from './types';
import type { PersonnelWithDetails } from '../../../../data/personnel';

interface BranchScopedWidgetProps {
    widgetAnimationClasses: string;
    t: (key: string, defaultValue?: string) => string;
    targetVsActualTitle: string;
    applications: DashboardContentProps['applications'];
    targetMetricApplications: DashboardContentProps['applications'];
    branchFilteredApplications: DashboardContentProps['applications'];
    effectiveFunnelLocation: string;
    selectedFunnelMonth: string;
    selectedQuarter: string;
    selectedFunnelYear: string;
    effectiveTrendLocation: string;
    theme: 'light' | 'dark';
    trendData: DashboardContentProps['trendData'];
    topLeadSourceTitle: string;
    filteredTopLeadSourcesData: DashboardContentProps['topLeadSourcesData'];
    isAdministrativeStaffDashboard: boolean;
    branchFilteredLeads: DashboardContentProps['leads'];
    filteredAssessmentSubmissions: DashboardContentProps['assessmentSubmissions'];
    allPersonnel: DashboardContentProps['allPersonnel'];
    isBranchManagerDashboard: boolean;
    leads: DashboardContentProps['leads'];
    assessmentSubmissions: DashboardContentProps['assessmentSubmissions'];
    globalTopCounsellors: TopCounsellorRanking[] | null;
    topCountryTitle: string;
    filteredTopDestinationsData: DashboardContentProps['topDestinationsData'];
    preferredCourseTitle: string;
    filteredPreferredCoursesData: DashboardContentProps['preferredCoursesData'];
    topStaffReferrersTitle: string;
    globalTopStaffReferrers: TopStaffReferrerRanking[] | null;
}

interface GlobalWidgetProps {
    widgetAnimationClasses: string;
    t: (key: string, defaultValue?: string) => string;
    applications: DashboardContentProps['applications'];
    leads: DashboardContentProps['leads'];
    targetMetricApplications: DashboardContentProps['applications'];
    heatmapApplications: DashboardContentProps['applications'];
    heatmapAssessmentSubmissions: DashboardContentProps['assessmentSubmissions'];
    effectiveFunnelLocation: string;
    selectedFunnelMonth: string;
    selectedQuarter: string;
    selectedFunnelYear: string;
    effectiveTrendLocation: string;
    theme: 'light' | 'dark';
    trendData: DashboardContentProps['trendData'];
    assessmentSubmissions: DashboardContentProps['assessmentSubmissions'];
    filteredLeadsByBranchData: DashboardContentProps['leadsByBranchData'];
    filteredTopDestinationsData: DashboardContentProps['topDestinationsData'];
    filteredPreferredCoursesData: DashboardContentProps['preferredCoursesData'];
    filteredTopLeadSourcesData: DashboardContentProps['topLeadSourcesData'];
    allPersonnel: PersonnelWithDetails[];
    globalTopCounsellors: TopCounsellorRanking[] | null;
    globalTopStaffReferrers: TopStaffReferrerRanking[] | null;
}

interface DefaultDashboardLayoutProps {
    widgetAnimationClasses: string;
    funnelTitle: React.ReactNode;
    activeFunnelData: {
        totalLeads: string;
        genuineStudents: string;
        applications: string;
        offers: string;
        coe: string;
        lodged: string;
        granted: string;
        refused: string;
    };
    isBranchScopedDefaultDashboard: boolean;
    branchScopedWidgetsProps: BranchScopedWidgetProps;
    globalWidgetsProps: GlobalWidgetProps;
}

const DefaultDashboardLayout: React.FC<DefaultDashboardLayoutProps> = ({
    widgetAnimationClasses,
    funnelTitle,
    activeFunnelData,
    isBranchScopedDefaultDashboard,
    branchScopedWidgetsProps,
    globalWidgetsProps,
}) => (
    <>
        <div className={widgetAnimationClasses} style={{ transitionDelay: '50ms' }}>
            <Widget title={funnelTitle} className="liquid-glass">
                <StatsCardsRow data={activeFunnelData} />
            </Widget>
        </div>
        {isBranchScopedDefaultDashboard ? (
            <BranchScopedWidgets {...branchScopedWidgetsProps} />
        ) : (
            <GlobalWidgets {...globalWidgetsProps} />
        )}
    </>
);

export default DefaultDashboardLayout;
