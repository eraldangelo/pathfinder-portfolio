import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import type { ConsultationStatus, Lead } from '../../leads-page/LeadsPageTypes';
import { performConsultationStatusSave } from './consultationActionService';
import { normalizeConsultationStatus } from './consultationActionUtils';

interface UseStudentInfoModalConsultationActionsParams {
    leadId: string;
    leadDocPath?: string;
    leadConsultationStatus?: ConsultationStatus | null;
    canEditConsultationTab: boolean;
    editedLead: Lead;
    setEditedLead: Dispatch<SetStateAction<Lead>>;
    userId?: string | null;
    userName?: string | null;
    showPopup: (message: string) => void;
    t: (key: string, options?: { [key: string]: string | number } | string) => string;
}

export const useStudentInfoModalConsultationActions = ({
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
}: UseStudentInfoModalConsultationActionsParams) => {
    const [isConsultationSaving, setIsConsultationSaving] = useState(false);
    const [currentConsultationStatus, setCurrentConsultationStatus] = useState<ConsultationStatus>(
        normalizeConsultationStatus(leadConsultationStatus),
    );

    useEffect(() => {
        setCurrentConsultationStatus(normalizeConsultationStatus(leadConsultationStatus));
    }, [leadId, leadConsultationStatus]);

    const handleConsultationSave = useCallback(async () => {
        if (!canEditConsultationTab || isConsultationSaving) return;

        try {
            setIsConsultationSaving(true);
            const savedStatus = await performConsultationStatusSave({
                leadId,
                leadDocPath,
                leadConsultationStatus: currentConsultationStatus,
                editedLead,
                setEditedLead,
                userId,
                userName,
                showPopup,
                t,
            });

            if (savedStatus) {
                setCurrentConsultationStatus(savedStatus);
            }
        } catch (error: any) {
            if (error?.code === 'unavailable') {
                showPopup(t('offlineSaveSuccess', "You're offline, but your changes were saved locally. They'll sync automatically."));
            } else {
                console.error('Error updating consultation details:', error);
                showPopup(t('profileUpdateFailed', 'Failed to update student profile.'));
            }
        } finally {
            setIsConsultationSaving(false);
        }
    }, [
        canEditConsultationTab,
        currentConsultationStatus,
        editedLead,
        isConsultationSaving,
        leadId,
        leadDocPath,
        setEditedLead,
        showPopup,
        t,
        userId,
        userName,
    ]);

    return {
        isConsultationSaving,
        handleConsultationSave,
        currentConsultationStatus,
    };
};
