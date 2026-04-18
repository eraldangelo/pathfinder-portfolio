import { useMemo } from 'react';
import type { Lead } from '../../leads/leads-page/LeadsPage';
import type { ApplicationInfo } from '../../../data/applications';
import type { AssessmentSubmission, User } from '../../../types';
import { isAdminLikeRole, isConsultantLikeRole, isOperationsLikeRole } from '../../../utils/roles';
import {
    ALL_LOCATION_KEYS,
    BRANCH_COUNTRY_MAPPING,
    COUNTRY_MAP_CONFIG,
    COUNTRY_OVERALL_MAPPING,
} from '../constants/constants';
import { buildPreferredCoursesData } from './metrics/courseMetrics';
import { buildTopDestinationsData } from './metrics/destinationMetrics';
import { buildAdminLeadsByCounsellorData, buildLeadsByBranchData, buildLeadsByCounsellorData, buildTopLeadSourcesData } from './metrics/leadMetrics';
import { buildAdminFunnelData, buildConsultantFunnelData, buildManagerFunnelData } from './metrics/funnelMetrics';
import { buildPerformanceData, buildTrendData, buildYieldData } from './metrics/staticMetrics';

interface UseDashboardMetricsParams {
    role: string;
    user: User;
    leads: Lead[];
    applications: ApplicationInfo[];
    assessmentSubmissions: AssessmentSubmission[];
    genuineSubmissionIds: Set<string>;
    selectedFunnelMonth: string;
    selectedFunnelYear: string;
    selectedQuarter: string;
}

export const useDashboardMetrics = ({
    role,
    user,
    leads,
    applications,
    assessmentSubmissions,
    genuineSubmissionIds,
    selectedFunnelMonth,
    selectedFunnelYear,
    selectedQuarter,
}: UseDashboardMetricsParams) => {
    const isManager = isOperationsLikeRole(role);
    const isAdminLike = isAdminLikeRole(role);
    const managerBranch = user.branch || '';

    const managerCountry = useMemo(
        () => BRANCH_COUNTRY_MAPPING[managerBranch as keyof typeof BRANCH_COUNTRY_MAPPING] || '',
        [managerBranch]
    );
    const managerCountryOverallKey = useMemo(
        () => COUNTRY_OVERALL_MAPPING[managerCountry as keyof typeof COUNTRY_OVERALL_MAPPING] || 'Overall',
        [managerCountry]
    );
    const managerMapConfig = useMemo(
        () => COUNTRY_MAP_CONFIG[managerCountry as keyof typeof COUNTRY_MAP_CONFIG],
        [managerCountry]
    );

    const adminLeadsByCounsellorData = useMemo(
        () => buildAdminLeadsByCounsellorData(leads, user.branch, isAdminLike),
        [leads, user.branch, isAdminLike]
    );

    const adminFunnelData = useMemo(
        () => buildAdminFunnelData(leads, applications, assessmentSubmissions, genuineSubmissionIds, user.branch, isAdminLike),
        [isAdminLike, user.branch, leads, applications, assessmentSubmissions, genuineSubmissionIds]
    );

    const consultantFunnelData = useMemo(
        () => buildConsultantFunnelData(
            leads,
            applications,
            assessmentSubmissions,
            genuineSubmissionIds,
            user.displayName,
            user.uid,
            isConsultantLikeRole(role),
            selectedFunnelMonth,
            selectedFunnelYear,
            selectedQuarter,
        ),
        [
            role,
            user.displayName,
            user.uid,
            leads,
            applications,
            assessmentSubmissions,
            genuineSubmissionIds,
            selectedFunnelMonth,
            selectedFunnelYear,
            selectedQuarter,
        ]
    );

    const managerFunnelData = useMemo(
        () => buildManagerFunnelData(applications, assessmentSubmissions, genuineSubmissionIds),
        [applications, assessmentSubmissions, genuineSubmissionIds]
    );

    const yieldData = useMemo(() => buildYieldData(), []);

    const performanceData = useMemo(() => buildPerformanceData(), []);

    const trendData = useMemo(() => buildTrendData(applications), [applications]);

    const topDestinationsData = useMemo(
        () => buildTopDestinationsData(assessmentSubmissions),
        [assessmentSubmissions]
    );

    const counsellorsData = useMemo(() => {
        const data: { [key: string]: { name: string; avatar: string; grants: number; rate: number }[] } = {};
        ALL_LOCATION_KEYS.forEach((key) => {
            data[key] = [];
        });
        return data;
    }, []);

    const leadsByBranchData = useMemo(
        () => buildLeadsByBranchData(assessmentSubmissions, leads),
        [assessmentSubmissions, leads]
    );
    const topLeadSourcesData = useMemo(
        () => buildTopLeadSourcesData(assessmentSubmissions),
        [assessmentSubmissions]
    );
    const preferredCoursesData = useMemo(
        () => buildPreferredCoursesData(assessmentSubmissions),
        [assessmentSubmissions]
    );

    const leadsByCounsellorData = useMemo(
        () => buildLeadsByCounsellorData(leads, managerBranch, isManager),
        [isManager, leads, managerBranch]
    );

    return {
        isManager,
        managerBranch,
        managerCountry,
        managerCountryOverallKey,
        managerMapConfig,
        adminLeadsByCounsellorData,
        adminFunnelData,
        consultantFunnelData,
        managerFunnelData,
        yieldData,
        performanceData,
        trendData,
        topDestinationsData,
        counsellorsData,
        leadsByBranchData,
        topLeadSourcesData,
        preferredCoursesData,
        leadsByCounsellorData,
    };
};


