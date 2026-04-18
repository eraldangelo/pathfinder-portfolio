import type { ApplicationInfo } from '../../../data/applications';
import type { PersonnelWithDetails } from '../../../data/personnel';
import type {
    AssessmentSubmission,
    Theme,
    TimeLogEntry,
    TimeTrackingStatus,
    User,
    View,
} from '../../../types';
import type { Lead } from '../../leads/leads-page/LeadsPage';
import type { StudentInfoTab } from '../../leads/types/studentInfoTab';
import type { SidebarNavItem } from '../AppShell.types';
import type { ConfirmModalState } from '../hooks/useConfirmModal';
import type { NotificationItem, PersistentNotificationItem } from '../hooks/useNotifications';
import type { useAppUiState } from '../hooks/useAppUiState';
import type { BranchChangeRequestFormData } from '../../../types/branchChangeRequest';

export type AppUiState = ReturnType<typeof useAppUiState>;

export interface AppShellContainerNotificationsState {
    persistentNotifications: PersistentNotificationItem[];
    notifications: NotificationItem[];
    unreadCount: number;
    clearPersistentNotifications: () => void;
    removeNotification: (id: number) => void;
}

export interface AppShellContainerData {
    leads: Lead[];
    assessmentSubmissions: AssessmentSubmission[];
    genuineSubmissionIds: Set<string>;
    applications: ApplicationInfo[];
    allPersonnel: PersonnelWithDetails[];
    openApplication: ApplicationInfo | null;
    openLeadForApplication: Lead | null;
    openStudentLead: Lead | null;
    openStudentModalId: string | null;
    applicationsForOpenStudent: ApplicationInfo[];
    minimizedLeads: Array<Lead | undefined>;
    modalInitialTab?: StudentInfoTab;
}

export interface AppShellContainerTimeTracking {
    timeTrackingStatus: TimeTrackingStatus;
    timeLog: TimeLogEntry[];
    hasTimedInToday: boolean;
    hasTakenLunchToday: boolean;
    promptTimeIn: () => void;
    promptTimeOut: () => void;
    handleStartLunch: () => void;
    handleEndLunch: () => void;
}

export interface AppShellContainerHandlers {
    handleLogout: () => void;
    closeConfirm: () => void;
    updateLead: (lead: Lead) => void;
    addLogEntry: (studentId: string, logMessage: string) => void;
    addNote: (studentId: string, subject: string, content: string) => void;
    updateApplication: (application: ApplicationInfo) => void;
    handleStatusUpdateWithNote: (studentId: string, newStatus: string, providerName: string, noteContent: string) => void;
    showPopup: (message: string, meta?: { eventKey?: string; persist?: boolean }) => void;
    handleProfileUpdate: (newPhotoURL?: string, updates?: Partial<User>) => void;
    handleSubmitTransfer: (data: { leadId: string; reason: string; newBranch: string; newCounsellor?: string }) => void;
    handleRequestLeaveSubmit: (data: { fromDate: string; toDate: string; dayCount: number; reason: string }) => void;
    handleRequestOffsetSubmit: (data: { date: string; hours: number; reason: string; mode?: 'add' | 'use'; startTime?: string; endTime?: string }) => void;
    onLoginAgain: () => void;
    onBranchChangeRequestSubmit: (data: BranchChangeRequestFormData) => void | Promise<void>;
}

export interface AppShellContainerProps {
    user: User;
    userRole: string;
    view: View;
    theme: Theme;
    toggleTheme: () => void;
    isReady: boolean;
    ui: AppUiState;
    navItems: SidebarNavItem[];
    confirmModal: ConfirmModalState;
    notificationsState: AppShellContainerNotificationsState;
    data: AppShellContainerData;
    timeTracking: AppShellContainerTimeTracking;
    handlers: AppShellContainerHandlers;
}
