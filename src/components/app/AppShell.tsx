import React from 'react';
import AppShellSidebar from './AppShellSidebar';
import AppShellOverlays from './AppShellOverlays';
import { useAppShellActions, useAppShellState } from './AppShell.context';
import AppShellMain from './views/AppShellMain';

const AppShell: React.FC = () => {
    const state = useAppShellState();
    const actions = useAppShellActions();

    return (
        <div className="min-h-screen w-full bg-transparent text-gray-800 dark:text-gray-200 flex transition-colors duration-500 relative">
            <AppShellSidebar
                isOpen={state.isMobileSidebarOpen}
                isCollapsed={state.isSidebarCollapsed}
                navItems={state.navItems}
                user={state.user}
                timeTrackingStatus={state.timeTrackingStatus}
                timeLog={state.timeLog}
                hasTimedInToday={state.hasTimedInToday}
                hasTakenLunchToday={state.hasTakenLunchToday}
                notificationCount={state.notificationCount}
                logoUrl={state.logoUrl}
                onClose={actions.onCloseMobileSidebar}
                onToggleCollapse={actions.onToggleSidebarCollapse}
                onLogout={actions.onLogout}
                onClearNotifications={actions.onClearNotifications}
                onTimeIn={actions.onTimeIn}
                onTimeOut={actions.onTimeOut}
                onStartLunch={actions.onStartLunch}
                onEndLunch={actions.onEndLunch}
                onOpenProfile={actions.onOpenProfile}
                onGoToDashboard={actions.onNavigateToDashboard}
                onGoToLeads={actions.onNavigateToLeads}
                onGoToApplications={actions.onNavigateToApplications}
                onGoToArchive={actions.onNavigateToArchive}
                onGoToEducationProviders={actions.onNavigateToEducationProviders}
                onGoToTimesheet={actions.onNavigateToTimesheet}
                onGoToPersonnel={actions.onNavigateToPersonnel}
                onGoToNotifications={actions.onNavigateToNotifications}
            />

            <AppShellMain state={state} actions={actions} />

            <AppShellOverlays
                user={state.user}
                userRole={state.userRole}
                notifications={state.notifications}
                confirmModal={state.confirmModal}
                openStudentLead={state.openStudentLead}
                openStudentModalId={state.openStudentModalId}
                applicationsForOpenStudent={state.applicationsForOpenStudent}
                minimizedLeads={state.minimizedLeads}
                modalInitialTab={state.modalInitialTab}
                isSidebarCollapsed={state.isSidebarCollapsed}
                isTransferModalOpen={state.isTransferModalOpen}
                leadToTransfer={state.leadToTransfer}
                isRequestLeaveModalOpen={state.isRequestLeaveModalOpen}
                isRequestOffsetModalOpen={state.isRequestOffsetModalOpen}
                isRequestUseOffsetModalOpen={state.isRequestUseOffsetModalOpen}
                allPersonnel={state.allPersonnel}
                onCloseNotification={actions.onCloseNotification}
                onCloseConfirm={actions.onCloseConfirm}
                onOpenStudentProfile={actions.onOpenStudentProfile}
                onOpenApplicationDetail={actions.onOpenApplicationDetail}
                onCloseStudentModal={actions.onCloseStudentModal}
                onMinimizeStudentModal={actions.onMinimizeStudentModal}
                onUpdateLead={actions.onUpdateLead}
                showPopup={actions.showPopup}
                onAddNote={actions.onAddNote}
                onAddLogEntry={actions.onAddLogEntry}
                onRestoreMinimized={actions.onRestoreMinimized}
                onCloseMinimized={actions.onCloseMinimized}
                onSubmitTransfer={actions.onSubmitTransfer}
                onCloseTransferModal={actions.onCloseTransferModal}
                onCloseRequestLeaveModal={actions.onCloseRequestLeaveModal}
                onSubmitRequestLeave={actions.onSubmitRequestLeave}
                onCloseRequestOffsetModal={actions.onCloseRequestOffsetModal}
                onSubmitRequestOffset={actions.onSubmitRequestOffset}
                onCloseRequestUseOffsetModal={actions.onCloseRequestUseOffsetModal}
            />
        </div>
    );
};

export default AppShell;

