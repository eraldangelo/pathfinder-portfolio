import type { DailyLog } from '../../../../data/timesheet';

export type BranchValue = 'Makati' | 'Davao' | 'Cebu' | 'Pampanga';
export type CutoffValue = '1-15' | '16-30';

export interface BranchOption {
    label: string;
    value: BranchValue;
    aliases: string[];
}

export interface StaffReport {
    uid: string;
    name: string;
    role: string;
    branch: string;
    logs: DailyLog[];
    presentDays: number;
    absentDays: number;
    leaveDays: number;
    offsetDays: number;
    pendingDays: number;
    totalMinutes: number;
}
