import React from 'react';
import PopupNotification from '../common/components/PopupNotification';
import ConfirmActionModal from '../common/components/ConfirmActionModal';
import StudentInfoModal from '../leads/student-info-modal/StudentInfoModal';
import MinimizedModalsBar from '../layout/components/MinimizedModalsBar';
import RequestTransferModal from '../leads/modals/RequestTransferModal';
import RequestLeaveModal from '../timesheet/modals/RequestLeaveModal';
import RequestOffsetModal from '../timesheet/modals/RequestOffsetModal';
import RequestUseOffsetModal from '../timesheet/modals/RequestUseOffsetModal';
import type { ConfirmModalState } from './hooks/useConfirmModal';
import type { NotificationItem } from './hooks/useNotifications';
import type { ApplicationInfo } from '../../data/applications';
import type { PersonnelWithDetails } from '../../data/personnel';
import type { User } from '../../types';
import type { Lead } from '../leads/leads-page/LeadsPage';
import type { StudentInfoTab } from '../leads/types/studentInfoTab';

interface AppOverlaysProps {
    user: User;
    userRole: string;
    notifications: NotificationItem[];
    onCloseNotification: (id: number) => void;
    confirmModal: ConfirmModalState;
    onCloseConfirm: () => void;
    onOpenStudentProfile: (leadId: string, targetTab?: StudentInfoTab, leadDocPath?: string) => void;
    onOpenApplicationDetail: (appId: string) => void;
    openStudentLead: Lead | null;
    openStudentModalId: string | null;
    onCloseStudentModal: () => void;
    onMinimizeStudentModal: () => void;
    applicationsForOpenStudent: ApplicationInfo[];
    modalInitialTab?: StudentInfoTab;
    onUpdateLead: (lead: Lead) => void;
    showPopup: (message: string) => void;
    onAddNote: (studentId: string, subject: string, content: string) => void;
    onAddLogEntry: (studentId: string, logMessage: string) => void;
    minimizedLeads: Array<Lead | undefined>;
    onRestoreMinimized: (leadId: string) => void;
    onCloseMinimized: (leadId: string) => void;
    isSidebarCollapsed: boolean;
    isTransferModalOpen: boolean;
    leadToTransfer: Lead | null;
    allPersonnel: PersonnelWithDetails[];
    onSubmitTransfer: (data: { leadId: string; reason: string; newBranch: string; newCounsellor?: string }) => void;
    onCloseTransferModal: () => void;
    isRequestLeaveModalOpen: boolean;
    onCloseRequestLeaveModal: () => void;
    onSubmitRequestLeave: (data: { fromDate: string; toDate: string; dayCount: number; reason: string }) => void;
    isRequestOffsetModalOpen: boolean;
    isRequestUseOffsetModalOpen: boolean;
    onCloseRequestOffsetModal: () => void;
    onSubmitRequestOffset: (data: { date: string; hours: number; reason: string; mode?: 'add' | 'use'; startTime?: string; endTime?: string }) => void;
    onCloseRequestUseOffsetModal: () => void;
}

const AppOverlays: React.FC<AppOverlaysProps> = ({
    user,
    userRole,
    notifications,
    onCloseNotification,
    confirmModal,
    onCloseConfirm,
    onOpenStudentProfile,
    onOpenApplicationDetail,
    openStudentLead,
    openStudentModalId,
    onCloseStudentModal,
    onMinimizeStudentModal,
    applicationsForOpenStudent,
    modalInitialTab,
    onUpdateLead,
    showPopup,
    onAddNote,
    onAddLogEntry,
    minimizedLeads,
    onRestoreMinimized,
    onCloseMinimized,
    isSidebarCollapsed,
    isTransferModalOpen,
    leadToTransfer,
    allPersonnel,
    onSubmitTransfer,
    onCloseTransferModal,
    isRequestLeaveModalOpen,
    onCloseRequestLeaveModal,
    onSubmitRequestLeave,
    isRequestOffsetModalOpen,
    onCloseRequestOffsetModal,
    onSubmitRequestOffset,
    isRequestUseOffsetModalOpen,
    onCloseRequestUseOffsetModal,
}) => {
    const maxUseOffsetHours = Number.isFinite(user?.offsetBalance) ? Math.max(0, Number(user?.offsetBalance ?? 0)) : 0;

    return (
        <>
            <div
                className={`fixed right-4 z-[9999] space-y-4 transition-opacity duration-300 ${!user ? 'opacity-0' : 'opacity-100'}`}
                style={{ top: 'calc(var(--app-header-offset, 80px) + 12px)' }}
            >
                {notifications.map((notification) => (
                    <PopupNotification
                        key={notification.id}
                        id={notification.id}
                        message={notification.message}
                        eventKey={notification.eventKey ?? null}
                        onClose={onCloseNotification}
                    />
                ))}
            </div>

            {confirmModal.isOpen && (
                <ConfirmActionModal
                    isOpen={confirmModal.isOpen}
                    onClose={onCloseConfirm}
                    onConfirm={confirmModal.onConfirm}
                    title={confirmModal.title}
                    message={confirmModal.message}
                    icon={confirmModal.icon}
                    confirmButtonText={confirmModal.confirmButtonText}
                    confirmButtonClassName={confirmModal.confirmButtonClassName}
                />
            )}

            {openStudentLead && (
                <StudentInfoModal
                    lead={openStudentLead}
                    user={user}
                    allPersonnel={allPersonnel}
                    onClose={onCloseStudentModal}
                    onMinimize={onMinimizeStudentModal}
                    onUpdate={onUpdateLead}
                    showPopup={showPopup}
                    userRole={userRole}
                    applications={applicationsForOpenStudent}
                    initialTab={modalInitialTab}
                    onAddNote={onAddNote}
                    onAddLogEntry={onAddLogEntry}
                    onOpenApplicationDetail={(appId) => {
                        onCloseStudentModal();
                        onOpenApplicationDetail(appId);
                    }}
                />
            )}

            <MinimizedModalsBar
                modals={minimizedLeads}
                onRestore={onRestoreMinimized}
                onClose={onCloseMinimized}
                isSidebarCollapsed={isSidebarCollapsed}
            />

            {leadToTransfer && (
                <RequestTransferModal
                    isOpen={isTransferModalOpen}
                    onClose={onCloseTransferModal}
                    lead={leadToTransfer}
                    allPersonnel={allPersonnel}
                    onSubmit={onSubmitTransfer}
                />
            )}

            <RequestLeaveModal
                isOpen={isRequestLeaveModalOpen}
                onClose={onCloseRequestLeaveModal}
                onSubmit={onSubmitRequestLeave}
                leaveBalance={user?.leaveBalance ?? 0}
            />

            <RequestOffsetModal
                isOpen={isRequestOffsetModalOpen}
                onClose={onCloseRequestOffsetModal}
                onSubmit={onSubmitRequestOffset}
            />

            <RequestUseOffsetModal
                isOpen={isRequestUseOffsetModalOpen}
                onClose={onCloseRequestUseOffsetModal}
                onSubmit={onSubmitRequestOffset}
                maxHours={maxUseOffsetHours}
            />
        </>
    );
};

export default AppOverlays;


