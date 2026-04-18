import React from 'react';
import type { Lead } from '../leads-page/LeadsPage';
import type { LogEntry, Note } from '../leads-page/LeadsPageTypes';
import type { ApplicationInfo } from '../../../data/applications';
import ApplicationsTab from './ApplicationsTab';
import AdminTab from './AdminTab';
import NotesTab from './NotesTab';
import LogsTab from './LogsTab';
import type { Tab } from './StudentInfoTabTypes';
import StudentInfoDetails from './StudentInfoDetails';
import ConsultationNotice from './ConsultationNotice';
import ConsultationTab from './ConsultationTab';
import { hasConsultationAccess } from '../../../utils/roles';
import { isBranchManagerRole } from '../../../utils/roles';

interface StudentInfoTabContentProps {
    activeTab: Tab;
    animationClass: string;
    editedLead: Lead;
    notes: Note[];
    logs: LogEntry[];
    lead: Lead;
    isEditing: boolean;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    applications: ApplicationInfo[];
    canCreateApplication: boolean;
    onCreateApplication: () => void;
    onOpenApplicationDetail: (applicationId: string) => void;
    onClose: () => void;
    onAddLogEntry: (studentId: string, logMessage: string) => void;
    showPopup: (message: string) => void;
    onAddNote: (noteContent: string) => void;
    userRole: string;
    onSaveAdminStatus: () => void;
    onSaveConsultationStatus: () => void;
    endorsementOptions: Array<{ uid: string; name: string }>;
    onEndorseCounsellor: (option: { uid: string; name: string } | null) => void;
    isAdminStatusLocked: boolean;
    isEndorsementLocked: boolean;
    isAdminStatusSaving: boolean;
    isConsultationSaving: boolean;
    currentConsultationStatus?: Lead['consultationStatus'] | null;
    canEditConsultationTab: boolean;
    canEditAdminTab: boolean;
}

const StudentInfoTabContent: React.FC<StudentInfoTabContentProps> = ({
    activeTab,
    animationClass,
    editedLead,
    notes,
    logs,
    lead,
    isEditing,
    onInputChange,
    applications,
    canCreateApplication,
    onCreateApplication,
    onOpenApplicationDetail,
    onClose,
    onAddLogEntry,
    showPopup,
    onAddNote,
    userRole,
    onSaveAdminStatus,
    onSaveConsultationStatus,
    endorsementOptions,
    onEndorseCounsellor,
    isAdminStatusLocked,
    isEndorsementLocked,
    isAdminStatusSaving,
    isConsultationSaving,
    currentConsultationStatus,
    canEditConsultationTab,
    canEditAdminTab,
}) => {
    const canSeeConsultationTab = hasConsultationAccess(userRole);
    const canEditNotes = isBranchManagerRole(userRole) ? canEditConsultationTab : true;

    return (
        <div className="pt-6">
            <div key={activeTab} className={animationClass}>
                {activeTab === 'studentInfo' && (
                    <StudentInfoDetails editedLead={editedLead} isEditing={isEditing} onInputChange={onInputChange} />
                )}

                {activeTab === 'admin' && (
                    <AdminTab
                        editedLead={editedLead}
                        isEditing={isEditing}
                        onInputChange={onInputChange}
                        onSaveStatus={onSaveAdminStatus}
                        endorsementOptions={endorsementOptions}
                        onEndorseCounsellor={onEndorseCounsellor}
                        isAdminStatusLocked={isAdminStatusLocked}
                        isEndorsementLocked={isEndorsementLocked}
                        isAdminStatusSaving={isAdminStatusSaving}
                        canEditAdminTab={canEditAdminTab}
                    />
                )}

                {activeTab === 'application' && (
                    <ApplicationsTab
                        applications={applications}
                        onCreateApplication={onCreateApplication}
                        onOpenApplicationDetail={onOpenApplicationDetail}
                        onClose={onClose}
                        canCreateApplication={canCreateApplication}
                    />
                )}

                {activeTab === 'notes' && (
                    <NotesTab
                        notes={notes}
                        onAddNote={onAddNote}
                        isActionAllowed={canEditNotes}
                        adminStatus={editedLead.adminStatus}
                        consultationStatus={currentConsultationStatus ?? editedLead.consultationStatus ?? null}
                    />
                )}

                {activeTab === 'logs' && <LogsTab logs={logs} />}

                {activeTab === 'consultation' && (
                    canSeeConsultationTab ? (
                        <ConsultationTab
                            editedLead={editedLead}
                            isEditing={isEditing}
                            onInputChange={onInputChange}
                            showPopup={showPopup}
                            notes={notes}
                            onSaveStatus={onSaveConsultationStatus}
                            isStatusSaving={isConsultationSaving}
                            canEditConsultationTab={canEditConsultationTab}
                            savedConsultationStatus={currentConsultationStatus}
                        />
                    ) : (
                        <ConsultationNotice />
                    )
                )}
            </div>
        </div>
    );
};

export default StudentInfoTabContent;
