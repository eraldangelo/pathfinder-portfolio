import type { AdminStatus, Lead } from '../../leads-page/LeadsPageTypes';
import type { Dispatch, SetStateAction } from 'react';
import { useStudentInfoModalAdminActions } from '../admin-actions/useStudentInfoModalAdminActions';
import { useStudentInfoModalCaseIdActions } from './useStudentInfoModalCaseIdActions';
import { useStudentInfoModalConsultationActions } from '../consultation-actions/useStudentInfoModalConsultationActions';

interface UseStudentInfoModalActionsParams {
    leadId: string;
    leadDocPath?: string;
    leadCaseId: string;
    leadAdminStatus?: AdminStatus | null;
    leadConsultationStatus?: Lead['consultationStatus'] | null;
    leadAssignedCounsellor?: string | null;
    leadAssignedCounsellorUid?: string | null;
    isSubmission: boolean;
    canEditAdminTab: boolean;
    canEditConsultationTab: boolean;
    canEditCaseId: boolean;
    editedLead: Lead;
    setEditedLead: Dispatch<SetStateAction<Lead>>;
    onUpdate: (lead: Lead) => void;
    onAddLogEntry: (studentId: string, logMessage: string) => void;
    userId?: string | null;
    userName?: string | null;
    showPopup: (message: string) => void;
    t: (key: string, options?: { [key: string]: string | number } | string) => string;
}

export const useStudentInfoModalActions = ({
    leadId,
    leadDocPath,
    leadCaseId,
    leadAdminStatus,
    leadConsultationStatus,
    leadAssignedCounsellor,
    leadAssignedCounsellorUid,
    isSubmission,
    canEditAdminTab,
    canEditConsultationTab,
    canEditCaseId,
    editedLead,
    setEditedLead,
    onUpdate,
    onAddLogEntry,
    userId,
    userName,
    showPopup,
    t,
}: UseStudentInfoModalActionsParams) => {
    const adminActions = useStudentInfoModalAdminActions({
        leadId,
        leadDocPath,
        leadAdminStatus,
        leadAssignedCounsellor,
        leadAssignedCounsellorUid,
        isSubmission,
        canEditAdminTab,
        editedLead,
        setEditedLead,
        userId,
        userName,
        showPopup,
        t,
    });

    const consultationActions = useStudentInfoModalConsultationActions({
        leadId,
        leadDocPath,
        leadConsultationStatus,
        canEditConsultationTab,
        editedLead,
        setEditedLead,
        userId,
        userName,
        showPopup,
        t,
    });

    const caseIdActions = useStudentInfoModalCaseIdActions({
        leadId,
        leadDocPath,
        leadCaseId,
        isSubmission,
        canEditCaseId,
        editedLead,
        setEditedLead,
        onUpdate,
        onAddLogEntry,
        showPopup,
        t,
    });

    return {
        ...caseIdActions,
        ...adminActions,
        ...consultationActions,
    };
};
