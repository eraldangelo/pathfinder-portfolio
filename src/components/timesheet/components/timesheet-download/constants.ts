import type { BranchOption, CutoffValue } from './types';

export const BRANCH_OPTIONS: BranchOption[] = [
    { label: 'Makati', value: 'Makati', aliases: ['makati', 'manila'] },
    { label: 'Davao', value: 'Davao', aliases: ['davao'] },
    { label: 'Cebu', value: 'Cebu', aliases: ['cebu'] },
    { label: 'Pampanga', value: 'Pampanga', aliases: ['pampanga'] },
];

export const MONTH_OPTIONS = [
    { value: 0, label: 'January' },
    { value: 1, label: 'February' },
    { value: 2, label: 'March' },
    { value: 3, label: 'April' },
    { value: 4, label: 'May' },
    { value: 5, label: 'June' },
    { value: 6, label: 'July' },
    { value: 7, label: 'August' },
    { value: 8, label: 'September' },
    { value: 9, label: 'October' },
    { value: 10, label: 'November' },
    { value: 11, label: 'December' },
] as const;

export const CUTOFF_OPTIONS: Array<{ value: CutoffValue; label: string }> = [
    { value: '1-15', label: '1 - 15' },
    { value: '16-30', label: '16 - 30' },
];
