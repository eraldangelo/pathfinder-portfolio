import type { ApplicationInfo } from '../../../data/applications';
import type { PersonnelWithDetails } from '../../../data/personnel';
import type { AssessmentSubmission, User } from '../../../types';
import type { Lead } from '../../leads/leads-page/LeadsPage';
import type { Reminder, TrendData } from './types';

export interface DashboardContentProps {
    role: string;
    user: User;
    leads: Lead[];
    applications: ApplicationInfo[];
    allPersonnel: PersonnelWithDetails[];
    assessmentSubmissions: AssessmentSubmission[];
    genuineSubmissionIds: Set<string>;
    theme: 'light' | 'dark';
    widgetAnimationClasses: string;
    selectedFunnelLocation: string;
    onFunnelLocationChange: (value: string) => void;
    selectedFunnelMonth: string;
    onFunnelMonthChange: (value: string) => void;
    selectedFunnelYear: string;
    onFunnelYearChange: (value: string) => void;
    selectedFunnelStaffRole: string;
    onFunnelStaffRoleChange: (value: string) => void;
    selectedLocation: string;
    onLocationChange: (value: string) => void;
    selectedQuarter: string;
    onQuarterChange: (value: string) => void;
    selectedPerfCountry: string;
    onPerfCountryChange: (value: string) => void;
    adminFunnelData: {
        totalLeads: string;
        genuineStudents: string;
        applications: string;
        offers: string;
        coe: string;
        lodged: string;
        granted: string;
        refused: string;
    };
    managerFunnelData: {
        [key: string]: {
            totalLeads: string;
            genuineStudents: string;
            applications: string;
            offers: string;
            coe: string;
            lodged: string;
            granted: string;
            refused: string;
        };
    };
    consultantFunnelData: {
        totalLeads: string;
        genuineStudents: string;
        applications: string;
        offers: string;
        coe: string;
        lodged: string;
        granted: string;
        refused: string;
    } | null;
    adminLeadsByCounsellorData: { counsellor: string; leads: number }[];
    leadsByCounsellorData: { counsellor: string; leads: number }[];
    topLeadSourcesData: { source: string; count: number }[];
    topDestinationsData: { name: string; code?: string; apps: number }[];
    counsellorsData: { [key: string]: { name: string; avatar: string; grants: number; rate: number }[] };
    leadsByBranchData: { branch: string; leads: number }[];
    preferredCoursesData: { name: string; details?: string; apps: number }[];
    performanceData: { [key: string]: { quarter: string; lodged: number; granted: number; refused: number }[] };
    yieldData: { [key: string]: { [quarter: string]: { applications: number; offers: number; lodged: number; grants: number } } };
    trendData: TrendData;
    managerBranch: string;
    managerCountryOverallKey: string;
    managerMapConfig?: { center: [number, number]; zoom: number };
    managerCountry: string;
    reminders: Reminder[];
    onOpenAddReminder: () => void;
}

