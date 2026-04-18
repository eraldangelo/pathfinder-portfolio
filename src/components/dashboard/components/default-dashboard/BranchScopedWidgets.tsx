import React from 'react';
import PathfinderTargetVsActualData from '../../widgets/performance/PathfinderTargetVsActualData';
import { VisaApprovalRateTrend } from '../../widgets/performance/VisaApprovalRateTrend';
import { TopCountryDestinations, PreferredCourseOfStudy } from '../../widgets/ApplicationWidgets';
import { LeadsEndorsedWidget, TopCounsellors, TopStaffReferrers } from '../../widgets/TeamWidgets';
import { TopLeadSource } from '../../widgets/LeadsWidgets';
import type { DashboardContentProps } from '../../types/DashboardContentTypes';
import type { TopCounsellorRanking, TopStaffReferrerRanking } from './types';

interface BranchScopedWidgetsProps {
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

const BranchScopedWidgets: React.FC<BranchScopedWidgetsProps> = ({
    widgetAnimationClasses,
    t,
    targetVsActualTitle,
    applications,
    targetMetricApplications,
    branchFilteredApplications,
    effectiveFunnelLocation,
    selectedFunnelMonth,
    selectedQuarter,
    selectedFunnelYear,
    effectiveTrendLocation,
    theme,
    trendData,
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
}) => (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="min-w-0 space-y-6 xl:col-span-2">
            <div className={widgetAnimationClasses} style={{ transitionDelay: '200ms' }}>
                <PathfinderTargetVsActualData
                    title={targetVsActualTitle}
                    applications={targetMetricApplications}
                    selectedLocation={effectiveFunnelLocation}
                    selectedMonth={selectedFunnelMonth}
                    selectedQuarter={selectedQuarter}
                    selectedYear={selectedFunnelYear}
                />
            </div>
            <div className={widgetAnimationClasses} style={{ transitionDelay: '300ms' }}>
                <VisaApprovalRateTrend
                    title={t('visaApprovalRateTrend')}
                    selectedLocation={effectiveTrendLocation}
                    theme={theme}
                    trendData={trendData}
                />
            </div>
            <div className={widgetAnimationClasses} style={{ transitionDelay: '400ms' }}>
                <TopLeadSource title={topLeadSourceTitle} leadSources={filteredTopLeadSourcesData} />
            </div>
            <div className={widgetAnimationClasses} style={{ transitionDelay: '500ms' }}>
                <TopStaffReferrers
                    title={topStaffReferrersTitle}
                    assessmentSubmissions={assessmentSubmissions}
                    rankings={globalTopStaffReferrers ?? undefined}
                    allPersonnel={allPersonnel}
                    columns={3}
                />
            </div>
        </div>
        <div className="min-w-0 space-y-6 xl:col-span-1">
            {isAdministrativeStaffDashboard && (
                <div className={widgetAnimationClasses} style={{ transitionDelay: '325ms' }}>
                    <LeadsEndorsedWidget
                        title={t('leadsEndorsed', 'Leads Endorsed')}
                        leads={branchFilteredLeads}
                        assessmentSubmissions={filteredAssessmentSubmissions}
                        allPersonnel={allPersonnel}
                        branch={effectiveFunnelLocation}
                    />
                </div>
            )}
            <div className={widgetAnimationClasses} style={{ transitionDelay: '350ms' }}>
                <TopCounsellors
                    title={t('topVisaGrantCounsellors')}
                    applications={applications}
                    leads={leads}
                    assessmentSubmissions={assessmentSubmissions}
                    rankings={(isBranchManagerDashboard || isAdministrativeStaffDashboard) ? globalTopCounsellors ?? undefined : undefined}
                />
            </div>
            <div className={widgetAnimationClasses} style={{ transitionDelay: '450ms' }}>
                <TopCountryDestinations
                    title={topCountryTitle}
                    destinations={filteredTopDestinationsData}
                />
            </div>
            <div className={widgetAnimationClasses} style={{ transitionDelay: '550ms' }}>
                <PreferredCourseOfStudy
                    title={preferredCourseTitle}
                    courses={filteredPreferredCoursesData}
                />
            </div>
        </div>
    </div>
);

export default BranchScopedWidgets;
