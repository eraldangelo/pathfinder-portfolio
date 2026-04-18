'use client';

import { useCallback, useState } from 'react';
import type { ApplicationInfo } from '@/data/applications';
import type { AssessmentSubmission, User } from '@/types';
import type { Lead } from '@/components/leads/leads-page/LeadsPage';
import type { TrendData } from '@/components/dashboard/types/types';
import DashboardHeader from '@/components/dashboard/components/DashboardHeader';
import { useDashboardDownloads } from '@/components/dashboard/hooks/useDashboardDownloads';

const SMOKE_USER: User = {
  uid: 'smoke-user',
  email: 'smoke-user@example.com',
  displayName: 'Smoke User',
  firstName: 'Smoke',
  lastName: 'User',
  preferredName: 'Smoke',
  dob: null,
  photoURL: null,
  branch: 'Philippines Overall',
};

const EMPTY_LEADS: Lead[] = [];
const EMPTY_APPLICATIONS: ApplicationInfo[] = [];
const EMPTY_SUBMISSIONS: AssessmentSubmission[] = [];
const EMPTY_GENUINE_IDS = new Set<string>();
const EMPTY_TREND_DATA: TrendData = {
  Overall: [],
  'Philippines Overall': [],
};

const waitForMs = (ms: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });

export default function DashboardDownloadSmokeClient() {
  const [status, setStatus] = useState('idle');
  const [pdfRuns, setPdfRuns] = useState(0);
  const [excelRuns, setExcelRuns] = useState(0);
  const [lastDurationMs, setLastDurationMs] = useState(0);
  const [lastFileName, setLastFileName] = useState('');

  const { handleDownloadPDF, handleDownloadExcel } = useDashboardDownloads({
    user: SMOKE_USER,
    leads: EMPTY_LEADS,
    applications: EMPTY_APPLICATIONS,
    assessmentSubmissions: EMPTY_SUBMISSIONS,
    genuineSubmissionIds: EMPTY_GENUINE_IDS,
    selectedFunnelLocation: 'Philippines Overall',
    selectedFunnelMonth: 'all',
    selectedFunnelYear: 'all',
    selectedLocation: 'Overall',
    selectedQuarter: 'Q1 2026',
    trendData: EMPTY_TREND_DATA,
  });

  const onDownloadPDF = useCallback(async () => {
    setStatus('pdf-running');
    const startedAt = performance.now();
    await waitForMs(220);
    await handleDownloadPDF();
    setPdfRuns((value) => value + 1);
    setLastDurationMs(Math.round(performance.now() - startedAt));
    setLastFileName('pdf');
    setStatus('idle');
  }, [handleDownloadPDF]);

  const onDownloadExcel = useCallback(async () => {
    setStatus('excel-running');
    await handleDownloadExcel();
    setExcelRuns((value) => value + 1);
    setLastFileName('excel');
    setStatus('idle');
  }, [handleDownloadExcel]);

  return (
    <main className="min-h-screen bg-gray-50 p-6" data-testid="smoke-dashboard-download-page">
      <DashboardHeader
        titleAnimationClasses="opacity-100"
        role="Developer"
        onDownloadPDF={onDownloadPDF}
        onDownloadExcel={onDownloadExcel}
      />
      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800">Dashboard Download Smoke Harness</h2>
        <p className="mt-2 text-sm text-gray-600">
          Non-production route used only for Playwright download-wiring checks.
        </p>
        <dl className="mt-4 grid gap-2 text-sm text-gray-700">
          <div>
            <dt className="font-medium">Status</dt>
            <dd data-testid="smoke-dashboard-status">{status}</dd>
          </div>
          <div>
            <dt className="font-medium">PDF runs</dt>
            <dd data-testid="smoke-dashboard-pdf-runs">{pdfRuns}</dd>
          </div>
          <div>
            <dt className="font-medium">Excel runs</dt>
            <dd data-testid="smoke-dashboard-excel-runs">{excelRuns}</dd>
          </div>
          <div>
            <dt className="font-medium">Last duration (ms)</dt>
            <dd data-testid="smoke-dashboard-last-duration">{lastDurationMs}</dd>
          </div>
          <div>
            <dt className="font-medium">Last file type</dt>
            <dd data-testid="smoke-dashboard-last-file">{lastFileName || 'none'}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
