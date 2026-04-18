import React from 'react';
import DashboardPage from '../../dashboard/components/DashboardPage';
import ProfilePage from '../../profile/components/ProfilePage';
import { LeadsPage } from '../../leads/leads-page/LeadsPage';
import ApplicationsPage from '../../applications/components/ApplicationsPage';
import ApplicationDetailPage from '../../applications/components/ApplicationDetailPage';
import EducationProvidersPage from '../../education/components/EducationProvidersPage';
import TimesheetPage from '../../timesheet/components/TimesheetPage';
import LogoutPage from '../../auth/components/LogoutPage';
import NotificationsPage from '../../notifications/components/NotificationsPage';
import PersonnelView from './PersonnelView';
import type { PersonnelWithDetails } from '../../../data/personnel';
import type { NewPersonnelData } from '../../personnel/types/PersonnelTypes';
import type { AppViewProps } from '../AppView.types';

interface AppViewRouterProps extends AppViewProps {
    activePersonnel: PersonnelWithDetails | null;
    onOpenPersonnelProfile: (personnel: PersonnelWithDetails | null) => void;
    isCreatePersonnelOpen: boolean;
    onOpenCreateModal: () => void;
    onCloseCreateModal: () => void;
    onDeletePersonnel: (personnel: PersonnelWithDetails) => Promise<boolean>;
    onSavePersonnel: (data: NewPersonnelData) => Promise<boolean>;
}

const AppViewRouter: React.FC<AppViewRouterProps> = ({
    view,
    user,
    userRole,
    isReady,
    theme,
    leads,
    assessmentSubmissions,
    genuineSubmissionIds,
    applications,
    allPersonnel,
    notifications,
    unreadCount,
    openApplication,
    openLeadForApplication,
    onOpenApplicationDetail,
    onOpenStudentProfile,
    onRequestTransfer,
    onUpdateLead,
    onAddLogEntry,
    onAddNote,
    onUpdateApplication,
    onStatusUpdateWithNote,
    showPopup,
    onProfileUpdate,
    onNavigateToDashboard,
    onNavigateToApplications,
    onLoginAgain,
    onOpenRequestLeaveModal,
    onOpenRequestOffsetModal,
    onOpenRequestUseOffsetModal,
    onBranchChangeRequestSubmit,
    onMarkAllNotificationsRead,
    activePersonnel,
    onOpenPersonnelProfile,
    isCreatePersonnelOpen,
    onOpenCreateModal,
    onCloseCreateModal,
    onDeletePersonnel,
    onSavePersonnel,
}) => {
    const renderDashboard = () => (
        <DashboardPage
            user={user}
            role={userRole}
            isReady={isReady}
            theme={theme}
            leads={leads}
            applications={applications}
            allPersonnel={allPersonnel}
            assessmentSubmissions={assessmentSubmissions}
            genuineSubmissionIds={genuineSubmissionIds}
        />
    );

    const renderLeadsPage = (initialViewTab?: 'current' | 'archived') => (
        <LeadsPage
            isReady={isReady}
            user={user}
            role={userRole}
            leads={leads}
            assessmentSubmissions={assessmentSubmissions}
            applications={applications}
            allPersonnel={allPersonnel}
            showPopup={showPopup}
            initialViewTab={initialViewTab}
            onRequestTransfer={onRequestTransfer}
            onOpenStudentProfile={onOpenStudentProfile}
            onUpdateLead={onUpdateLead}
            onAddLogEntry={onAddLogEntry}
        />
    );

    switch (view) {
        case 'dashboard':
            return renderDashboard();
        case 'profile':
            return (
                <ProfilePage
                    user={user}
                    onNavigateBack={onNavigateToDashboard}
                    showPopup={showPopup}
                    onProfileUpdate={onProfileUpdate}
                    onBranchChangeRequestSubmit={onBranchChangeRequestSubmit}
                />
            );
        case 'notifications':
            return (
                <NotificationsPage
                    isReady={isReady}
                    user={user}
                    userRole={userRole}
                    notifications={notifications}
                    unreadCount={unreadCount}
                    onMarkAllRead={onMarkAllNotificationsRead}
                />
            );
        case 'leads':
            return renderLeadsPage('current');
        case 'applications':
            return (
                <ApplicationsPage
                    isReady={isReady}
                    userRole={userRole}
                    applications={applications}
                    leads={leads}
                    assessmentSubmissions={assessmentSubmissions}
                    onOpenApplicationDetail={onOpenApplicationDetail}
                />
            );
        case 'application-detail':
            if (openApplication && openLeadForApplication) {
                return (
                    <ApplicationDetailPage
                        user={user}
                        userRole={userRole}
                        application={openApplication}
                        lead={openLeadForApplication}
                        isReady={isReady}
                        onNavigateBack={onNavigateToApplications}
                        onOpenStudentProfile={onOpenStudentProfile}
                        onUpdateApplication={onUpdateApplication}
                        onStatusUpdateWithNote={onStatusUpdateWithNote}
                        onAddLogEntry={onAddLogEntry}
                        onAddNote={onAddNote}
                    />
                );
            }
            return (
                <ApplicationsPage
                    isReady={isReady}
                    userRole={userRole}
                    applications={applications}
                    leads={leads}
                    assessmentSubmissions={assessmentSubmissions}
                    onOpenApplicationDetail={onOpenApplicationDetail}
                />
            );
        case 'education-providers':
            return <EducationProvidersPage isReady={isReady} />;
        case 'timesheet':
            return (
                <TimesheetPage
                    isReady={isReady}
                    user={user}
                    userRole={userRole}
                    onOpenRequestLeaveModal={onOpenRequestLeaveModal}
                    onOpenRequestOffsetModal={onOpenRequestOffsetModal}
                    onOpenRequestUseOffsetModal={onOpenRequestUseOffsetModal}
                />
            );
        case 'archive':
            return renderLeadsPage('archived');
        case 'personnel':
            return (
                <PersonnelView
                    isReady={isReady}
                    userRole={userRole}
                    allPersonnel={allPersonnel}
                    activePersonnel={activePersonnel}
                    onOpenPersonnelProfile={onOpenPersonnelProfile}
                    isCreatePersonnelOpen={isCreatePersonnelOpen}
                    onOpenCreateModal={onOpenCreateModal}
                    onCloseCreateModal={onCloseCreateModal}
                    onDeletePersonnel={onDeletePersonnel}
                    onSavePersonnel={onSavePersonnel}
                />
            );
        case 'logout':
            return <LogoutPage onLoginAgain={onLoginAgain} />;
        default:
            return renderDashboard();
    }
};

export default AppViewRouter;
