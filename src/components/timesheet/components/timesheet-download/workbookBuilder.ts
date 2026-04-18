import type { User } from '../../../../types';
import type { CutoffValue, StaffReport } from './types';
import { createStaffSheets, createSummarySheet } from './workbookSections';

interface BuildTimesheetWorkbookParams {
    user: User;
    staffReports: StaffReport[];
    branchLabel: string;
    monthLabel: string;
    selectedCutoff: CutoffValue;
    selectedYear: number;
    periodStart: Date;
    periodEnd: Date;
}

const createGeneratedTimestamp = () =>
    new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });

export const buildTimesheetWorkbookBuffer = async ({
    user,
    staffReports,
    branchLabel,
    monthLabel,
    selectedCutoff,
    selectedYear,
    periodStart,
    periodEnd,
}: BuildTimesheetWorkbookParams) => {
    const generatedAt = createGeneratedTimestamp();
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Pathfinder System';
    workbook.lastModifiedBy = user.displayName || user.email || 'System';
    workbook.created = new Date();
    workbook.modified = new Date();

    createSummarySheet({
        workbook,
        user,
        staffReports,
        branchLabel,
        monthLabel,
        selectedCutoff,
        selectedYear,
        generatedAt,
    });
    createStaffSheets({
        workbook,
        staffReports,
        monthLabel,
        selectedCutoff,
        selectedYear,
        periodStart,
        periodEnd,
        generatedAt,
    });

    const workbookBinary = await workbook.xlsx.writeBuffer();
    const fileName = `Timesheet_${branchLabel}_${monthLabel}_${selectedCutoff}_${selectedYear}.xlsx`
        .replace(/\s+/g, '_');

    return {
        workbookBinary,
        fileName,
    };
};
