import type { TrendPoint } from '../types/types';

export type DashboardDownloadSnapshot = {
  userName: string;
  reportDate: string;
  selectedFunnelLocation: string;
  selectedFunnelMonth: string;
  selectedFunnelYear: string;
  selectedLocation: string;
  selectedQuarter: string;
  funnelData: {
    totalLeads: string;
    genuineStudents: string;
    applications: string;
    offers: string;
    coe: string;
    lodged: string;
    granted: string;
    refused: string;
  };
  targetVsActual: {
    label: string;
    actual: number;
    target: number;
    achievement: number;
  }[];
  topLeadSources: { source: string; count: number }[];
  topDestinations: { name: string; code?: string; apps: number }[];
  preferredCourses: { name: string; details?: string; apps: number }[];
  topVisaGrantCounsellors: { name: string; grants: number }[];
  topStaffReferrers: { name: string; referrals: number }[];
  trendData: TrendPoint[];
};

export interface DashboardDownloadSnapshotParams {
  userName: string;
  reportDate: string;
  selectedFunnelLocation: string;
  selectedFunnelMonth: string;
  selectedFunnelYear: string;
  selectedLocation: string;
  selectedQuarter: string;
  funnelData: DashboardDownloadSnapshot['funnelData'];
  targetVsActual: DashboardDownloadSnapshot['targetVsActual'];
  topLeadSources: DashboardDownloadSnapshot['topLeadSources'];
  topDestinations: DashboardDownloadSnapshot['topDestinations'];
  preferredCourses: DashboardDownloadSnapshot['preferredCourses'];
  topVisaGrantCounsellors: DashboardDownloadSnapshot['topVisaGrantCounsellors'];
  topStaffReferrers: DashboardDownloadSnapshot['topStaffReferrers'];
  trendData: DashboardDownloadSnapshot['trendData'];
}

export const createDashboardDownloadSnapshot = (params: DashboardDownloadSnapshotParams): DashboardDownloadSnapshot => ({
  ...params,
});
