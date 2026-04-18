import type { Dispatch, SetStateAction } from 'react';
import { db, FieldValue } from '../../../../services/firebase';
import type { ConsultationStatus, Lead } from '../../leads-page/LeadsPageTypes';
import { getLeadDocRef } from '../../../../utils/leadDocPath';
import {
    MIN_CONSULTATION_NOTES_LENGTH,
    buildConsultationNotesLogMessage,
    buildConsultationStatusLogMessage,
    countCharacters,
    normalizeConsultationStatus,
} from './consultationActionUtils';

interface PerformConsultationStatusSaveParams {
    leadId: string;
    leadDocPath?: string;
    leadConsultationStatus?: ConsultationStatus | null;
    editedLead: Lead;
    setEditedLead: Dispatch<SetStateAction<Lead>>;
    userId?: string | null;
    userName?: string | null;
    showPopup: (message: string) => void;
    t: (key: string, options?: { [key: string]: string | number } | string) => string;
}

const createUniqueId = (suffix: string) => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return `${crypto.randomUUID()}-${suffix}`;
    }
    return `${new Date().toISOString()}-${Math.random().toString(36).slice(2, 8)}-${suffix}`;
};

export const performConsultationStatusSave = async ({
    leadId,
    leadDocPath,
    leadConsultationStatus,
    editedLead,
    setEditedLead,
    userId,
    userName,
    showPopup,
    t,
}: PerformConsultationStatusSaveParams): Promise<ConsultationStatus | null> => {
    if (!db) {
        showPopup(t('firebaseNotReady', 'Firebase is not ready. Please refresh the page and try again.'));
        return null;
    }

    const statusValue = normalizeConsultationStatus(editedLead.consultationStatus);
    const notesValue = (editedLead.consultationNotes || '').trim();
    const notesLength = countCharacters(notesValue);
    const previousStatus = normalizeConsultationStatus(leadConsultationStatus);
    const isBlockedGenuineRevert =
        previousStatus !== 'Genuine Student' && statusValue === 'Genuine Student';

    if (isBlockedGenuineRevert) {
        showPopup(
            t(
                'consultationStatusRevertBlocked',
                'Consultation status cannot be changed back to Genuine Student.',
            ),
        );
        return null;
    }

    if (notesLength < MIN_CONSULTATION_NOTES_LENGTH) {
        showPopup(
            t('consultationNotesMinimumRequired', { min: MIN_CONSULTATION_NOTES_LENGTH }),
        );
        return null;
    }

    const statusChanged = statusValue !== previousStatus;
    const leadName = editedLead.fullName?.trim() || t('leadNameFallback', 'This lead');
    const author = userName || 'System User';
    const now = new Date();
    const statusLogMessage = buildConsultationStatusLogMessage(t, leadName, statusValue);
    const notesLogMessage = buildConsultationNotesLogMessage(t, leadName);
    const noteSubjectBase = t('noteSubjectConsultation', 'Consultation');
    const noteSubject = `${noteSubjectBase}: ${statusValue}`;

    const noteEntry = {
        id: createUniqueId('consultation-note'),
        subject: noteSubject,
        content: notesValue,
        author,
        timestamp: now,
    };

    const logEntry = {
        id: createUniqueId('consultation-log'),
        timestamp: now,
        author,
        action: statusChanged ? statusLogMessage : notesLogMessage,
    };

    const statusEntry = {
        id: createUniqueId('consultation-status'),
        status: statusValue,
        source: 'consultation',
        author,
        authorUid: userId ?? null,
        timestamp: now,
    };

    const leadRef = getLeadDocRef(db, leadId, leadDocPath);
    const noteRef = leadRef.collection('notes').doc(noteEntry.id);
    const logRef = leadRef.collection('logs').doc(logEntry.id);
    const statusRef = leadRef.collection('status').doc(statusEntry.id);
    const batch = db.batch();
    const deleteField = FieldValue?.delete;
    if (deleteField) {
        batch.set(
            leadRef,
            {
                consultationStatus: deleteField(),
                consultationNotes: deleteField(),
                consultationUpdatedAt: deleteField(),
                consultationUpdatedBy: deleteField(),
                consultationUpdatedByUid: deleteField(),
            },
            { merge: true },
        );
    }
    batch.set(noteRef, noteEntry);
    batch.set(logRef, logEntry);
    batch.set(statusRef, statusEntry);
    await batch.commit();

    setEditedLead((prev) => ({
        ...prev,
        consultationStatus: statusValue,
        consultationNotes: '',
    }));

    showPopup(statusChanged ? statusLogMessage : t('consultationSavedSuccess', 'Consultation details saved.'));
    return statusValue;
};
