import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import type { AdminStatus, Lead } from '../../leads-page/LeadsPageTypes';
import { isFinalAdminStatus } from './adminActionUtils';
import { performAdminStatusSave } from './adminActionService';

interface UseStudentInfoModalAdminActionsParams {
    leadId: string;
    leadDocPath?: string;
    leadAdminStatus?: AdminStatus | null;
    leadAssignedCounsellor?: string | null;
    leadAssignedCounsellorUid?: string | null;
    isSubmission: boolean;
    canEditAdminTab: boolean;
    editedLead: Lead;
    setEditedLead: Dispatch<SetStateAction<Lead>>;
    userId?: string | null;
    userName?: string | null;
    showPopup: (message: string) => void;
    t: (key: string, options?: { [key: string]: string | number } | string) => string;
}

export const useStudentInfoModalAdminActions = ({
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
}: UseStudentInfoModalAdminActionsParams) => {
    const [isAdminStatusLocked, setIsAdminStatusLocked] = useState(isFinalAdminStatus(leadAdminStatus));
    const [isEndorsementLocked, setIsEndorsementLocked] = useState(Boolean(leadAssignedCounsellorUid || (leadAssignedCounsellor ?? '').trim()));
    const [isAdminStatusSaving, setIsAdminStatusSaving] = useState(false);
    const isAdminStatusSavingRef = useRef(false);

    useEffect(() => {
        setIsAdminStatusLocked(isFinalAdminStatus(leadAdminStatus));
    }, [leadAdminStatus]);

    useEffect(() => {
        setIsEndorsementLocked(Boolean(leadAssignedCounsellorUid || (leadAssignedCounsellor ?? '').trim()));
    }, [leadAssignedCounsellor, leadAssignedCounsellorUid]);

    const handleAdminStatusSave = useCallback(async () => {
        if (!canEditAdminTab || isAdminStatusLocked || isAdminStatusSaving || isAdminStatusSavingRef.current) return;

        try {
            isAdminStatusSavingRef.current = true;
            setIsAdminStatusSaving(true);
            await performAdminStatusSave({
                leadId,
                leadDocPath,
                leadAdminStatus,
                leadAssignedCounsellorUid,
                isSubmission,
                editedLead,
                setEditedLead,
                userId,
                userName,
                showPopup,
                t,
                setIsAdminStatusLocked,
                setIsEndorsementLocked,
            });
        } catch (error: any) {
            if (error?.code === 'unavailable') {
                showPopup(t('offlineSaveSuccess', "You're offline, but your changes were saved locally. They'll sync automatically."));
            } else {
                console.error('Error updating admin status:', error);
                showPopup(t('profileUpdateFailed', 'Failed to update student profile.'));
            }
        } finally {
            setIsAdminStatusSaving(false);
            isAdminStatusSavingRef.current = false;
        }
    }, [
        canEditAdminTab,
        editedLead,
        isAdminStatusLocked,
        isAdminStatusSaving,
        isSubmission,
        leadAdminStatus,
        leadAssignedCounsellorUid,
        leadId,
        leadDocPath,
        setEditedLead,
        showPopup,
        t,
        userId,
        userName,
    ]);

    const handleEndorseCounsellorChange = useCallback((option: { uid: string; name: string } | null) => {
        setEditedLead((prev) => ({
            ...prev,
            assignedCounsellor: option?.name ?? '',
            assignedCounsellorUid: option?.uid ?? undefined,
        }));
    }, [setEditedLead]);

    return {
        isAdminStatusLocked,
        isEndorsementLocked,
        isAdminStatusSaving,
        handleAdminStatusSave,
        handleEndorseCounsellorChange,
    };
};
