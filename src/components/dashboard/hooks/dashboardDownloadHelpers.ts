import type { DashboardAiInsights } from '../utils/dashboardAiInsights';
import type { DashboardDownloadSnapshot } from '../utils/dashboardDownloadSnapshot';
import { ALL_MONTHS_VALUE, ALL_QUARTERS_VALUE, ALL_YEARS_VALUE } from '../utils/funnelFilters';

const FILE_MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const REPORT_BASELINE_YEAR = 2025;

export const DASHBOARD_AI_FETCH_TIMEOUT_MS = 6000;

export type PdfAutoTableRunner = (docRef: any, options: any) => void;

type PdfModuleLoadResult = {
  jsPDF: typeof import('jspdf').default;
  autoTableRunner: PdfAutoTableRunner;
};

let pdfModulePromise: Promise<PdfModuleLoadResult> | null = null;

const sanitizeFilenamePart = (value: string) =>
  value
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const resolveQuarterLabel = (quarter: string) => {
  if (quarter === 'q1') return 'Q1';
  if (quarter === 'q2') return 'Q2';
  if (quarter === 'q3') return 'Q3';
  if (quarter === 'q4') return 'Q4';
  return quarter;
};

const resolveFilePeriodLabel = (month: string, quarter: string, year: string) => {
  const monthIndex = Number(month);
  const monthLabel = FILE_MONTH_LABELS[monthIndex] ?? month;
  const quarterLabel = resolveQuarterLabel(quarter);

  if (month === ALL_MONTHS_VALUE && quarter === ALL_QUARTERS_VALUE && year === ALL_YEARS_VALUE) {
    return `Jan ${REPORT_BASELINE_YEAR} to present`;
  }
  if (month === ALL_MONTHS_VALUE && quarter !== ALL_QUARTERS_VALUE && year === ALL_YEARS_VALUE) {
    return `${quarterLabel} ${REPORT_BASELINE_YEAR} to present`;
  }
  if (month === ALL_MONTHS_VALUE && quarter !== ALL_QUARTERS_VALUE) {
    return `${quarterLabel} ${year}`;
  }
  if (month === ALL_MONTHS_VALUE) {
    return `Jan ${year} to Dec ${year}`;
  }
  if (year === ALL_YEARS_VALUE) {
    return `${monthLabel} ${REPORT_BASELINE_YEAR} to present`;
  }

  return `${monthLabel} ${year}`;
};

export function buildDashboardDownloadFilename(args: {
  extension: string;
  selectedFunnelLocation: string;
  selectedFunnelMonth: string;
  selectedFunnelQuarter: string;
  selectedFunnelYear: string;
}) {
  const { extension, selectedFunnelLocation, selectedFunnelMonth, selectedFunnelQuarter, selectedFunnelYear } = args;
  const branchLabel = sanitizeFilenamePart(selectedFunnelLocation || 'Philippines Overall');
  const periodLabel = sanitizeFilenamePart(resolveFilePeriodLabel(selectedFunnelMonth, selectedFunnelQuarter, selectedFunnelYear));
  return `Dashboard ${branchLabel} Report ${periodLabel}.${extension}`;
}

export function triggerBlobDownload(blob: Blob, filename: string) {
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1200);
}

function resolveAutoTableRunner(autoTableModule: unknown): PdfAutoTableRunner {
  const moduleValue = autoTableModule as { default?: unknown; autoTable?: unknown };
  const autoTableImpl = moduleValue.default || moduleValue.autoTable;
  if (typeof autoTableImpl !== 'function') {
    throw new Error('AutoTable plugin is unavailable.');
  }

  return (docRef: any, options: any) => {
    (autoTableImpl as (docArg: any, optionsArg: any) => void)(docRef, options);
  };
}

export async function loadDashboardPdfModules(): Promise<PdfModuleLoadResult> {
  if (!pdfModulePromise) {
    pdfModulePromise = Promise.all([import('jspdf'), import('jspdf-autotable')]).then(
      ([jspdfModule, autoTableModule]) => ({
        jsPDF: jspdfModule.default,
        autoTableRunner: resolveAutoTableRunner(autoTableModule),
      }),
    );
  }

  return pdfModulePromise;
}

export function preloadDashboardPdfModules() {
  void loadDashboardPdfModules().catch(() => undefined);
}

export function buildDashboardSnapshotKey(snapshot: DashboardDownloadSnapshot): string {
  try {
    return JSON.stringify(snapshot);
  } catch {
    return 'snapshot-fallback';
  }
}

export function buildDashboardPdfCacheKey(snapshotKey: string, insights: DashboardAiInsights): string {
  try {
    return `${snapshotKey}::${JSON.stringify(insights)}`;
  } catch {
    return `${snapshotKey}::insights-fallback`;
  }
}
