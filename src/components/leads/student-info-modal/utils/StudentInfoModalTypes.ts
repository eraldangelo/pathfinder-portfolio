import type { ApplicationInfo } from '../../../../data/applications';
import type { PersonnelWithDetails } from '../../../../data/personnel';
import type { User } from '../../../../types';
import type { Lead } from '../../leads-page/LeadsPageTypes';
import type { StudentInfoTab } from '../../types/studentInfoTab';

export interface ApplicationData {
    country: string;
    schools: string[];
    isPackage: boolean | null;
    programsBySchool: Record<string, { name: string; intakeDate: string }[]>;
    notes: string;
    assistedBy: string;
}

export type Tab = StudentInfoTab;

export interface StudentInfoModalProps {
    lead: Lead;
    user: User;
    allPersonnel: PersonnelWithDetails[];
    onClose: () => void;
    onMinimize: () => void;
    onUpdate: (updatedLead: Lead) => void;
    showPopup: (message: string) => void;
    userRole: string;
    applications: ApplicationInfo[];
    initialTab?: Tab;
    onAddNote: (studentId: string, subject: string, content: string) => void;
    onAddLogEntry: (studentId: string, logMessage: string) => void;
    onOpenApplicationDetail: (applicationId: string) => void;
}
