import type { DailyLog } from '../../../../data/timesheet';

export const normalize = (value?: string | null) =>
    String(value ?? '')
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase();

export const formatMinutes = (minutes: number) => {
    const safe = Math.max(0, Math.round(minutes));
    const hours = Math.floor(safe / 60);
    const mins = safe % 60;
    return `${hours}h ${mins}m`;
};

export const parseTotalHoursToMinutes = (value?: string | null) => {
    const source = String(value ?? '').trim();
    if (!source) return 0;
    const match = source.match(/(\d+)\s*h\s*(\d+)\s*m/i);
    if (match) {
        const hours = Number(match[1] || 0);
        const minutes = Number(match[2] || 0);
        return hours * 60 + minutes;
    }
    const numeric = Number(source);
    if (!Number.isFinite(numeric)) return 0;
    return Math.round(numeric * 60);
};

export const toBranchDisplay = (branch?: string | null) => {
    const branchKey = normalize(branch);
    if (branchKey === 'manila') return 'Makati';
    return String(branch ?? '').trim();
};

export const toDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const formatSheetDate = (date: Date) =>
    date
        .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        .replace(/\s+/g, '-');

export const buildDateRange = (start: Date, end: Date) => {
    const dates: Date[] = [];
    const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endAt = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    while (cursor <= endAt) {
        dates.push(new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate()));
        cursor.setDate(cursor.getDate() + 1);
    }
    return dates;
};

export const toSafeSheetName = (rawName: string, usedNames: Set<string>) => {
    const base = rawName.replace(/[\\/?*[\]:]/g, '').trim() || 'Sheet';
    const initial = base.slice(0, 31) || 'Sheet';
    if (!usedNames.has(initial)) {
        usedNames.add(initial);
        return initial;
    }

    let suffix = 2;
    while (suffix <= 999) {
        const suffixText = ` (${suffix})`;
        const candidate = `${initial.slice(0, Math.max(1, 31 - suffixText.length))}${suffixText}`;
        if (!usedNames.has(candidate)) {
            usedNames.add(candidate);
            return candidate;
        }
        suffix += 1;
    }

    const fallback = `Sheet ${usedNames.size + 1}`.slice(0, 31);
    usedNames.add(fallback);
    return fallback;
};

export const THIN_BORDER = {
    top: { style: 'thin', color: { argb: 'FFBFC7D5' } },
    left: { style: 'thin', color: { argb: 'FFBFC7D5' } },
    bottom: { style: 'thin', color: { argb: 'FFBFC7D5' } },
    right: { style: 'thin', color: { argb: 'FFBFC7D5' } },
} as const;

export const applyHeaderCellStyle = (cell: any) => {
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF102A56' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCEBFF' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = THIN_BORDER;
};

export const applyDataCellStyle = (cell: any, horizontal: 'left' | 'center' = 'left') => {
    cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF111827' } };
    cell.alignment = { vertical: 'middle', horizontal, wrapText: true };
    cell.border = THIN_BORDER;
};

export const buildStaffSummaryFromLogs = (logs: DailyLog[]) =>
    logs.reduce(
        (acc, log) => {
            if (log.status === 'Present') acc.presentDays += 1;
            if (log.status === 'Absent') acc.absentDays += 1;
            if (log.status === 'On Leave') acc.leaveDays += 1;
            if (log.status === 'Offset') acc.offsetDays += 1;
            if (log.status === 'Pending') acc.pendingDays += 1;
            acc.totalMinutes += parseTotalHoursToMinutes(log.totalHours);
            return acc;
        },
        {
            presentDays: 0,
            absentDays: 0,
            leaveDays: 0,
            offsetDays: 0,
            pendingDays: 0,
            totalMinutes: 0,
        }
    );
