import type { ApplicationInfo } from '../../data/applications';
import type { PersonnelWithDetails } from '../../data/personnel';
import type {
    AssessmentSubmission,
    Theme,
    TimeLogEntry,
    TimeTrackingStatus,
    User,
    View,
} from '../../types';
import type { BranchChangeRequestFormData } from '../../types/branchChangeRequest';
import type { Lead } from '../leads/leads-page/LeadsPage';
import type { SidebarNavItem } from '../layout/types/SidebarNavItem';
import type { StudentInfoTab } from '../leads/types/studentInfoTab';
import type { ConfirmModalState } from './hooks/useConfirmModal';
import type { NotificationItem, PersistentNotificationItem } from './hooks/useNotifications';

export type { SidebarNavItem } from '../layout/types/SidebarNavItem';

export interface AppShellState {
    user: User;
    userRole: string;
    view: View;
    theme: Theme;
    isReady: boolean;
    logoUrl: string;
    isSidebarCollapsed: boolean;
    isMobileSidebarOpen: boolean;
    isNotificationDropdownOpen: boolean;
    persistentNotifications: PersistentNotificationItem[];
    notifications: NotificationItem[];
    notificationCount: number;
    navItems: SidebarNavItem[];
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
    timeTrackingStatus: TimeTrackingStatus;
    timeLog: TimeLogEntry[];
    hasTimedInToday: boolean;
    hasTakenLunchToday: boolean;
    isTransferModalOpen: boolean;
    leadToTransfer: Lead | null;
    isRequestLeaveModalOpen: boolean;
    isRequestOffsetModalOpen: boolean;
    isRequestUseOffsetModalOpen: boolean;
    confirmModal: ConfirmModalState;
}

export interface AppShellActions {
    toggleTheme: () => void;
    onToggleSidebarCollapse: () => void;
    onOpenMobileSidebar: () => void;
    onCloseMobileSidebar: () => void;
    onLogout: () => void;
    onClearNotifications: () => void;
    onNotificationDropdownToggle: (value: boolean | ((prev: boolean) => boolean)) => void;
    onOpenStudentProfile: (leadId: string, targetTab?: StudentInfoTab, leadDocPath?: string) => void;
    onOpenApplicationDetail: (appId: string) => void;
    onOpenProfile: () => void;
    onNavigateToDashboard: () => void;
    onNavigateToLeads: () => void;
    onNavigateToApplications: () => void;
    onNavigateToArchive: () => void;
    onNavigateToEducationProviders: () => void;
    onNavigateToTimesheet: () => void;
    onNavigateToPersonnel: () => void;
    onNavigateToNotifications: () => void;
    onRequestTransfer: (lead: Lead) => void;
    onUpdateLead: (lead: Lead) => void;
    onAddLogEntry: (studentId: string, logMessage: string) => void;
    onAddNote: (studentId: string, subject: string, content: string) => void;
    onUpdateApplication: (application: ApplicationInfo) => void;
    onStatusUpdateWithNote: (studentId: string, newStatus: string, providerName: string, noteContent: string) => void;
    showPopup: (message: string, meta?: { eventKey?: string; persist?: boolean }) => void;
    onProfileUpdate: (newPhotoURL?: string, updates?: Partial<User>) => void;
    onLoginAgain: () => void;
    onOpenRequestLeaveModal: () => void;
    onOpenRequestOffsetModal: () => void;
    onOpenRequestUseOffsetModal: () => void;
    onBranchChangeRequestSubmit: (data: BranchChangeRequestFormData) => void | Promise<void>;
    onCloseNotification: (id: number) => void;
    onCloseConfirm: () => void;
    onCloseStudentModal: () => void;
    onMinimizeStudentModal: () => void;
    onRestoreMinimized: (leadId: string) => void;
    onCloseMinimized: (leadId: string) => void;
    onSubmitTransfer: (data: { leadId: string; reason: string; newBranch: string; newCounsellor?: string }) => void;
    onCloseTransferModal: () => void;
    onCloseRequestLeaveModal: () => void;
    onSubmitRequestLeave: (data: { fromDate: string; toDate: string; dayCount: number; reason: string }) => void;
    onCloseRequestOffsetModal: () => void;
    onSubmitRequestOffset: (data: { date: string; hours: number; reason: string; mode?: 'add' | 'use'; startTime?: string; endTime?: string }) => void;
    onCloseRequestUseOffsetModal: () => void;
    onTimeIn: () => void;
    onTimeOut: () => void;
    onStartLunch: () => void;
    onEndLunch: () => void;
}
