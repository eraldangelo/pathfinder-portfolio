import { db } from '../../../../services/firebase';
import { dispatchNotifications } from '../../../../services/notificationsApi';
import type { AdminStatus, Lead } from '../../leads-page/LeadsPageTypes';
import { getLeadDocRef } from '../../../../utils/leadDocPath';
import {
    buildGenuineToastMessage,
    buildStatusLogMessage,
    isBranchManagerRole,
    isFinalAdminStatus,
    isOperationsRole,
    MIN_ADMIN_NOTES_LENGTH,
    normalizeAdminStatus,
    normalizeBranchKey,
} from './adminActionUtils';

interface PerformAdminStatusSaveParams {
    leadId: string;
    leadDocPath?: string;
    leadAdminStatus?: AdminStatus | null;
    leadAssignedCounsellorUid?: string | null;
    isSubmission: boolean;
    editedLead: Lead;
    setEditedLead: React.Dispatch<React.SetStateAction<Lead>>;
    userId?: string | null;
    userName?: string | null;
    showPopup: (message: string) => void;
    t: (key: string, options?: { [key: string]: string | number } | string) => string;
    setIsAdminStatusLocked: (value: boolean) => void;
    setIsEndorsementLocked: (value: boolean) => void;
}

const createUniqueId = (suffix: string) => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return `${crypto.randomUUID()}-${suffix}`;
    }
    return `${new Date().toISOString()}-${Math.random().toString(36).slice(2, 8)}-${suffix}`;
};

export const performAdminStatusSave = async ({
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
}: PerformAdminStatusSaveParams) => {
    const statusValue = normalizeAdminStatus(editedLead.adminStatus);
    const leadRef = getLeadDocRef(db, leadId, leadDocPath);
    const leadName = editedLead.fullName?.trim() || t('leadNameFallback', 'This lead');
    const notesValue = (editedLead.adminNotes || '').trim();
    const selectedName = (editedLead.assignedCounsellor || '').trim();
    const selectedUid = (editedLead.assignedCounsellorUid || '').trim();
    const previousStatus = normalizeAdminStatus(leadAdminStatus);
    const previousCounsellorUid = (leadAssignedCounsellorUid || '').trim();
    const statusChanged = statusValue !== previousStatus;
    const endorsementChanged = statusValue === 'Genuine' && selectedUid && selectedUid !== previousCounsellorUid;
    const logMessages: string[] = [];
    const statusLogMessage = buildStatusLogMessage(t, leadName, statusValue);
    const toastStatusMessage =
        statusValue === 'Genuine'
            ? buildGenuineToastMessage(leadName, selectedName)
            : statusLogMessage;
    const statusEntry = statusChanged
        ? {
              id: createUniqueId('status'),
              status: statusValue,
              source: 'admin',
              author: userName || 'System User',
              authorUid: userId ?? null,
              timestamp: new Date(),
          }
        : null;

    if (notesValue.length < MIN_ADMIN_NOTES_LENGTH) {
        showPopup(
            t('adminNotesMinimumRequired', { min: MIN_ADMIN_NOTES_LENGTH })
        );
        return;
    }

    if (statusValue === 'Genuine' && (!selectedName || !selectedUid)) {
        showPopup(t('endorsedCounsellorRequired', 'Please select an endorsed counsellor before updating.'));
        return;
    }

    if (statusChanged) {
        logMessages.push(statusLogMessage);
    }
    if (endorsementChanged) {
        logMessages.push(t('logLeadEndorsed', { name: selectedName }));
    }

    const noteSubjectBase = t('noteSubjectAdmin', 'Admin');
    const noteSubject = `${noteSubjectBase}: ${statusValue}`;

    const noteEntry = {
        id: createUniqueId('note'),
        subject: noteSubject,
        content: notesValue,
        author: userName || 'System User',
        timestamp: new Date(),
    };
    const logEntries = logMessages.map((action) => ({
        id: createUniqueId('log'),
        timestamp: new Date(),
        author: userName || 'System User',
        action,
    }));
    const adminNotesField = '';

    const sendGenuineNotifications = async () => {
        if (!db || !selectedUid) return;

        const leadBranch = (editedLead.branch || '').trim();
        const branchKey = normalizeBranchKey(leadBranch);
        const message = buildGenuineToastMessage(leadName, selectedName);

        try {
            const recipients = new Set<string>();
            recipients.add(selectedUid);

            if (branchKey) {
                const personnelSnapshot = await db.collection('personnel').get();
                personnelSnapshot.docs.forEach((doc: any) => {
                    const data = doc.data() || {};
                    const branchMatches = normalizeBranchKey(String(data.branch || '')) === branchKey;
                    if (!branchMatches) return;
                    if (!isOperationsRole(data.role) && !isBranchManagerRole(data.role)) return;
                    if (userId && doc.id === userId) return;
                    recipients.add(doc.id);
                });
            }

            if (userId && recipients.has(userId)) {
                recipients.delete(userId);
            }

            if (!recipients.size) return;
            await dispatchNotifications(
                Array.from(recipients).map((recipientId) => ({
                    recipientUid: recipientId,
                    message,
                    data: {
                        eventKey: 'leadEndorsed',
                        requesterName: leadName,
                        requesterBranch: leadBranch || null,
                        requesterRole: 'admin screening',
                    },
                }))
            );
        } catch (error) {
            console.error('Error sending genuine lead notifications:', error);
        }
    };

    if (isSubmission) {
        const payload: Record<string, unknown> = {};
        if (statusValue === 'Genuine') {
            payload.assignedCounsellor = selectedName;
            payload.assignedCounsellorUid = selectedUid;
        }
        if (Object.keys(payload).length > 0) {
            await leadRef.set(payload, { merge: true });
        }
        const writes: Array<Promise<unknown>> = [
            Promise.all(
                logEntries.map((entry) =>
                    leadRef.collection('logs').doc(entry.id).set(entry)
                )
            ),
            leadRef.collection('notes').doc(noteEntry.id).set(noteEntry),
        ];
        if (statusEntry) {
            writes.push(
                leadRef
                    .collection('status')
                    .doc(statusEntry.id)
                    .set(statusEntry)
            );
        }
        await Promise.all(writes);
        if (statusChanged && statusValue === 'Genuine') {
            await sendGenuineNotifications();
        }
        setEditedLead(prev => ({
            ...prev,
            adminStatus: statusValue,
            adminNotes: adminNotesField,
            ...(statusValue === 'Genuine'
                ? { assignedCounsellor: selectedName, assignedCounsellorUid: selectedUid }
                : {}),
        }));
        showPopup(statusChanged ? toastStatusMessage : t('profileUpdateSuccess'));
    } else {
        const updatedLead = {
            ...editedLead,
            adminStatus: statusValue,
            adminNotes: adminNotesField,
            ...(statusValue === 'Genuine'
                ? { assignedCounsellor: selectedName, assignedCounsellorUid: selectedUid }
                : {}),
        };
        setEditedLead(prev => ({
            ...updatedLead,
            notes: prev.notes,
        }));
        const payload: Record<string, unknown> = {};
        if (statusValue === 'Genuine') {
            payload.assignedCounsellor = selectedName;
            payload.assignedCounsellorUid = selectedUid;
        }
        if (Object.keys(payload).length > 0) {
            await leadRef.set(payload, { merge: true });
        }
        await Promise.all(
            logEntries.map((entry) => leadRef.collection('logs').doc(entry.id).set(entry))
        );
        await leadRef.collection('notes').doc(noteEntry.id).set(noteEntry);
        if (statusEntry) {
            await leadRef.collection('status').doc(statusEntry.id).set(statusEntry);
        }
        if (statusChanged && statusValue === 'Genuine') {
            await sendGenuineNotifications();
        }
        showPopup(statusChanged ? toastStatusMessage : t('profileUpdateSuccess'));
    }

    if (isFinalAdminStatus(statusValue)) {
        setIsAdminStatusLocked(true);
        if (statusValue === 'Genuine') {
            setIsEndorsementLocked(true);
        }
    }
};
