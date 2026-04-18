import React, { useState } from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';
import type { Note } from '../leads-page/LeadsPage';

// Icons
const PlusIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

interface NotesTabProps {
    notes: Note[];
    onAddNote: (noteContent: string) => void;
    isActionAllowed: boolean;
    adminStatus?: string | null;
    consultationStatus?: string | null;
}

const NotesTab: React.FC<NotesTabProps> = ({ notes, onAddNote, isActionAllowed, adminStatus, consultationStatus }) => {
    const { t } = useTranslation();
    const [newNote, setNewNote] = useState('');
    const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

    const handleAddClick = () => {
        onAddNote(newNote);
        setNewNote('');
    };
    
    const toggleNoteExpansion = (noteId: string) => {
        setExpandedNotes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(noteId)) {
                newSet.delete(noteId);
            } else {
                newSet.add(noteId);
            }
            return newSet;
        });
    };

    const formatTimestamp = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        }).format(date);
    };

    const normalize = (value: string) => value.trim().toLowerCase();

    const subjectAdminLegacy = normalize(t('noteSubjectAdminScreening', 'Admin Screening'));
    const subjectAdminBase = normalize(t('noteSubjectAdmin', 'Admin'));
    const subjectConsultationBase = normalize(t('noteSubjectConsultation', 'Consultation'));

    const extractStatusSuffix = (subject: string) => {
        const colonIndex = subject.indexOf(':');
        if (colonIndex < 0) return null;
        return subject.slice(colonIndex + 1).trim() || null;
    };

    return (
        <div className="space-y-4">
            <div className="p-4 rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
                <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={4}
                    placeholder={isActionAllowed ? t('addNotePlaceholder') : t('addNoteRestricted')}
                    className="w-full bg-transparent p-2 text-sm outline-none resize-none disabled:opacity-70"
                    disabled={!isActionAllowed}
                />
                <div className="flex justify-end pt-2 border-t border-black/5 dark:border-white/5">
                    <button
                        onClick={handleAddClick}
                        disabled={!newNote.trim() || !isActionAllowed}
                        title={!isActionAllowed ? t('addNoteTooltip') : t('addNote')}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-blue-500/40 bg-blue-500/20 text-blue-700 shadow-md shadow-blue-500/25 transition-colors hover:bg-blue-500/30 dark:border-blue-300/40 dark:bg-blue-500/25 dark:text-blue-100 dark:hover:bg-blue-500/35 disabled:cursor-not-allowed disabled:border-gray-300/60 disabled:bg-gray-300/50 disabled:text-gray-500 dark:disabled:border-gray-600/60 dark:disabled:bg-gray-700/40 dark:disabled:text-gray-400"
                    >
                        <PlusIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
            
            <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar pr-2">
                {notes.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                        {t('noNotesAvailable')}
                    </div>
                ) : (
                    notes.map((note, index) => {
                        const isExpanded = expandedNotes.has(note.id);
                        const subjectRaw = (note.subject || '').trim();
                        const subjectNormalized = normalize(subjectRaw);

                        const isAdminNote =
                            subjectNormalized === subjectAdminLegacy
                            || subjectNormalized.startsWith(subjectAdminLegacy)
                            || subjectNormalized.startsWith(subjectAdminBase);

                        const isConsultationNote = subjectNormalized.startsWith(subjectConsultationBase);

                        const statusFromSubject = extractStatusSuffix(subjectRaw);
                        const title = (() => {
                            if (isAdminNote) {
                                const status = statusFromSubject || adminStatus || null;
                                const base = t('noteSubjectAdmin', 'Admin');
                                return status ? `${base}: ${status}` : base;
                            }
                            if (isConsultationNote) {
                                const status = statusFromSubject || consultationStatus || null;
                                const base = t('noteSubjectConsultation', 'Consultation');
                                return status ? `${base}: ${status}` : base;
                            }
                            return subjectRaw || note.author;
                        })();
                        return (
                             <div 
                                key={`${note.id}-${index}`}
                                onDoubleClick={() => toggleNoteExpansion(note.id)}
                                className="p-4 rounded-lg bg-white/50 dark:bg-black/20 border border-black/5 dark:border-white/5 cursor-pointer"
                            >
                                <div className="text-sm text-gray-800 dark:text-gray-200">
                                    <div className="font-bold text-[#004097] dark:text-blue-400">{title}</div>
                                    <div
                                        className={`mt-2 pt-2 border-t border-black/10 dark:border-white/10 whitespace-pre-wrap transition-all duration-300 ${!isExpanded ? 'line-clamp-2' : ''}`}
                                    >
                                        {note.content}
                                    </div>
                                </div>
                                <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 flex justify-between items-center">
                                    <span>{t('byAuthor', { author: note.author })}</span>
                                    <span>{formatTimestamp(note.timestamp)}</span>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    );
};

export default NotesTab;

