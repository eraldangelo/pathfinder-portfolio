import type { ApplicationStatus } from '../../../data/applications';

export const APPLICATION_STAGE_DEFINITIONS: { name: string; statuses: ApplicationStatus[] }[] = [
    { name: 'Submitted Application', statuses: ['Submitted', 'Submitted Application'] },
    { name: 'More Information Required', statuses: ['More Information Required'] },
    { name: 'Offer', statuses: ['Conditional Offer', 'Unconditional Offer'] },
    { name: 'Payment Processed', statuses: ['Payment Processed'] },
    { name: 'Received CoE/LoA', statuses: ['CoE/LoA Received'] },
    { name: 'Visa Lodge', statuses: ['Visa Lodged'] },
    { name: 'Visa Result', statuses: ['Visa Granted', 'Visa Refused', 'Visa Withdrawn'] },
    { name: 'End Application', statuses: ['Pre-Departure Orientation', 'Refund Processing', 'Withdrawn', 'Application Ended'] },
];

const STATUS_TO_STAGE_INDEX: Record<string, number> = {};
APPLICATION_STAGE_DEFINITIONS.forEach((stage, index) => {
    stage.statuses.forEach((status) => {
        STATUS_TO_STAGE_INDEX[status] = index;
    });
});

const TERMINAL_STATUSES = new Set<ApplicationStatus>([
    'Visa Refused',
    'Visa Withdrawn',
    'Withdrawn',
    'Application Ended',
    'Refund Processing',
]);

export const getApplicationStageIndex = (status: ApplicationStatus | string): number =>
    STATUS_TO_STAGE_INDEX[String(status || '').trim()] ?? -1;

export const getApplicationProgressPercentage = (status: ApplicationStatus | string): number => {
    const normalizedStatus = String(status || '').trim() as ApplicationStatus;
    const stageIndex = getApplicationStageIndex(normalizedStatus);
    const totalStages = APPLICATION_STAGE_DEFINITIONS.length;

    if (TERMINAL_STATUSES.has(normalizedStatus)) {
        return 100;
    }

    return stageIndex >= 0 ? ((stageIndex + 1) / totalStages) * 100 : 0;
};

export const isFinishedApplicationStatus = (status: ApplicationStatus | string): boolean =>
    getApplicationProgressPercentage(status) >= 100;

