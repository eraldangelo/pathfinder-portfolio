import type { ApplicationInfo, ApplicationStatus } from '../../../data/applications';
import type { PersonnelWithDetails } from '../../../data/personnel';
import type { AssessmentSubmission, User } from '../../../types';
import type { StudentInfoTab } from '../types/studentInfoTab';

export type LogEntry = {
    id: string;
    timestamp: Date;
    author: string;
    action: string;
};

export interface Note {
    id: string;
    subject: string;
    content: string;
    author: string;
    timestamp: Date;
}

export type LeadStatus = 'New Lead' | 'Consulted' | 'For Follow Up' | 'No Show';
export type AdminStatus =
    | 'New Lead'
    | 'No Show'
    | 'No Response'
    | 'Undecided'
    | 'Genuine'
    | 'Non-Genuine'
    | 'Destination Not Offered'
    | 'Duplicate';
export type ConsultationStatus =
    | 'Genuine Student'
    | 'Consulted'
    | 'Still undecided'
    | 'Pending Documents'
    | 'Submitted Application'
    | 'No Show'
    | 'Non-Genuine Student';

export type Lead = {
    id: string;
    leadDocPath?: string;
    isArchived?: boolean;
    fullName: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    nativeName?: string;
    currentLocation?: string;
    isUsPassportHolder?: boolean;
    hasWorked?: boolean;
    englishTest?: string;
    studyDestinations?: string;
    preferredCoursesOfStudy?: string;
    plannedStudyStart?: string;
    email: string;
    phoneCountryCode: string;
    phoneNumber: string;
    citizenship: string;
    visaRefusal: 'Yes' | 'No';
    branch: string;
    assignedCounsellor: string;
    assignedCounsellorUid?: string;
    resumeStoragePath?: string;
    caseId: string;
    submittedAt?: Date | null;
    dob: string;
    maritalStatus: 'Never Married' | 'Engaged' | 'De Facto' | 'Married' | 'Divorced' | 'Separated' | 'Widowed';
    passportNumber?: string;
    passportIssueDate?: string;
    passportExpiry?: string;
    secondNationality?: string;
    presentAddress?: string;
    permanentAddress?: string;
    isPermanentAddressSameAsPresent?: boolean;
    notes?: Note[];
    logs?: LogEntry[];
    highestEducationLevel?: string;
    fieldOfStudy?: string;
    mostRecentSchool?: string;
    currentOccupation?: string;
    companyName?: string;
    leadStatus: LeadStatus;
    adminStatus?: AdminStatus;
    adminNotes?: string;
    consultationStatus?: ConsultationStatus;
    applicationStatus?: ApplicationStatus;
    consultationNotes?: string;
    isSubmission?: boolean;
};

export type SortableKeys = 'caseId' | 'fullName' | 'email' | 'branch' | 'assignedCounsellor' | 'leadStatus';
export type SortDirection = 'ascending' | 'descending';
export type SortConfig = { key: SortableKeys; direction: SortDirection } | null;

export type LeadRow = Lead & { isSubmission?: boolean };
export type LeadsDatasetTab = 'current' | 'archived';

export interface LeadsPageProps {
    isReady: boolean;
    user: User;
    role: string;
    leads: Lead[];
    assessmentSubmissions: AssessmentSubmission[];
    applications: ApplicationInfo[];
    allPersonnel: PersonnelWithDetails[];
    showPopup: (message: string) => void;
    initialViewTab?: LeadsDatasetTab;
    onRequestTransfer: (lead: Lead) => void;
    onOpenStudentProfile: (leadId: string, targetTab?: StudentInfoTab, leadDocPath?: string) => void;
    onUpdateLead: (updatedLead: Lead) => void;
    onAddLogEntry: (studentId: string, logMessage: string) => void;
}
