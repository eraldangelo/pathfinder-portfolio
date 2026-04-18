import type { ArchiveLeadRow } from '../../../archive/components/archive-page/types';
import type { LeadRow, LeadsDatasetTab } from '../LeadsPageTypes';

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatDateTime = (value: Date | null | undefined): string =>
  value instanceof Date && !Number.isNaN(value.getTime())
    ? value.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

const buildXlsTable = (title: string, headers: string[], rows: Array<Array<string | number>>) => {
  const head = headers.map((header) => `<th>${escapeHtml(String(header))}</th>`).join('');
  const body = rows
    .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(String(cell ?? ''))}</td>`).join('')}</tr>`)
    .join('');

  return `
        <style>
            body { font-family: "Segoe UI", Tahoma, Arial, sans-serif; color: #1f2937; padding: 20px; }
            h2 { color: #004097; margin: 0 0 12px 0; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #d1d5db; padding: 8px 10px; text-align: left; font-size: 12px; }
            th { background: #eff6ff; color: #1e3a8a; font-weight: 700; }
            tr:nth-child(even) td { background: #f8fafc; }
        </style>
        <h2>${escapeHtml(title)}</h2>
        <table>
            <thead><tr>${head}</tr></thead>
            <tbody>${body}</tbody>
        </table>
    `;
};

const buildCurrentLeadsXls = (rows: LeadRow[]) =>
  buildXlsTable(
    'Current Leads',
    [
      'Submitted Timestamp',
      'Case ID',
      'Full Name',
      'Email Address',
      'Mobile Number',
      'Visa Refused',
      'Branch',
      'Assigned Counsellor',
      'Admin Status',
      'Consultation Status',
      'Application Status',
      'Source',
    ],
    rows.map((row) => [
      formatDateTime(row.submittedAt),
      row.caseId,
      row.fullName,
      row.email,
      `${String(row.phoneCountryCode || '').trim()} ${String(row.phoneNumber || '').trim()}`.trim(),
      row.visaRefusal,
      row.branch,
      row.assignedCounsellor,
      row.adminStatus || row.leadStatus || 'New Lead',
      row.consultationStatus || '',
      row.applicationStatus || '',
      row.isSubmission ? 'Assessment Form' : 'Lead',
    ]),
  );

const buildArchivedLeadsXls = (rows: ArchiveLeadRow[]) =>
  buildXlsTable(
    'Archived Leads',
    [
      'Submitted Timestamp',
      'Case ID',
      'Full Name',
      'Email Address',
      'Mobile Number',
      'Visa Refused',
      'Branch',
      'Assigned Counsellor',
      'Lead Status',
      'Archived On',
    ],
    rows.map((row) => [
      formatDateTime(row.submittedAt),
      row.caseId,
      row.fullName,
      row.email,
      `${String(row.phoneCountryCode || '').trim()} ${String(row.phoneNumber || '').trim()}`.trim(),
      row.visaRefusal,
      row.branch,
      row.assignedCounsellor,
      row.leadStatus || 'Archived',
      formatDateTime(row.archivedAt),
    ]),
  );

const triggerXlsDownload = (htmlContent: string, filename: string, sheetName: string) => {
  const safeSheetName = String(sheetName || 'Sheet1').replace(/[\\/?*:[\]]/g, '').slice(0, 31) || 'Sheet1';
  const workbookTemplate = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>${escapeHtml(safeSheetName)}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body>${htmlContent}</body></html>`;
  const blob = new Blob([workbookTemplate], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

interface DownloadLeadsAsXlsParams {
  activeDatasetTab: LeadsDatasetTab;
  sortedLeads: LeadRow[];
  archivedLeads: ArchiveLeadRow[];
  archiveSelectedYear: string;
  archiveSelectedBranch: string;
  showPopup: (message: string) => void;
  t: (key: string, defaultValue?: string) => string;
}

export const downloadLeadsAsXls = ({
  activeDatasetTab,
  sortedLeads,
  archivedLeads,
  archiveSelectedYear,
  archiveSelectedBranch,
  showPopup,
  t,
}: DownloadLeadsAsXlsParams) => {
  if (activeDatasetTab === 'archived') {
    if (archivedLeads.length === 0) {
      showPopup(t('archiveNoRowsForDownload', 'No archived data found for this filter.'));
      return;
    }

    const xlsContent = buildArchivedLeadsXls(archivedLeads);
    const yearSuffix = archiveSelectedYear === 'all' ? 'all-years' : archiveSelectedYear;
    const branchSuffix =
      archiveSelectedBranch === 'all'
        ? 'all-branches'
        : archiveSelectedBranch.replace(/\s+/g, '-').toLowerCase();
    triggerXlsDownload(xlsContent, `archived-leads-${yearSuffix}-${branchSuffix}.xls`, 'ArchivedLeads');
    return;
  }

  if (sortedLeads.length === 0) {
    showPopup(t('noLeadsFound', 'No leads found.'));
    return;
  }

  const xlsContent = buildCurrentLeadsXls(sortedLeads);
  const dateSuffix = new Date().toISOString().slice(0, 10);
  triggerXlsDownload(xlsContent, `current-leads-${dateSuffix}.xls`, 'CurrentLeads');
};
