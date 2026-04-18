import { useCallback } from 'react';
import { db } from '../../../../services/firebase';
import type { User } from '../../../../types';
import { getLeadDocRef, isRootLeadDocPath } from '../../../../utils/leadDocPath';

interface UseStudentInfoModalAddNoteParams {
  isSubmission: boolean;
  leadId: string;
  leadDocPath?: string;
  user: User;
  onAddNote: (studentId: string, subject: string, content: string) => void;
  showPopup: (message: string) => void;
  t: (key: string, options?: { [key: string]: string | number } | string) => string;
}

const createUniqueId = (suffix: string) => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${crypto.randomUUID()}-${suffix}`;
  }
  return `${new Date().toISOString()}-${Math.random().toString(36).slice(2, 8)}-${suffix}`;
};

export const useStudentInfoModalAddNote = ({
  isSubmission,
  leadId,
  leadDocPath,
  user,
  onAddNote,
  showPopup,
  t,
}: UseStudentInfoModalAddNoteParams) =>
  useCallback(
    (noteContent: string) => {
      const trimmedContent = noteContent.trim();
      if (!trimmedContent) return;

      if (!isSubmission && isRootLeadDocPath(leadDocPath)) {
        onAddNote(leadId, t('noteSubjectGeneralNotes'), trimmedContent);
        return;
      }

      if (!db || !user) {
        showPopup(t('firebaseNotReady', 'Firebase is not ready. Please refresh the page and try again.'));
        return;
      }

      const noteId = createUniqueId('general-note');
      const note = {
        id: noteId,
        subject: t('noteSubjectGeneralNotes'),
        content: trimmedContent,
        author: user.displayName || 'System User',
        timestamp: new Date(),
      };

      getLeadDocRef(db, leadId, leadDocPath)
        .collection('notes')
        .doc(noteId)
        .set(note)
        .then(() => showPopup(t('noteAddedSuccess')))
        .catch((error: any) => {
          if (error?.code === 'unavailable') {
            showPopup(
              t(
                'offlineSaveSuccess',
                "You're offline, but your changes were saved locally. They'll sync automatically."
              )
            );
            return;
          }
          console.error('Error adding submission note:', error);
          showPopup(t('noteAddFailed', 'Failed to add note.'));
        });
    },
    [isSubmission, leadId, leadDocPath, onAddNote, showPopup, t, user]
  );
