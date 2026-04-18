import type { ConsultationStatus } from '../../leads-page/LeadsPageTypes';

export const CONSULTATION_STATUS_OPTIONS: ConsultationStatus[] = [
    'Genuine Student',
    'Consulted',
    'Still undecided',
    'Pending Documents',
    'No Show',
    'Non-Genuine Student',
];

export const MIN_CONSULTATION_NOTES_LENGTH = 150;

export const normalizeConsultationStatus = (value?: string | null): ConsultationStatus => {
    const trimmed = (value ?? '').trim();
    if (!trimmed) return 'Genuine Student';
    return CONSULTATION_STATUS_OPTIONS.includes(trimmed as ConsultationStatus)
        ? (trimmed as ConsultationStatus)
        : 'Genuine Student';
};

export const countCharacters = (value?: string | null) => {
    const trimmed = (value ?? '').trim();
    return trimmed.length;
};

export const buildConsultationStatusLogMessage = (
    t: (key: string, options?: { [key: string]: string | number } | string) => string,
    leadName: string,
    statusValue: ConsultationStatus,
) => {
    const translated = t('logConsultationStatusChanged', { name: leadName, status: statusValue });
    return translated === 'logConsultationStatusChanged'
        ? `${leadName}'s consultation status has been changed to ${statusValue}.`
        : translated;
};

export const buildConsultationNotesLogMessage = (
    t: (key: string, options?: { [key: string]: string | number } | string) => string,
    leadName: string,
) => {
    const translated = t('logConsultationNotesUpdated', { name: leadName });
    return translated === 'logConsultationNotesUpdated'
        ? `updated consultation notes for ${leadName}.`
        : translated;
};
