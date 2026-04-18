import { useEffect, useState } from 'react';
import { db } from '../../../../services/firebase';
import type { LogEntry, Note } from '../../leads-page/LeadsPageTypes';
import { getLeadDocRef } from '../../../../utils/leadDocPath';

const toDate = (value?: { toDate?: () => Date } | Date | null) => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'object' && typeof value.toDate === 'function') {
        return value.toDate();
    }
    return null;
};

const mapLogs = (docs: any[]): LogEntry[] =>
    docs
        .map((doc) => {
            const data = doc.data ? doc.data() : doc;
            return {
                id: doc.id || data?.id || `${new Date().toISOString()}-log-${doc.id || 'fallback'}`,
                author: data?.author || 'System User',
                action: data?.action || '',
                timestamp: toDate(data?.timestamp) || new Date(),
            } as LogEntry;
        })
        .filter((log) => log.action);

const mapNotes = (docs: any[]): Note[] =>
    docs
        .map((doc) => {
            const data = doc.data ? doc.data() : doc;
            return {
                id: doc.id || data?.id || `${new Date().toISOString()}-note-${doc.id || 'fallback'}`,
                subject: data?.subject || 'Admin Screening',
                content: data?.content || '',
                author: data?.author || 'System User',
                timestamp: toDate(data?.timestamp) || new Date(),
            } as Note;
        })
        .filter((note) => note.content);

const normalizeFallbackLogs = (logs: LogEntry[]): LogEntry[] =>
    logs.map((log, index) => ({
        ...log,
        id: log.id || `${new Date().toISOString()}-log-${index}`,
        author: log.author || 'System User',
        action: log.action || '',
        timestamp: toDate(log.timestamp as unknown as Date) || new Date(),
    })).filter((log) => log.action);

const normalizeFallbackNotes = (notes: Note[]): Note[] =>
    notes.map((note, index) => ({
        ...note,
        id: note.id || `${new Date().toISOString()}-note-${index}`,
        subject: note.subject || 'Admin Screening',
        content: note.content || '',
        author: note.author || 'System User',
        timestamp: toDate(note.timestamp as unknown as Date) || new Date(),
    })).filter((note) => note.content);

export const useStudentInfoModalActivity = (
    leadId: string,
    leadDocPath: string | undefined,
    _isSubmission: boolean,
    fallbackLogs: LogEntry[] = [],
    fallbackNotes: Note[] = [],
) => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);

    useEffect(() => {
        if (!leadId) return;
        const leadRef = getLeadDocRef(db, leadId, leadDocPath);

        const logsRef = leadRef
            .collection('logs')
            .orderBy('timestamp', 'desc');

        const notesRef = leadRef
            .collection('notes')
            .orderBy('timestamp', 'desc');

        const unsubscribeLogs = logsRef.onSnapshot(
            (snapshot: any) => {
                const docs = snapshot.docs || [];
                const primary = mapLogs(docs);
                const fallback = fallbackLogs.length ? normalizeFallbackLogs(fallbackLogs) : [];
                const merged = new Map<string, LogEntry>();
                [...primary, ...fallback].forEach((log) => {
                    merged.set(log.id, log);
                });
                setLogs(Array.from(merged.values()));
            },
            (error: any) => console.error('Error loading logs:', error)
        );

        const unsubscribeNotes = notesRef.onSnapshot(
            (snapshot: any) => {
                const docs = snapshot.docs || [];
                const primary = mapNotes(docs);
                const fallback = fallbackNotes.length ? normalizeFallbackNotes(fallbackNotes) : [];
                const merged = new Map<string, Note>();
                [...primary, ...fallback].forEach((note) => {
                    merged.set(note.id, note);
                });
                setNotes(Array.from(merged.values()));
            },
            (error: any) => console.error('Error loading notes:', error)
        );

        return () => {
            unsubscribeLogs();
            unsubscribeNotes();
        };
    }, [leadId, leadDocPath, fallbackLogs, fallbackNotes]);

    return { logs, notes };
};
