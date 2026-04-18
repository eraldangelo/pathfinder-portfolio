import React from 'react';
import AppShellHeader from '../AppShellHeader';
import AppShellView from '../AppShellView';
import { AppViewProvider } from '../AppView.context';
import type { AppShellActions, AppShellState } from '../AppShell.types';

interface AppShellMainProps {
    state: AppShellState;
    actions: AppShellActions;
}

const AppShellMain: React.FC<AppShellMainProps> = ({ state, actions }) => (
    <div className={`flex-1 min-w-0 flex flex-col transition-all duration-300 ${state.isSidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'}`}>
        <AppShellHeader
            user={state.user}
            userRole={state.userRole}
            theme={state.theme}
            toggleTheme={actions.toggleTheme}
            timeTrackingStatus={state.timeTrackingStatus}
            isReady={state.isReady}
            isSidebarCollapsed={state.isSidebarCollapsed}
            isNotificationDropdownOpen={state.isNotificationDropdownOpen}
            persistentNotifications={state.persistentNotifications}
            notificationCount={state.notificationCount}
            onMenuClick={actions.onOpenMobileSidebar}
            onClearNotifications={actions.onClearNotifications}
            onNotificationDropdownToggle={actions.onNotificationDropdownToggle}
            onOpenNotifications={actions.onNavigateToNotifications}
        />
        <div className="flex-grow w-full h-full min-w-0">
            <div key={state.view} className="app-view-transition h-full min-w-0">
                <AppViewProvider
                    value={{
                        view: state.view,
                        user: state.user,
                        userRole: state.userRole,
                        isReady: state.isReady,
                        theme: state.theme,
                        leads: state.leads,
                        assessmentSubmissions: state.assessmentSubmissions,
                        genuineSubmissionIds: state.genuineSubmissionIds,
                        applications: state.applications,
                        allPersonnel: state.allPersonnel,
                        notifications: state.persistentNotifications,
                        unreadCount: state.notificationCount,
                        openApplication: state.openApplication,
                        openLeadForApplication: state.openLeadForApplication,
                        onOpenApplicationDetail: actions.onOpenApplicationDetail,
                        onOpenStudentProfile: actions.onOpenStudentProfile,
                        onRequestTransfer: actions.onRequestTransfer,
                        onUpdateLead: actions.onUpdateLead,
                        onAddLogEntry: actions.onAddLogEntry,
                        onAddNote: actions.onAddNote,
                        onUpdateApplication: actions.onUpdateApplication,
                        onStatusUpdateWithNote: actions.onStatusUpdateWithNote,
                        showPopup: actions.showPopup,
                        onProfileUpdate: actions.onProfileUpdate,
                        onNavigateToDashboard: actions.onNavigateToDashboard,
                        onNavigateToApplications: actions.onNavigateToApplications,
                        onLoginAgain: actions.onLoginAgain,
                        onOpenRequestLeaveModal: actions.onOpenRequestLeaveModal,
                        onOpenRequestOffsetModal: actions.onOpenRequestOffsetModal,
                        onOpenRequestUseOffsetModal: actions.onOpenRequestUseOffsetModal,
                        onBranchChangeRequestSubmit: actions.onBranchChangeRequestSubmit,
                        onMarkAllNotificationsRead: actions.onClearNotifications,
                    }}
                >
                    <AppShellView />
                </AppViewProvider>
            </div>
        </div>
    </div>
);

export default AppShellMain;
