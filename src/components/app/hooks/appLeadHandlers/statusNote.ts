import type { TranslateFn } from './types';

export const logStatusUpdateWithOptionalNote = (
    {
        addLogEntry,
        addNote,
        t,
    }: {
        addLogEntry: (studentId: string, logMessage: string) => void;
        addNote: (studentId: string, subject: string, content: string, options?: { silent?: boolean }) => void | Promise<void>;
        t: TranslateFn;
    },
    {
        studentId,
        newStatus,
        providerName,
        noteContent,
    }: {
        studentId: string;
        newStatus: string;
        providerName: string;
        noteContent: string;
    }
) => {
    const buildStatusNoteSubject = () => {
        const base = String(t('noteSubjectSchoolApplication', 'Application Status Update') || '')
            .trim()
            .replace(/:+$/, '');
        const status = String(newStatus || '').trim();
        return status ? `${base}: ${status}` : base;
    };

    addLogEntry(studentId, t('logStatusUpdate', { providerName, newStatus, noteContent }));
    if (noteContent.trim()) {
        addNote(studentId, buildStatusNoteSubject(), noteContent, { silent: true });
    }
};
