import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';
import { Widget } from './common';
import StatsCardsRow from '../widgets/StatsCardsRow';
import { MyActiveLeadsWidget, VisaStatusBreakdownWidget } from '../widgets/ConsultantWidgets';
import { TopCountryDestinations, PreferredCourseOfStudy } from '../widgets/ApplicationWidgets';
import { TopLeadSource } from '../widgets/LeadsWidgets';
import { TopCounsellors } from '../widgets/TeamWidgets';
import PathfinderTargetVsActualData from '../widgets/performance/PathfinderTargetVsActualData';
import { VisaApprovalRateTrend } from '../widgets/performance/VisaApprovalRateTrend';
import type { DashboardContentProps } from '../types/DashboardContentTypes';
import type { TrendData } from '../types/types';
import { buildTopLeadSourcesData } from '../hooks/metrics/leadMetrics';
import { buildTopDestinationsData } from '../hooks/metrics/destinationMetrics';
import { buildPreferredCoursesData } from '../hooks/metrics/courseMetrics';
import { Pathfinder_OVERALL, locationMatchesBranch } from '../utils/funnelFilters';
import { auth, ensureFirebaseReady } from '../../../services/firebase';
import { DASHBOARD_QUARTER_OPTIONS, getDashboardMonthOptions } from './default-dashboard/constants';

type TopCounsellorRanking = { name: string; grants: number };

const DashboardContentConsultant: React.FC<DashboardContentProps> = ({
    user,
    leads,
    allPersonnel,
    applications,
    widgetAnimationClasses,
    consultantFunnelData,
    assessmentSubmissions,
    selectedFunnelMonth,
    onFunnelMonthChange,
    selectedFunnelYear,
    selectedQuarter,
    onQuarterChange,
    theme,
}) => {
    const { t } = useTranslation();
    const [globalTopCounsellors, setGlobalTopCounsellors] = useState<TopCounsellorRanking[] | null>(null);
    const [globalTrendData, setGlobalTrendData] = useState<TrendData | null>(null);
    const userBranch = String(user.branch ?? '').trim();
    const targetVsActualTitle = userBranch
        ? `${userBranch} ${t('targetVsActualData', 'Target vs Actual Data')}`
        : t('overallTargetVsActualData', 'Target vs Actual Data');
    const leadBranchById = useMemo(() => {
        const map = new Map<string, string>();
        leads.forEach((lead) => {
            const leadId = String(lead.id ?? '').trim();
            if (!leadId) return;
            map.set(leadId, String(lead.branch ?? '').trim());
        });
        return map;
    }, [leads]);
    const branchTargetApplications = useMemo(() => {
        if (!userBranch) return applications;
        return applications.filter((application) => {
            const applicationBranch = String(application.branch ?? '').trim();
            const fallbackBranch = leadBranchById.get(String(application.studentId ?? '').trim()) ?? '';
            return locationMatchesBranch(userBranch, applicationBranch || fallbackBranch);
        });
    }, [applications, leadBranchById, userBranch]);
    const myAssessmentSubmissions = useMemo(() => {
        const currentUid = String(user.uid ?? '').trim();
        const currentName = String(user.displayName ?? '').trim().toLowerCase();
        return assessmentSubmissions.filter((submission) => {
            const assignedUid = String(submission.assignedCounsellorUid ?? '').trim();
            if (currentUid && assignedUid && assignedUid === currentUid) return true;
            const assignedName = String(submission.assignedCounsellor ?? '').trim().toLowerCase();
            return currentName !== '' && assignedName === currentName;
        });
    }, [assessmentSubmissions, user.displayName, user.uid]);
    const myTopLeadSourcesData = useMemo(
        () => buildTopLeadSourcesData(myAssessmentSubmissions),
        [myAssessmentSubmissions]
    );
    const myTopDestinationsData = useMemo(
        () => buildTopDestinationsData(myAssessmentSubmissions),
        [myAssessmentSubmissions]
    );
    const myPreferredCoursesData = useMemo(
        () => buildPreferredCoursesData(myAssessmentSubmissions),
        [myAssessmentSubmissions]
    );
    useEffect(() => {
        let cancelled = false;
        const loadConsultantGlobalDashboardData = async () => {
            try {
                const firebaseReady = await ensureFirebaseReady();
                if (!firebaseReady || !auth?.currentUser) return;
                const token = await auth.currentUser.getIdToken();
                const [topCounsellorsResponse, trendResponse] = await Promise.all([
                    fetch('/api/dashboard/top-visa-grant-counsellors', {
                        method: 'GET',
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }),
                    fetch('/api/dashboard/global-visa-approval-trend', {
                        method: 'GET',
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }),
                ]);
                if (cancelled) return;
                if (topCounsellorsResponse.ok) {
                    const payload = (await topCounsellorsResponse.json()) as {
                        ok?: boolean;
                        data?: TopCounsellorRanking[];
                    };
                    if (Array.isArray(payload?.data)) {
                        setGlobalTopCounsellors(payload.data);
                    }
                }
                if (trendResponse.ok) {
                    const payload = (await trendResponse.json()) as {
                        ok?: boolean;
                        data?: TrendData;
                    };
                    if (payload?.data && typeof payload.data === 'object') {
                        setGlobalTrendData(payload.data);
                    }
                }
            } catch (error) {
                console.error('Failed to load education consultant global dashboard data:', error);
            }
        };
        void loadConsultantGlobalDashboardData();
        return () => {
            cancelled = true;
        };
    }, [user.uid]);
    const effectiveTrendData = globalTrendData ?? ({} as TrendData);
    const selectClassName =
        'min-w-[120px] rounded-lg border border-gray-300/70 bg-white/70 px-2 py-1 text-sm font-medium text-gray-700 shadow-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-white/20 dark:bg-black/50 dark:text-gray-200';
    const funnelTitle = (
        <span className="inline-flex flex-wrap items-center gap-2">
            <span>{t('myApplicationFunnel')}</span>
            <span className="pl-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                {t('filterBy', 'Filter by:')}
            </span>
            <select
                value={selectedFunnelMonth}
                onChange={(event) => onFunnelMonthChange(event.target.value)}
                className={selectClassName}
                aria-label={t('month', 'Month')}
            >
                {getDashboardMonthOptions(selectedQuarter).map((month) => (
                    <option key={month.value} value={month.value}>
                        {t(month.label, month.label)}
                    </option>
                ))}
            </select>
            <select
                value={selectedQuarter}
                onChange={(event) => onQuarterChange(event.target.value)}
                className={selectClassName}
                aria-label={t('quarter', 'Quarter')}
            >
                {DASHBOARD_QUARTER_OPTIONS.map((quarter) => (
                    <option key={quarter.value} value={quarter.value}>
                        {t(quarter.label, quarter.label)}
                    </option>
                ))}
            </select>
        </span>
    );

    return (
        <>
            <div className={widgetAnimationClasses} style={{ transitionDelay: '100ms' }}>
                {consultantFunnelData && (
                    <Widget title={funnelTitle} className="liquid-glass">
                        <StatsCardsRow data={consultantFunnelData} />
                    </Widget>
                )}
            </div>
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="min-w-0 space-y-6 xl:col-span-2">
                    <div className={widgetAnimationClasses} style={{ transitionDelay: '200ms' }}>
                        <VisaStatusBreakdownWidget
                            applications={applications}
                            leads={leads}
                            user={user}
                            selectedMonth={selectedFunnelMonth}
                            selectedYear={selectedFunnelYear}
                            selectedQuarter={selectedQuarter}
                        />
                    </div>
                    <div className={widgetAnimationClasses} style={{ transitionDelay: '300ms' }}>
                        <PathfinderTargetVsActualData
                            title={targetVsActualTitle}
                            applications={branchTargetApplications}
                            selectedLocation={userBranch || Pathfinder_OVERALL}
                            selectedMonth={selectedFunnelMonth}
                            selectedYear={selectedFunnelYear}
                            selectedQuarter={selectedQuarter}
                        />
                    </div>
                    <div className={widgetAnimationClasses} style={{ transitionDelay: '400ms' }}>
                        <VisaApprovalRateTrend
                            title={t('visaApprovalRateTrend', 'Visa Approval Trend')}
                            selectedLocation={Pathfinder_OVERALL}
                            theme={theme}
                            trendData={effectiveTrendData}
                        />
                    </div>
                    <div className={widgetAnimationClasses} style={{ transitionDelay: '500ms' }}>
                        <TopCountryDestinations
                            title={t('topCountryDestination')}
                            destinations={myTopDestinationsData}
                        />
                    </div>
                </div>
                <div className="min-w-0 space-y-6 xl:col-span-1">
                    <div className={widgetAnimationClasses} style={{ transitionDelay: '250ms' }}>
                        <MyActiveLeadsWidget
                            leads={leads}
                            assessmentSubmissions={assessmentSubmissions}
                            allPersonnel={allPersonnel}
                            user={user}
                        />
                    </div>
                    <div className={widgetAnimationClasses} style={{ transitionDelay: '350ms' }}>
                        <TopCounsellors
                            title={t('topVisaGrantCounsellors')}
                            rankings={globalTopCounsellors ?? undefined}
                            applications={applications}
                            leads={leads}
                            assessmentSubmissions={assessmentSubmissions}
                        />
                    </div>
                    <div className={widgetAnimationClasses} style={{ transitionDelay: '450ms' }}>
                        <PreferredCourseOfStudy
                            title={t('preferredCourseOfStudy')}
                            courses={myPreferredCoursesData}
                        />
                    </div>
                    <div className={widgetAnimationClasses} style={{ transitionDelay: '550ms' }}>
                        <TopLeadSource title={t('topLeadSources')} leadSources={myTopLeadSourcesData} />
                    </div>
                </div>
            </div>
        </>
    );
};

export default DashboardContentConsultant;
