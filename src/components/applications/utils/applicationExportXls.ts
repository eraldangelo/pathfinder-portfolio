import type { ApplicationInfo } from '../../../data/applications';
import { getApplicationProgressPercentage } from './applicationProgress';

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
        .map(
            (row) =>
                `<tr>${row
                    .map((cell) => `<td>${escapeHtml(String(cell ?? ''))}</td>`)
                    .join('')}</tr>`,
        )
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

const triggerXlsDownload = (htmlContent: string, filename: string, sheetName: string) => {
    const safeSheetName = String(sheetName || 'Sheet1')
        .replace(/[\\/?*:[\]]/g, '')
        .slice(0, 31) || 'Sheet1';
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

interface DownloadApplicationsXlsParams {
    applications: ApplicationInfo[];
    selectedViewTab: 'active' | 'finished';
    studentCaseIdMap: Map<string, string>;
    resolveApplicationCounsellor: (application: ApplicationInfo) => string;
}

export const downloadApplicationsXls = ({
    applications,
    selectedViewTab,
    studentCaseIdMap,
    resolveApplicationCounsellor,
}: DownloadApplicationsXlsParams) => {
    const xlsContent = buildXlsTable(
        selectedViewTab === 'finished' ? 'Finished Applications' : 'Active Applications',
        [
            'Case ID',
            'Applicant',
            'Date of Birth',
            'Provider',
            'Course',
            'Assigned Counsellor',
            'Status',
            'Status Changed',
            'Progress',
            'Branch',
        ],
        applications.map((application) => [
            studentCaseIdMap.get(application.studentId) || String(application.caseId || '').trim() || '--',
            application.applicantName,
            application.applicantDob,
            application.schoolCourses.map((item) => item.schoolName).join(' / '),
            application.schoolCourses.flatMap((item) => item.courses.map((course) => course.programName)).join(' / '),
            resolveApplicationCounsellor(application) || '--',
            application.status,
            formatDateTime(application.statusChanged?.toDate?.()),
            `${Math.round(getApplicationProgressPercentage(application.status))}%`,
            application.branch,
        ]),
    );

    const dateSuffix = new Date().toISOString().slice(0, 10);
    const tabSuffix = selectedViewTab === 'finished' ? 'finished' : 'active';
    triggerXlsDownload(xlsContent, `applications-${tabSuffix}-${dateSuffix}.xls`, 'Applications');
};
