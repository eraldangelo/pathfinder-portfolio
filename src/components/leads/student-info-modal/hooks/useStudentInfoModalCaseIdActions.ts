import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { db } from '../../../../services/firebase';
import type { Lead } from '../../leads-page/LeadsPageTypes';
import { getLeadDocRef, isRootLeadDocPath } from '../../../../utils/leadDocPath';

interface UseStudentInfoModalCaseIdActionsParams {
    leadId: string;
    leadDocPath?: string;
    leadCaseId: string;
    isSubmission: boolean;
    canEditCaseId: boolean;
    editedLead: Lead;
    setEditedLead: Dispatch<SetStateAction<Lead>>;
    onUpdate: (lead: Lead) => void;
    onAddLogEntry: (studentId: string, logMessage: string) => void;
    showPopup: (message: string) => void;
    t: (key: string, options?: { [key: string]: string | number } | string) => string;
}

const createUniqueId = (suffix: string) => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return `${crypto.randomUUID()}-${suffix}`;
    }
    return `${new Date().toISOString()}-${Math.random().toString(36).slice(2, 8)}-${suffix}`;
};

export const useStudentInfoModalCaseIdActions = ({
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
}: UseStudentInfoModalCaseIdActionsParams) => {
    const [isCaseIdEditing, setIsCaseIdEditing] = useState(false);
    const [caseIdDraft, setCaseIdDraft] = useState(leadCaseId || '');
    const [isCaseIdSaving, setIsCaseIdSaving] = useState(false);

    useEffect(() => {
        setIsCaseIdEditing(false);
        setIsCaseIdSaving(false);
        setCaseIdDraft(leadCaseId || '');
    }, [leadId, leadCaseId]);

    const handleCaseIdEditClick = useCallback(() => {
        if (!canEditCaseId) return;
        setIsCaseIdEditing(true);
        setCaseIdDraft((editedLead.caseId || '').trim());
    }, [canEditCaseId, editedLead.caseId]);

    const handleCaseIdDraftChange = useCallback((value: string) => {
        setCaseIdDraft(value);
    }, []);

    const handleCaseIdCancel = useCallback(() => {
        setIsCaseIdEditing(false);
        setIsCaseIdSaving(false);
        setCaseIdDraft((editedLead.caseId || '').trim());
    }, [editedLead.caseId]);

    const handleCaseIdSave = useCallback(async () => {
        if (!canEditCaseId) return;
        if (isCaseIdSaving) return;

        const trimmed = caseIdDraft.trim();
        setIsCaseIdSaving(true);

        try {
            const leadRef = getLeadDocRef(db, leadId, leadDocPath);
            await leadRef.set({ caseId: trimmed }, { merge: true });

            // Keep Case ID save resilient for counsellors: update applications on best effort,
            // but don't fail the whole action if some application docs are not readable/writable.
            try {
                const leadApplicationsSnapshot = await leadRef.collection('applications').get();
                if (!leadApplicationsSnapshot.empty) {
                    const applicationBatch = db.batch();
                    leadApplicationsSnapshot.docs.forEach((applicationDoc: any) => {
                        applicationBatch.set(applicationDoc.ref, { caseId: trimmed }, { merge: true });
                    });
                    await applicationBatch.commit();
                }
            } catch (appSyncError) {
                console.warn('Case ID saved on lead, but application caseId sync was skipped:', appSyncError);
            }

            setEditedLead(prev => ({ ...prev, caseId: trimmed }));

            if (!isSubmission && isRootLeadDocPath(leadDocPath)) {
                onUpdate({ ...editedLead, caseId: trimmed, leadDocPath: leadDocPath || editedLead.leadDocPath });
            }

            if (isRootLeadDocPath(leadDocPath) && !isSubmission) {
                onAddLogEntry(leadId, t('logEditedProfile'));
            } else {
                const logId = createUniqueId('log');
                await leadRef
                    .collection('logs')
                    .doc(logId)
                    .set({
                        id: logId,
                        timestamp: new Date(),
                        author: 'System User',
                        action: t('logEditedProfile'),
                    });
            }
            setIsCaseIdEditing(false);
        } catch (error: any) {
            if (error?.code === 'unavailable') {
                showPopup(t('offlineSaveSuccess', "You're offline, but your changes were saved locally. They'll sync automatically."));
                setIsCaseIdEditing(false);
            } else {
                console.error('Error updating Case ID:', error);
                showPopup(t('profileUpdateFailed', 'Failed to update student profile.'));
            }
        } finally {
            setIsCaseIdSaving(false);
        }
    }, [
        canEditCaseId,
        caseIdDraft,
        editedLead,
        isCaseIdSaving,
        isSubmission,
        leadId,
        leadDocPath,
        onAddLogEntry,
        onUpdate,
        setEditedLead,
        showPopup,
        t,
    ]);

    return {
        isCaseIdEditing,
        caseIdDraft,
        isCaseIdSaving,
        handleCaseIdEditClick,
        handleCaseIdDraftChange,
        handleCaseIdCancel,
        handleCaseIdSave,
    };
};
