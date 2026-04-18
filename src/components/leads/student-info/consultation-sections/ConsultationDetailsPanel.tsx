import React from 'react';
import type { Note } from '../../leads-page/LeadsPageTypes';
import { IdCardIcon } from '../icons';
import {
    CONSULTATION_STATUS_OPTIONS,
    MIN_CONSULTATION_NOTES_LENGTH,
} from '../../student-info-modal/consultation-actions/consultationActionUtils';

interface ConsultationDetailsPanelProps {
    t: (key: string, defaultValue?: string) => string;
    isGenuine: boolean;
    tagDetailsNote: Note | null;
    consultationStatusValue: string;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    canEditConsultationTab: boolean;
    isStatusSaving: boolean;
    isGenuineStatusLocked: boolean;
    consultationNotes: string;
    consultationNotesLength: number;
    hasMinimumConsultationLength: boolean;
    onSaveStatus: () => void;
    canSaveConsultationUpdate: boolean;
}

const formatTaggedDate = (date: Date) =>
    new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(date);

const ConsultationDetailsPanel: React.FC<ConsultationDetailsPanelProps> = ({
    t,
    isGenuine,
    tagDetailsNote,
    consultationStatusValue,
    onInputChange,
    canEditConsultationTab,
    isStatusSaving,
    isGenuineStatusLocked,
    consultationNotes,
    consultationNotesLength,
    hasMinimumConsultationLength,
    onSaveStatus,
    canSaveConsultationUpdate,
}) => (
    <div className="lg:col-span-5 border-t border-black/5 dark:border-white/5 pt-5">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2 space-y-4">
                <h5 className="text-sm font-semibold text-[#004097] dark:text-blue-400">
                    {t('genuineTagDetails', 'Genuine Tag Details')}
                </h5>
                <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t('taggedByAdminLabel', 'Tagged By')}
                    </p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-white mt-1">
                        {isGenuine ? (tagDetailsNote?.author || t('notSet')) : t('notSet')}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t('taggedDateLabel', 'Tagged Date')}
                    </p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-white mt-1">
                        {isGenuine && tagDetailsNote?.timestamp
                            ? formatTaggedDate(tagDetailsNote.timestamp)
                            : t('notSet')}
                    </p>
                </div>
                <div className="pt-3 border-t border-black/5 dark:border-white/5">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t('adminNotesLabel', 'Admin Notes')}
                    </p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-white mt-1 whitespace-pre-wrap break-words">
                        {isGenuine ? (tagDetailsNote?.content || t('notSet')) : t('notSet')}
                    </p>
                </div>
            </div>
            <div className="lg:col-span-3 min-h-[140px] lg:border-l lg:border-black/5 lg:dark:border-white/5 lg:pl-6">
                <div className="space-y-4">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 text-blue-500 mt-1">
                            <IdCardIcon />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {t('currentStatusLabel', 'Current Status')}
                            </p>
                            <select
                                name="consultationStatus"
                                value={consultationStatusValue}
                                onChange={onInputChange}
                                disabled={!canEditConsultationTab || isStatusSaving}
                                className="w-full max-w-[280px] text-sm font-semibold bg-black/5 dark:bg-white/5 p-2 rounded-md mt-1 border border-black/10 dark:border-white/10 focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {CONSULTATION_STATUS_OPTIONS.map((status) => (
                                    <option
                                        key={status}
                                        value={status}
                                        disabled={isGenuineStatusLocked && status === 'Genuine Student'}
                                    >
                                        {status}
                                    </option>
                                ))}
                            </select>
                            {isGenuineStatusLocked && (
                                <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                                    {t(
                                        'consultationStatusRevertBlocked',
                                        'Consultation status cannot be changed back to Genuine Student.',
                                    )}
                                </p>
                            )}
                        </div>
                    </div>

                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {t('consultationNotesLabel', 'Consultation Notes')}
                        </p>
                        <textarea
                            name="consultationNotes"
                            value={consultationNotes}
                            onChange={onInputChange}
                            rows={7}
                            disabled={!canEditConsultationTab || isStatusSaving}
                            className="w-full text-sm bg-black/5 dark:bg-white/5 p-3 rounded-md mt-1 border border-black/10 dark:border-white/10 focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-70 disabled:cursor-not-allowed resize-none"
                            placeholder={t('consultationNotesPlaceholder', 'Enter at least 150 characters.')}
                        />
                        <p className={`mt-2 text-xs ${hasMinimumConsultationLength ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                            {consultationNotesLength}/{MIN_CONSULTATION_NOTES_LENGTH} {t('characters', 'characters')}
                        </p>
                    </div>

                    <button
                        type="button"
                        className="glass-btn pathfinder-green rounded-full h-11 w-11 p-0"
                        aria-label={t('save')}
                        title={t('save')}
                        onClick={onSaveStatus}
                        disabled={!canSaveConsultationUpdate}
                    >
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-5 w-5"
                        >
                            <path d="M20 6L9 17l-5-5" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    </div>
);

export default ConsultationDetailsPanel;
