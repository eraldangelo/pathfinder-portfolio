import type { Lead } from '../../../leads/leads-page/LeadsPage';

export interface ArchiveLeadRow {
    id: string;
    caseId: string;
    fullName: string;
    branch: string;
    email: string;
    phoneCountryCode: string;
    phoneNumber: string;
    visaRefusal: 'Yes' | 'No';
    leadStatus: string;
    submittedAt: Date | null;
    assignedCounsellor: string;
    sourceType: 'Lead' | 'Assessment Form';
    archivedYear: number | null;
    archivedAt: Date | null;
    modalLead: Lead;
}

export interface ArchiveApplicationRow {
    id: string;
    leadId: string;
    applicantName: string;
    branch: string;
    schoolName: string;
    status: string;
    statusChanged: Date | null;
    archivedYear: number | null;
    archivedAt: Date | null;
}

export type ArchiveTab = 'leads' | 'applications';
