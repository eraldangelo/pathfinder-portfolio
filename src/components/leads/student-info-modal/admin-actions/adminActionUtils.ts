import type { AdminStatus } from '../../leads-page/LeadsPageTypes';

export const ADMIN_STATUS_OPTIONS: AdminStatus[] = [
    'New Lead',
    'No Show',
    'No Response',
    'Undecided',
    'Genuine',
    'Non-Genuine',
    'Destination Not Offered',
    'Duplicate',
];

export const FINAL_ADMIN_STATUSES: AdminStatus[] = [
    'Genuine',
    'Non-Genuine',
    'Destination Not Offered',
    'Duplicate',
];

export const MIN_ADMIN_NOTES_LENGTH = 100;

const normalizeValue = (value?: string | null) => (value ?? '').trim().replace(/\s+/g, ' ').toLowerCase();

export const normalizeAdminStatus = (value?: string | null): AdminStatus => {
    const trimmed = (value ?? '').trim();
    if (!trimmed) return 'New Lead';
    return ADMIN_STATUS_OPTIONS.includes(trimmed as AdminStatus) ? (trimmed as AdminStatus) : 'New Lead';
};

export const isFinalAdminStatus = (value?: string | null) => FINAL_ADMIN_STATUSES.includes(normalizeAdminStatus(value));

export const normalizeBranchKey = (value?: string | null) => {
    const normalized = normalizeValue(value);
    if (normalized === 'makati') return 'manila';
    return normalized;
};

export const isOperationsRole = (value?: string | null) => {
    const role = normalizeValue(value);
    return role === 'operations' || role.startsWith('operations') || role.includes('operations');
};

export const isBranchManagerRole = (value?: string | null) => {
    const role = normalizeValue(value);
    return role === 'branch manager' || role.includes('branch manager');
};

export const buildStatusLogMessage = (
    t: (key: string, options?: { [key: string]: string | number } | string) => string,
    leadName: string,
    statusValue: AdminStatus
) => {
    const translated = t('logLeadStatusChanged', { name: leadName, status: statusValue });
    return translated === 'logLeadStatusChanged'
        ? `${leadName}'s status has been changed to ${statusValue}.`
        : translated;
};

export const buildGenuineToastMessage = (leadName: string, counsellorName: string) =>
    `[[${leadName}]]'s status has been changed to Genuine and endorsed to [[${counsellorName}]].`;
