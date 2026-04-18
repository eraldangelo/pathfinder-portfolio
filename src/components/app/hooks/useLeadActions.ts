import { useCallback } from 'react';
import { db, FieldValue } from '../../../services/firebase';
import type { Lead, LogEntry, Note } from '../../leads/leads-page/LeadsPage';
import type { User } from '../../../types';
import { getLeadDocRef } from '../../../utils/leadDocPath';

interface UseLeadActionsParams {
    user: User | null;
    showPopup: (message: string) => void;
    t: (key: string, options?: { [key: string]: string | number } | string) => string;
}

interface AddNoteOptions {
    silent?: boolean;
}

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
    if (!value || typeof value !== 'object') return false;
    const proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
};

const stripUndefinedForFirestore = (value: unknown): unknown => {
    if (typeof value === 'undefined') return undefined;
    if (Array.isArray(value)) {
        return value
            .map((item) => stripUndefinedForFirestore(item))
            .filter((item) => typeof item !== 'undefined');
    }
    if (!isPlainObject(value)) return value;

    const next: Record<string, unknown> = {};
    Object.entries(value).forEach(([key, childValue]) => {
        const cleaned = stripUndefinedForFirestore(childValue);
        if (typeof cleaned !== 'undefined') {
            next[key] = cleaned;
        }
    });
    return next;
};

export const useLeadActions = ({ user, showPopup, t }: UseLeadActionsParams) => {
    const createUniqueId = (suffix: string) => {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return `${crypto.randomUUID()}-${suffix}`;
        }
        return `${new Date().toISOString()}-${Math.random().toString(36).slice(2, 8)}-${suffix}`;
    };

    const updateLead = useCallback(async (updatedLead: Lead) => {
        try {
            const { adminStatus, adminNotes, notes, logs, ...rest } = updatedLead;
            const payload = (stripUndefinedForFirestore(rest) || {}) as Record<string, unknown>;
            delete payload.firstName;
            delete payload.middleName;
            delete payload.lastName;
            delete payload.consultationNotes;
            if (FieldValue?.delete) {
                payload.adminStatus = FieldValue.delete();
                payload.adminNotes = FieldValue.delete();
                payload.notes = FieldValue.delete();
                payload.logs = FieldValue.delete();
                payload.firstName = FieldValue.delete();
                payload.middleName = FieldValue.delete();
                payload.lastName = FieldValue.delete();
                payload.consultationNotes = FieldValue.delete();
            }
            await getLeadDocRef(db, updatedLead.id, updatedLead.leadDocPath).set(payload, { merge: true });
            showPopup(t('profileUpdateSuccess'));
        } catch (error: any) {
            if (error.code === 'unavailable') {
                showPopup(t('offlineSaveSuccess', "You're offline, but your changes were saved locally. They'll sync automatically."));
            } else {
                console.error('Error updating lead:', error);
                showPopup(t('profileUpdateFailed', 'Failed to update student profile.'));
            }
        }
    }, [showPopup, t]);

    const addLogEntry = useCallback(async (studentId: string, logMessage: string) => {
        if (!user) return;
        const logId = createUniqueId('log');
        const newLog: LogEntry = {
            id: logId,
            timestamp: new Date(),
            author: user.displayName || 'System User',
            action: logMessage,
        };
        try {
            await db
                .collection('leads')
                .doc(studentId)
                .collection('logs')
                .doc(logId)
                .set(newLog);
        } catch (error: any) {
            if (error.code === 'unavailable') {
                console.log('Offline: Log entry saved locally.');
            } else {
                console.error('Error adding log entry:', error);
            }
        }
    }, [user]);

    const addNote = useCallback(async (studentId: string, subject: string, content: string, options?: AddNoteOptions) => {
        if (!user) return;
        const noteId = createUniqueId('note');
        const newNote: Note = {
            id: noteId,
            subject,
            content,
            author: user.displayName || 'System User',
            timestamp: new Date(),
        };
        try {
            await db
                .collection('leads')
                .doc(studentId)
                .collection('notes')
                .doc(noteId)
                .set(newNote);
            if (!options?.silent) {
                showPopup(t('noteAddedSuccess'));
            }
        } catch (error: any) {
            if (error.code === 'unavailable') {
                if (!options?.silent) {
                    showPopup(t('offlineSaveSuccess', "You're offline, but your changes were saved locally. They'll sync automatically."));
                }
            } else {
                console.error('Error adding note:', error);
                if (!options?.silent) {
                    showPopup('Failed to add note.');
                }
            }
        }
    }, [showPopup, t, user]);

    return { updateLead, addLogEntry, addNote };
};

