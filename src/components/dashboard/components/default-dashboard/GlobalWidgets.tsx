import React from 'react';
import PathfinderTargetVsActualData from '../../widgets/performance/PathfinderTargetVsActualData';
import { VisaApprovalRateTrend } from '../../widgets/performance/VisaApprovalRateTrend';
import LeadsHeatmap from '../../widgets/LeadsHeatmap';
import { TopCountryDestinations, PreferredCourseOfStudy } from '../../widgets/ApplicationWidgets';
import { TopCounsellors, TopStaffReferrers } from '../../widgets/TeamWidgets';
import { LeadsByBranch, TopLeadSource } from '../../widgets/LeadsWidgets';
import type { DashboardContentProps } from '../../types/DashboardContentTypes';
import type { PersonnelWithDetails } from '../../../../data/personnel';

interface GlobalWidgetsProps {
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
    globalTopCounsellors: Array<{ name: string; grants: number }> | null;
    globalTopStaffReferrers: Array<{ name: string; referrals: number }> | null;
}

const resolveTargetVsActualTitle = (
    selectedLocation: string,
    t: (key: string, defaultValue?: string) => string,
) => {
    const location = String(selectedLocation || '').trim();
    const locationKey = location.toLowerCase();

    if (
        !location
        || locationKey === 'overall'
        || locationKey === 'philippines overall'
        || locationKey === 'philippine overall'
        || locationKey === 'pathfinder overall'
    ) {
        return t('overallTargetVsActualData', 'Target vs Actual Data');
    }

    const targetVsActualLabel = t('targetVsActualData', 'Target vs Actual Data');

    if (locationKey === 'cebu') return `Cebu ${targetVsActualLabel}`;
    if (locationKey === 'davao') return `Davao ${targetVsActualLabel}`;
    if (locationKey === 'manila') return `Manila ${targetVsActualLabel}`;
    if (locationKey === 'pampanga') return `Pampanga ${targetVsActualLabel}`;

    return `${location} ${targetVsActualLabel}`;
};

const GlobalWidgets: React.FC<GlobalWidgetsProps> = ({
    widgetAnimationClasses,
    t,
    applications,
    leads,
    targetMetricApplications,
    heatmapApplications,
    heatmapAssessmentSubmissions,
    effectiveFunnelLocation,
    selectedFunnelMonth,
    selectedQuarter,
    selectedFunnelYear,
    effectiveTrendLocation,
    theme,
    trendData,
    assessmentSubmissions,
    filteredLeadsByBranchData,
    filteredTopDestinationsData,
    filteredPreferredCoursesData,
    filteredTopLeadSourcesData,
    allPersonnel,
    globalTopCounsellors,
    globalTopStaffReferrers,
}) => (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="min-w-0 space-y-6 xl:col-span-2">
            <div className={widgetAnimationClasses} style={{ transitionDelay: '200ms' }}>
                <PathfinderTargetVsActualData
                    title={resolveTargetVsActualTitle(effectiveFunnelLocation, t)}
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
                <LeadsHeatmap
                    assessmentSubmissions={heatmapAssessmentSubmissions}
                    applications={heatmapApplications}
                    mapConfig={undefined}
                    countryFilter={undefined}
                    theme={theme}
                />
            </div>
            <div className={widgetAnimationClasses} style={{ transitionDelay: '500ms' }}>
                <TopStaffReferrers
                    title={t('topStaffReferrers', 'Top Staff Referrers')}
                    assessmentSubmissions={assessmentSubmissions}
                    rankings={globalTopStaffReferrers ?? undefined}
                    allPersonnel={allPersonnel}
                    columns={3}
                />
            </div>
            <div className={widgetAnimationClasses} style={{ transitionDelay: '600ms' }}>
                <TopCounsellors
                    title={t('topVisaGrantCounsellors')}
                    applications={applications}
                    leads={leads}
                    assessmentSubmissions={assessmentSubmissions}
                    rankings={globalTopCounsellors ?? undefined}
                    columns={3}
                />
            </div>
        </div>
        <div className="min-w-0 space-y-6 xl:col-span-1">
            <div className={widgetAnimationClasses} style={{ transitionDelay: '300ms' }}>
                <LeadsByBranch leadsByBranchData={filteredLeadsByBranchData} />
            </div>
            <div className={widgetAnimationClasses} style={{ transitionDelay: '400ms' }}>
                <TopCountryDestinations
                    title={t('topCountryDestination')}
                    destinations={filteredTopDestinationsData}
                />
            </div>
            <div className={widgetAnimationClasses} style={{ transitionDelay: '500ms' }}>
                <PreferredCourseOfStudy
                    title={t('preferredCourseOfStudy')}
                    courses={filteredPreferredCoursesData}
                />
            </div>
            <div className={widgetAnimationClasses} style={{ transitionDelay: '600ms' }}>
                <TopLeadSource title={t('topLeadSources')} leadSources={filteredTopLeadSourcesData} />
            </div>
        </div>
    </div>
);

export default GlobalWidgets;
