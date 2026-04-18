import { useCallback, useEffect } from 'react';
import type { ApplicationInfo } from '../../../data/applications';
import type { AssessmentSubmission, User } from '../../../types';
import type { Lead } from '../../leads/leads-page/LeadsPage';
import type { TrendData } from '../types/types';
import { buildCsvContent, buildExcelContent } from '../utils/dashboardDownloadContent';
import { requestDashboardAiInsights } from './dashboardDownloadAi';
import { buildPdfReport } from '../utils/dashboardDownloadPdf';
import { createDashboardDownloadSnapshot } from '../utils/dashboardDownloadSnapshot';
import { buildManagerFunnelData } from './metrics/funnelMetrics';
import { buildTopLeadSourcesData } from './metrics/leadMetrics';
import { buildTopDestinationsData } from './metrics/destinationMetrics';
import { buildPreferredCoursesData } from './metrics/courseMetrics';
import {
  filterDashboardByFunnelScope,
} from '../utils/funnelFilters';
import { buildTopStaffReferrers, buildTopVisaGrantCounsellors } from '../utils/teamRankingMetrics';
import { buildTargetVsActualRows } from '../utils/targetVsActualMetrics';
import { filterTrendPointsByPeriod } from '../utils/dashboardReportPeriod';
import {
  resolveFunnelDataForLocation,
  resolveTrendLocationForReport,
} from './dashboardDownloadScope';
import {
  buildDashboardDownloadFilename,
  buildDashboardPdfCacheKey,
  buildDashboardSnapshotKey,
  loadDashboardPdfModules,
  preloadDashboardPdfModules,
  triggerBlobDownload,
} from './dashboardDownloadHelpers';
import {
  getCachedDashboardPdfBytes,
  getOrCreateDashboardAiInsights,
  setCachedDashboardPdfBytes,
} from './dashboardDownloadCache';

interface UseDashboardDownloadsParams {
  user: User;
  leads: Lead[];
  applications: ApplicationInfo[];
  assessmentSubmissions: AssessmentSubmission[];
  genuineSubmissionIds: Set<string>;
  selectedFunnelLocation: string;
  selectedFunnelMonth: string;
  selectedFunnelYear: string;
  selectedLocation: string;
  selectedQuarter: string;
  trendData: TrendData;
}

export const useDashboardDownloads = ({
  user,
  leads,
  applications,
  assessmentSubmissions,
  genuineSubmissionIds,
  selectedFunnelLocation,
  selectedFunnelMonth,
  selectedFunnelYear,
  selectedLocation,
  selectedQuarter,
  trendData,
}: UseDashboardDownloadsParams) => {
  useEffect(() => {
    preloadDashboardPdfModules();
  }, []);
  const getFilename = useCallback(
    (extension: string) =>
      buildDashboardDownloadFilename({
        extension,
        selectedFunnelLocation,
        selectedFunnelMonth,
        selectedFunnelQuarter: selectedQuarter,
        selectedFunnelYear,
      }),
    [selectedFunnelLocation, selectedFunnelMonth, selectedQuarter, selectedFunnelYear],
  );
  const buildSnapshot = useCallback(() => {
    const {
      branchFilteredLeads,
      branchFilteredApplications,
      filteredApplications,
      filteredAssessmentSubmissions,
    } =
      filterDashboardByFunnelScope({
        selectedLocation: selectedFunnelLocation,
        selectedMonth: selectedFunnelMonth,
        selectedQuarter,
        selectedYear: selectedFunnelYear,
        leads,
        applications,
        assessmentSubmissions,
      });

    const funnelByLocation = buildManagerFunnelData(
      branchFilteredApplications,
      filteredAssessmentSubmissions,
      genuineSubmissionIds,
      selectedFunnelMonth,
      selectedFunnelYear,
      selectedQuarter,
    );
    const funnelData = resolveFunnelDataForLocation(
      selectedFunnelLocation,
      funnelByLocation,
    );

    const reportTrendLocation = resolveTrendLocationForReport(
      selectedFunnelLocation,
      selectedLocation,
      trendData,
    );
    const reportTrendData = filterTrendPointsByPeriod(
      trendData[reportTrendLocation] ?? [],
      selectedFunnelMonth,
      selectedQuarter,
      selectedFunnelYear,
    );

    const targetVsActual = buildTargetVsActualRows(
      branchFilteredApplications,
      selectedFunnelLocation,
      selectedFunnelMonth,
      selectedFunnelYear,
      selectedQuarter,
    ).rows.map((row) => ({
      label: row.label,
      actual: row.actual,
      target: row.target,
      achievement: row.achievement,
    }));

    return createDashboardDownloadSnapshot({
      userName: user.displayName || 'User',
      reportDate: new Date().toLocaleDateString(),
      selectedFunnelLocation,
      selectedFunnelMonth,
      selectedFunnelYear,
      selectedLocation: reportTrendLocation,
      selectedQuarter,
      funnelData,
      targetVsActual,
      topLeadSources: buildTopLeadSourcesData(filteredAssessmentSubmissions),
      topDestinations: buildTopDestinationsData(filteredAssessmentSubmissions),
      preferredCourses: buildPreferredCoursesData(filteredAssessmentSubmissions),
      topVisaGrantCounsellors: buildTopVisaGrantCounsellors(
        branchFilteredApplications,
        branchFilteredLeads,
        filteredAssessmentSubmissions,
        selectedFunnelMonth,
        selectedFunnelYear,
        selectedQuarter,
      ),
      topStaffReferrers: buildTopStaffReferrers(filteredAssessmentSubmissions),
      trendData: reportTrendData,
    });
  }, [
    applications,
    assessmentSubmissions,
    genuineSubmissionIds,
    leads,
    selectedFunnelLocation,
    selectedFunnelMonth,
    selectedFunnelYear,
    selectedLocation,
    selectedQuarter,
    trendData,
    user.displayName,
  ]);

  const resolveSnapshotAndInsights = useCallback(async () => {
    const snapshot = buildSnapshot();
    const snapshotKey = buildDashboardSnapshotKey(snapshot);
    const aiInsights = await getOrCreateDashboardAiInsights(snapshotKey, () =>
      requestDashboardAiInsights(snapshot),
    );
    return { snapshot, snapshotKey, aiInsights };
  }, [buildSnapshot]);
  const handleDownloadCSV = useCallback(async () => {
    const { snapshot, aiInsights } = await resolveSnapshotAndInsights();
    const blob = new Blob([buildCsvContent(snapshot, aiInsights)], { type: 'text/csv;charset=utf-8;' });
    triggerBlobDownload(blob, getFilename('csv'));
  }, [getFilename, resolveSnapshotAndInsights]);

  const handleDownloadExcel = useCallback(async () => {
    const { snapshot, aiInsights } = await resolveSnapshotAndInsights();
    const htmlContent = buildExcelContent(snapshot, aiInsights);
    const template = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Dashboard</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body>${htmlContent}</body></html>`;
    const blob = new Blob([template], { type: 'application/vnd.ms-excel' });
    triggerBlobDownload(blob, getFilename('xls'));
  }, [getFilename, resolveSnapshotAndInsights]);

  const handleDownloadPDF = useCallback(async () => {
    const { snapshot, snapshotKey, aiInsights } = await resolveSnapshotAndInsights();
    const filename = getFilename('pdf');
    const pdfCacheKey = buildDashboardPdfCacheKey(snapshotKey, aiInsights);
    const cachedPdfBytes = getCachedDashboardPdfBytes(pdfCacheKey);
    if (cachedPdfBytes) {
      triggerBlobDownload(new Blob([cachedPdfBytes], { type: 'application/pdf' }), filename);
      return;
    }

    const { jsPDF, autoTableRunner } = await loadDashboardPdfModules();
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    buildPdfReport(doc, snapshot, aiInsights, autoTableRunner);
    const pdfBytes = doc.output('arraybuffer') as ArrayBuffer;
    setCachedDashboardPdfBytes(pdfCacheKey, pdfBytes);
    triggerBlobDownload(new Blob([pdfBytes], { type: 'application/pdf' }), filename);
  }, [getFilename, resolveSnapshotAndInsights]);

  return { handleDownloadCSV, handleDownloadExcel, handleDownloadPDF };
};
