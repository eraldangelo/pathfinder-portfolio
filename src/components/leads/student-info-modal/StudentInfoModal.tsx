import React from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';
import StudentInfoTabContent from '../student-info/StudentInfoTabContent';
import CreateApplicationConfirmModal from '../../applications/components/CreateApplicationConfirmModal';
import { StudentInfoModalHeader } from './components/StudentInfoModalHeader';
import { StudentInfoModalProfile } from './components/StudentInfoModalProfile';
import type { StudentInfoModalProps } from './utils/StudentInfoModalTypes';
import { studentInfoModalAnimations } from './utils/studentInfoModalAnimations';
import { useStudentInfoModal } from './hooks/useStudentInfoModal';
import { modalBackdrop } from '../../common/styles/ui';

export type { ApplicationData } from './utils/StudentInfoModalTypes';

const StudentInfoModal: React.FC<StudentInfoModalProps> = ({ lead, user, allPersonnel, onClose, onMinimize, onUpdate, showPopup, userRole, applications, initialTab, onAddNote, onAddLogEntry, onOpenApplicationDetail }) => {
    const { t } = useTranslation();
    const {
        isEditing,
        editedLead,
        notes,
        logs,
        isCaseIdEditing,
        caseIdDraft,
        isCaseIdSaving,
        canEditCaseId,
        activeTab,
        animationClass,
        isCreateAppConfirmOpen,
        modalRef,
        isActionAllowed,
        canCreateApplication,
        canEditConsultationTab,
        visibleTabs,
        canEditAdminTab,
        endorsementOptions,
        handleTabClick,
        handleInputChange,
        handleSave,
        handleCaseIdEditClick,
        handleCaseIdDraftChange,
        handleCaseIdCancel,
        handleCaseIdSave,
        handleCancel,
        handleClose,
        handleEditClick,
        handleAddNote,
        handleAdminStatusSave,
        handleConsultationSave,
        handleEndorseCounsellorChange,
        isAdminStatusLocked,
        isEndorsementLocked,
        isAdminStatusSaving,
        isConsultationSaving,
        currentConsultationStatus,
        openCreateApplicationConfirm,
        closeCreateApplicationConfirm,
    } = useStudentInfoModal({
        lead,
        user,
        userRole,
        initialTab,
        allPersonnel,
        onUpdate,
        onAddLogEntry,
        onAddNote,
        showPopup,
        onClose,
        t,
    });

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-info-title"
        >
            <div className={`${modalBackdrop} animate-fade-in`} aria-hidden="true" />

             <style>{studentInfoModalAnimations}</style>
            <div
                ref={modalRef}
                className="relative flex flex-col w-full h-full md:h-[90svh] max-w-7xl bg-white/40 dark:bg-black/30 backdrop-blur-2xl border border-white/30 dark:border-white/20 rounded-none md:rounded-3xl shadow-2xl text-gray-800 dark:text-white transform opacity-0 scale-95"
                onClick={(e) => e.stopPropagation()}
            >
                <StudentInfoModalHeader
                    onMinimize={onMinimize}
                    onClose={handleClose}
                />

                <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
                    <div className="p-4 sm:p-6">
                <StudentInfoModalProfile
                            editedLead={editedLead}
                            visibleTabs={visibleTabs}
                            activeTab={activeTab}
                            isEditing={isEditing}
                            isActionAllowed={isActionAllowed}
                            isCaseIdEditing={isCaseIdEditing}
                            caseIdDraft={caseIdDraft}
                            isCaseIdSaving={isCaseIdSaving}
                            canEditCaseId={canEditCaseId}
                            onEdit={handleEditClick}
                            onCaseIdEdit={handleCaseIdEditClick}
                            onCaseIdDraftChange={handleCaseIdDraftChange}
                            onCaseIdCancel={handleCaseIdCancel}
                            onCaseIdSave={handleCaseIdSave}
                            onTabClick={handleTabClick}
                        />
                        
                        {/* --- Tab Content --- */}
                        <StudentInfoTabContent
                            activeTab={activeTab}
                            animationClass={animationClass}
                            editedLead={editedLead}
                            notes={notes}
                            logs={logs}
                            lead={lead}
                            isEditing={isEditing}
                            onInputChange={handleInputChange}
                            applications={applications}
                            canCreateApplication={canCreateApplication}
                            onCreateApplication={openCreateApplicationConfirm}
                            onOpenApplicationDetail={onOpenApplicationDetail}
                            onClose={onClose}
                            onAddLogEntry={onAddLogEntry}
                            showPopup={showPopup}
                            onAddNote={handleAddNote}
                            userRole={userRole}
                            onSaveAdminStatus={handleAdminStatusSave}
                            onSaveConsultationStatus={handleConsultationSave}
                            endorsementOptions={endorsementOptions}
                            onEndorseCounsellor={handleEndorseCounsellorChange}
                            isAdminStatusLocked={isAdminStatusLocked}
                            isEndorsementLocked={isEndorsementLocked}
                            isAdminStatusSaving={isAdminStatusSaving}
                            isConsultationSaving={isConsultationSaving}
                            currentConsultationStatus={currentConsultationStatus}
                            canEditConsultationTab={canEditConsultationTab}
                            canEditAdminTab={canEditAdminTab}
                        />
                    </div>
                </div>
            </div>
            <CreateApplicationConfirmModal 
                isOpen={isCreateAppConfirmOpen} 
                onClose={closeCreateApplicationConfirm} 
                onSuccess={closeCreateApplicationConfirm}
                lead={editedLead}
                user={user}
                allPersonnel={allPersonnel}
                showPopup={showPopup}
            />
        </div>
    );
};

export default StudentInfoModal;




