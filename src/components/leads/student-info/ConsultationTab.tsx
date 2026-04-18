import React, { useCallback, useState } from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';
import type { Lead, Note } from '../leads-page/LeadsPageTypes';
import { auth, ensureFirebaseReady, firebaseApp } from '../../../services/firebase';
import {
    MIN_CONSULTATION_NOTES_LENGTH,
    countCharacters,
    normalizeConsultationStatus,
} from '../student-info-modal/consultation-actions/consultationActionUtils';
import { deriveAge, resolveTagDetailsNote } from './consultationTabUtils';
import ConsultationOverviewFields from './consultation-sections/ConsultationOverviewFields';
import ConsultationDetailsPanel from './consultation-sections/ConsultationDetailsPanel';

interface ConsultationTabProps {
    editedLead: Lead;
    isEditing: boolean;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    showPopup: (message: string) => void;
    notes: Note[];
    onSaveStatus: () => void;
    isStatusSaving: boolean;
    canEditConsultationTab: boolean;
    savedConsultationStatus?: Lead['consultationStatus'] | null;
}

const ConsultationTab: React.FC<ConsultationTabProps> = ({
    editedLead,
    isEditing,
    onInputChange,
    showPopup,
    notes,
    onSaveStatus,
    isStatusSaving,
    canEditConsultationTab,
    savedConsultationStatus,
}) => {
    const { t } = useTranslation();
    const [isOpeningStudyNavi, setIsOpeningStudyNavi] = useState(false);

    const age = deriveAge(editedLead.dob);
    const tagDetailsNote = resolveTagDetailsNote(
        notes,
        t('noteSubjectAdminScreening', 'Admin Screening').trim().toLowerCase(),
        t('noteSubjectAdmin', 'Admin').trim().toLowerCase()
    );
    const isGenuine = (editedLead.adminStatus || '').trim() === 'Genuine';

    const handleOpenStudyNavi = useCallback(async () => {
        if (isOpeningStudyNavi || typeof window === 'undefined') return;

        const popup = window.open('about:blank', '_blank');
        setIsOpeningStudyNavi(true);

        try {
            const ready = await ensureFirebaseReady();
            const firebaseNamespace = firebaseApp;

            if (!ready || !firebaseNamespace?.auth) {
                throw new Error(t('firebaseNotReady', 'Firebase is not ready. Please refresh the page and try again.'));
            }

            const currentUser = auth?.currentUser ?? firebaseNamespace.auth().currentUser;
            if (!currentUser) {
                throw new Error(t('loginSessionExpired', 'Your login session has expired. Please sign in again.'));
            }

            const idToken = await currentUser.getIdToken();
            const response = await fetch('/api/studynavi/sso', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify({ continueTo: '/' }),
            });

            const payload = await response.json().catch(() => ({}));
            const redirectUrl = typeof payload?.url === 'string' ? payload.url : '';

            if (!response.ok || !redirectUrl) {
                throw new Error(payload?.error || t('studyNaviOpenFailed', 'Unable to open StudyNavi right now.'));
            }

            if (popup && !popup.closed) {
                popup.location.href = redirectUrl;
            } else {
                window.location.href = redirectUrl;
            }
        } catch (error: any) {
            if (popup && !popup.closed) {
                popup.close();
            }

            const message = error?.message || t('studyNaviOpenFailed', 'Unable to open StudyNavi right now.');
            showPopup(message);
        } finally {
            setIsOpeningStudyNavi(false);
        }
    }, [isOpeningStudyNavi, showPopup, t]);

    const consultationStatusValue = normalizeConsultationStatus(editedLead.consultationStatus);
    const currentSavedConsultationStatus = normalizeConsultationStatus(savedConsultationStatus);
    const isGenuineStatusLocked =
        currentSavedConsultationStatus !== 'Genuine Student';
    const consultationNotes = editedLead.consultationNotes || '';
    const consultationNotesLength = countCharacters(consultationNotes);
    const hasMinimumConsultationLength = consultationNotesLength >= MIN_CONSULTATION_NOTES_LENGTH;
    const isBlockedGenuineSelection =
        isGenuineStatusLocked && consultationStatusValue === 'Genuine Student';
    const canSaveConsultationUpdate =
        canEditConsultationTab && hasMinimumConsultationLength && !isStatusSaving && !isBlockedGenuineSelection;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:[grid-template-columns:minmax(0,1.35fr)_minmax(0,1.35fr)_minmax(0,1.15fr)_minmax(0,0.55fr)_minmax(0,1fr)] gap-6">
            <h4 className="md:col-span-2 lg:col-span-5 text-lg font-semibold text-[#004097] dark:text-blue-400 border-b border-black/5 dark:border-white/5 pb-2">
                {t('consultation')}
            </h4>
            <ConsultationOverviewFields
                editedLead={editedLead}
                isEditing={isEditing}
                onInputChange={onInputChange}
                age={age}
                isOpeningStudyNavi={isOpeningStudyNavi}
                onOpenStudyNavi={handleOpenStudyNavi}
            />
            <ConsultationDetailsPanel
                t={t}
                isGenuine={isGenuine}
                tagDetailsNote={tagDetailsNote}
                consultationStatusValue={consultationStatusValue}
                onInputChange={onInputChange}
                canEditConsultationTab={canEditConsultationTab}
                isStatusSaving={isStatusSaving}
                isGenuineStatusLocked={isGenuineStatusLocked}
                consultationNotes={consultationNotes}
                consultationNotesLength={consultationNotesLength}
                hasMinimumConsultationLength={hasMinimumConsultationLength}
                onSaveStatus={onSaveStatus}
                canSaveConsultationUpdate={canSaveConsultationUpdate}
            />
        </div>
    );
};

export default ConsultationTab;
