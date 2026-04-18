import React from 'react';
import AppOverlays from './AppOverlays';
import type { ApplicationInfo } from '../../data/applications';
import type { PersonnelWithDetails } from '../../data/personnel';
import type { User } from '../../types';
import type { Lead } from '../leads/leads-page/LeadsPage';
import type { StudentInfoTab } from '../leads/types/studentInfoTab';
import type { ConfirmModalState } from './hooks/useConfirmModal';
import type { NotificationItem } from './hooks/useNotifications';

interface AppShellOverlaysProps {
    user: User;
    userRole: string;
    notifications: NotificationItem[];
    confirmModal: ConfirmModalState;
    openStudentLead: Lead | null;
    openStudentModalId: string | null;
    applicationsForOpenStudent: ApplicationInfo[];
    minimizedLeads: Array<Lead | undefined>;
    modalInitialTab?: StudentInfoTab;
    isSidebarCollapsed: boolean;
    isTransferModalOpen: boolean;
    leadToTransfer: Lead | null;
    isRequestLeaveModalOpen: boolean;
    isRequestOffsetModalOpen: boolean;
    isRequestUseOffsetModalOpen: boolean;
    allPersonnel: PersonnelWithDetails[];
    onCloseNotification: (id: number) => void;
    onCloseConfirm: () => void;
    onOpenStudentProfile: (leadId: string, targetTab?: StudentInfoTab, leadDocPath?: string) => void;
    onOpenApplicationDetail: (appId: string) => void;
    onCloseStudentModal: () => void;
    onMinimizeStudentModal: () => void;
    onUpdateLead: (lead: Lead) => void;
    showPopup: (message: string) => void;
    onAddNote: (studentId: string, subject: string, content: string) => void;
    onAddLogEntry: (studentId: string, logMessage: string) => void;
    onRestoreMinimized: (leadId: string) => void;
    onCloseMinimized: (leadId: string) => void;
    onSubmitTransfer: (data: { leadId: string; reason: string; newBranch: string; newCounsellor?: string }) => void;
    onCloseTransferModal: () => void;
    onCloseRequestLeaveModal: () => void;
    onSubmitRequestLeave: (data: { fromDate: string; toDate: string; dayCount: number; reason: string }) => void;
    onCloseRequestOffsetModal: () => void;
    onSubmitRequestOffset: (data: { date: string; hours: number; reason: string; mode?: 'add' | 'use'; startTime?: string; endTime?: string }) => void;
    onCloseRequestUseOffsetModal: () => void;
}

const AppShellOverlays: React.FC<AppShellOverlaysProps> = ({
    user,
    userRole,
    notifications,
    confirmModal,
    openStudentLead,
    openStudentModalId,
    applicationsForOpenStudent,
    minimizedLeads,
    modalInitialTab,
    isSidebarCollapsed,
    isTransferModalOpen,
    leadToTransfer,
    isRequestLeaveModalOpen,
    isRequestOffsetModalOpen,
    isRequestUseOffsetModalOpen,
    allPersonnel,
    onCloseNotification,
    onCloseConfirm,
    onOpenStudentProfile,
    onOpenApplicationDetail,
    onCloseStudentModal,
    onMinimizeStudentModal,
    onUpdateLead,
    showPopup,
    onAddNote,
    onAddLogEntry,
    onRestoreMinimized,
    onCloseMinimized,
    onSubmitTransfer,
    onCloseTransferModal,
    onCloseRequestLeaveModal,
    onSubmitRequestLeave,
    onCloseRequestOffsetModal,
    onSubmitRequestOffset,
    onCloseRequestUseOffsetModal,
}) => (
    <AppOverlays
        user={user}
        userRole={userRole}
        notifications={notifications}
        onCloseNotification={onCloseNotification}
        confirmModal={confirmModal}
        onCloseConfirm={onCloseConfirm}
        onOpenStudentProfile={onOpenStudentProfile}
        onOpenApplicationDetail={onOpenApplicationDetail}
        openStudentLead={openStudentLead}
        openStudentModalId={openStudentModalId}
        onCloseStudentModal={onCloseStudentModal}
        onMinimizeStudentModal={onMinimizeStudentModal}
        applicationsForOpenStudent={applicationsForOpenStudent}
        modalInitialTab={modalInitialTab}
        onUpdateLead={onUpdateLead}
        showPopup={showPopup}
        onAddNote={onAddNote}
        onAddLogEntry={onAddLogEntry}
        minimizedLeads={minimizedLeads}
        onRestoreMinimized={onRestoreMinimized}
        onCloseMinimized={onCloseMinimized}
        isSidebarCollapsed={isSidebarCollapsed}
        isTransferModalOpen={isTransferModalOpen}
        leadToTransfer={leadToTransfer}
        allPersonnel={allPersonnel}
        onSubmitTransfer={onSubmitTransfer}
        onCloseTransferModal={onCloseTransferModal}
        isRequestLeaveModalOpen={isRequestLeaveModalOpen}
        onCloseRequestLeaveModal={onCloseRequestLeaveModal}
        onSubmitRequestLeave={onSubmitRequestLeave}
        isRequestOffsetModalOpen={isRequestOffsetModalOpen}
        isRequestUseOffsetModalOpen={isRequestUseOffsetModalOpen}
        onCloseRequestOffsetModal={onCloseRequestOffsetModal}
        onCloseRequestUseOffsetModal={onCloseRequestUseOffsetModal}
        onSubmitRequestOffset={onSubmitRequestOffset}
    />
);

export default AppShellOverlays;


