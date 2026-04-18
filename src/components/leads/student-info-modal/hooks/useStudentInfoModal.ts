import { useCallback, useEffect, useState } from 'react';
import type { PersonnelWithDetails } from '../../../../data/personnel';
import type { User } from '../../../../types';
import type { Lead } from '../../leads-page/LeadsPageTypes';
import type { Tab } from '../utils/StudentInfoModalTypes';
import { useStudentInfoModalActions } from './useStudentInfoModalActions';
import { useStudentInfoModalComputed } from './useStudentInfoModalComputed';
import { useStudentInfoModalTabs } from './useStudentInfoModalTabs';
import { useStudentInfoModalLog } from './useStudentInfoModalLog';
import { useStudentInfoModalActivity } from './useStudentInfoModalActivity';
import { useStudentInfoModalStatus } from './useStudentInfoModalStatus';
import { useStudentInfoModalState } from './useStudentInfoModalState';
import { useStudentInfoModalInput } from './useStudentInfoModalInput';
import { useStudentInfoModalAddNote } from './useStudentInfoModalAddNote';
import { isMarketingRole } from '../../../../utils/roles';

interface UseStudentInfoModalParams {
    lead: Lead;
    user: User;
    userRole: string;
    initialTab?: Tab;
    allPersonnel: PersonnelWithDetails[];
    onUpdate: (lead: Lead) => void;
    onAddLogEntry: (studentId: string, logMessage: string) => void;
    onAddNote: (studentId: string, subject: string, content: string) => void;
    showPopup: (message: string) => void;
    onClose: () => void;
    t: (key: string, options?: { [key: string]: string | number } | string) => string;
}

export const useStudentInfoModal = ({
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
}: UseStudentInfoModalParams) => {
    const {
        isEditing,
        setIsEditing,
        editedLead,
        setEditedLead,
        modalRef,
        handleCancel,
        handleClose,
        handleEditClick,
    } = useStudentInfoModalState({ lead, onClose });

    const {
        isAdminLike,
        isSubmission,
        endorsementOptions,
        canEditAdminTab,
        isActionAllowed,
        canCreateApplication,
        canEditConsultationTab,
        visibleTabs,
        canEditCaseId,
    } = useStudentInfoModalComputed({ lead, user, userRole, allPersonnel });

    const { logs, notes } = useStudentInfoModalActivity(
        lead.id,
        lead.leadDocPath,
        isSubmission,
        lead.logs || [],
        lead.notes || []
    );

    const { currentStatus, currentConsultationStatus: persistedConsultationStatus } = useStudentInfoModalStatus(
        lead.id,
        lead.leadDocPath,
        isSubmission,
        lead.adminStatus ?? null,
        lead.consultationStatus ?? null
    );

    useStudentInfoModalLog({
        lead,
        leadDocPath: lead.leadDocPath,
        isSubmission,
        shouldLog: !isMarketingRole(userRole),
        viewerName: user.displayName,
        onAddLogEntry,
        t,
    });

    const { activeTab, setActiveTab, animationClass, handleTabClick } = useStudentInfoModalTabs({ initialTab });
    const { handleInputChange } = useStudentInfoModalInput({ setEditedLead });

    useEffect(() => {
        if (!currentStatus) return;
        setEditedLead((prev) => (prev.adminStatus === currentStatus ? prev : { ...prev, adminStatus: currentStatus }));
    }, [currentStatus, setEditedLead]);
    useEffect(() => {
        if (!persistedConsultationStatus) return;
        setEditedLead((prev) =>
            prev.consultationStatus === persistedConsultationStatus
                ? prev
                : { ...prev, consultationStatus: persistedConsultationStatus },
        );
    }, [persistedConsultationStatus, setEditedLead]);

    const handleSave = useCallback(() => {
        if (isSubmission && activeTab !== 'admin') {
            setIsEditing(false);
            return;
        }
        onUpdate(editedLead);
        onAddLogEntry(lead.id, t('logEditedProfile'));
        setIsEditing(false);
    }, [activeTab, editedLead, isSubmission, lead.id, onAddLogEntry, onUpdate, setIsEditing, t]);

    const {
        isCaseIdEditing,
        caseIdDraft,
        isCaseIdSaving,
        isAdminStatusLocked,
        isEndorsementLocked,
        isAdminStatusSaving,
        isConsultationSaving,
        currentConsultationStatus,
        handleAdminStatusSave,
        handleConsultationSave,
        handleEndorseCounsellorChange,
        handleCaseIdEditClick,
        handleCaseIdDraftChange,
        handleCaseIdCancel,
        handleCaseIdSave,
    } = useStudentInfoModalActions({
        leadId: lead.id,
        leadDocPath: lead.leadDocPath,
        leadCaseId: lead.caseId || '',
        leadAdminStatus: currentStatus,
        leadConsultationStatus: persistedConsultationStatus,
        leadAssignedCounsellor: lead.assignedCounsellor ?? null,
        leadAssignedCounsellorUid: lead.assignedCounsellorUid ?? null,
        isSubmission,
        canEditAdminTab,
        canEditConsultationTab,
        canEditCaseId,
        editedLead,
        setEditedLead,
        onUpdate,
        onAddLogEntry,
        userId: user.uid,
        userName: user.displayName,
        showPopup,
        t,
    });

    const handleEditClickWithTab = useCallback(() => {
        handleEditClick(activeTab, setActiveTab);
    }, [activeTab, handleEditClick, setActiveTab]);
    
    const [isCreateAppConfirmOpen, setCreateAppConfirmOpen] = useState(false);

    const openCreateApplicationConfirm = useCallback(() => {
        setCreateAppConfirmOpen(true);
    }, []);

    const closeCreateApplicationConfirm = useCallback(() => {
        setCreateAppConfirmOpen(false);
    }, []);

    const handleAddNote = useStudentInfoModalAddNote({
        isSubmission,
        leadId: lead.id,
        leadDocPath: lead.leadDocPath,
        user,
        onAddNote,
        showPopup,
        t,
    });

    return {
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
        isAdminLike,
        isActionAllowed,
        canCreateApplication,
        canEditConsultationTab,
        visibleTabs,
        canEditAdminTab,
        endorsementOptions,
        handleTabClick,
        handleInputChange,
        handleSave,
        handleAdminStatusSave,
        handleConsultationSave,
        handleEndorseCounsellorChange,
        handleCaseIdEditClick,
        handleCaseIdDraftChange,
        handleCaseIdCancel,
        handleCaseIdSave,
        isAdminStatusLocked,
        isEndorsementLocked,
        isAdminStatusSaving,
        isConsultationSaving,
        currentConsultationStatus,
        handleCancel,
        handleClose,
        handleEditClick: handleEditClickWithTab,
        handleAddNote,
        openCreateApplicationConfirm,
        closeCreateApplicationConfirm,
    };
};
