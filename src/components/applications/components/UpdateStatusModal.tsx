import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { ApplicationStatus, ApplicationStatusHistory } from '../../../data/applications';
import { useTranslation } from '../../../contexts/LanguageContext';
import { inputField, modalBackdropDim } from '../../common/styles/ui';
import { getStatusLabel } from '../utils/ApplicationDetailUtils';

const XIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6l-12 12" />
    </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 6 9 17l-5-5" />
    </svg>
);

interface UpdateStatusModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentStatus: ApplicationStatus;
    onUpdate: (newStatus: ApplicationStatus, notes: string) => void;
    statuses: readonly ApplicationStatus[];
    applicationHistory: ApplicationStatusHistory[];
}

const UpdateStatusModal: React.FC<UpdateStatusModalProps> = ({ isOpen, onClose, currentStatus, onUpdate, statuses, applicationHistory }) => {
    const { t } = useTranslation();
    const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus | ''>('');
    const [notes, setNotes] = useState('');
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isOpen || typeof document === 'undefined') return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            // Don't pre-select the current status, force user to make a choice.
            setSelectedStatus('');
            setNotes('');
        }
    }, [isOpen, currentStatus]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedStatus && notes.trim().length >= 20) {
            onUpdate(selectedStatus, notes);
        }
    };

    if (!isOpen || !isMounted) return null;

    const historyStatuses = new Set(applicationHistory.map(h => h.status));
    const selectableStatuses = statuses.filter(
        (status) => status !== 'Application Ended' && !historyStatuses.has(status)
    );

    return createPortal(
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center overflow-hidden p-4 md:p-6 animate-fade-in"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="update-status-modal-title"
        >
            <div className={`${modalBackdropDim} animate-fade-in`} aria-hidden="true" />
            <div
                className="relative flex flex-col w-full max-w-xl max-h-[calc(100svh-2rem)] md:max-h-[calc(100svh-4rem)] bg-white/40 dark:bg-black/30 backdrop-blur-2xl border border-white/30 dark:border-white/20 rounded-3xl shadow-2xl text-gray-800 dark:text-white transform opacity-0 scale-95 animate-fade-in-scale"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="relative p-4 sm:p-5 border-b border-black/5 dark:border-white/5 flex justify-center items-center flex-shrink-0">
                    <h2 id="update-status-modal-title" className="text-lg font-bold text-[#004097] dark:text-blue-400">
                        {t('updateApplicationStatusTitle')}
                    </h2>
                    <div className="absolute right-4 sm:right-5 top-1/2 -translate-y-1/2">
                        <button onClick={onClose} className="w-3.5 h-3.5 rounded-full bg-red-500 hover:bg-red-600" aria-label={t('closeModal', 'Close')} />
                    </div>
                </header>

                <form onSubmit={handleSubmit} className="flex flex-1 flex-col min-h-0">
                    <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar p-4 sm:p-6 space-y-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {t('currentStatusLabel')} <span className="font-semibold text-gray-800 dark:text-gray-200">{getStatusLabel(t, currentStatus)}</span>
                        </p>

                        <div>
                            <label htmlFor="status" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                {t('selectNewStatusLabel')}
                            </label>
                            <select
                                id="status"
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value as ApplicationStatus)}
                                className={`${inputField} text-sm font-semibold`}
                            >
                                <option value="" disabled>{t('selectNewStatusLabel')}</option>
                                {selectableStatuses.map(status => (
                                    <option
                                        key={status}
                                        value={status}
                                    >
                                        {getStatusLabel(t, status)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="notes" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                {t('notesLabel')} <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={5}
                                placeholder={t('notesPlaceholder')}
                                className={`${inputField} text-sm`}
                            />
                            <p className={`text-xs text-right mt-1 ${notes.trim().length < 20 ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                                {t('charactersMinimum', { current: notes.trim().length, min: 20 })}
                            </p>
                        </div>
                    </div>

                    <footer className="p-4 sm:p-5 border-t border-black/5 dark:border-white/5 flex-shrink-0 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center"
                            aria-label={t('cancel')}
                            title={t('cancel')}
                        >
                            <XIcon />
                        </button>
                        <button
                            type="submit"
                            disabled={!selectedStatus || notes.trim().length < 20}
                            className="w-12 h-12 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center"
                            aria-label={t('updateStatus')}
                            title={t('updateStatus')}
                        >
                            <CheckIcon />
                        </button>
                    </footer>
                </form>
            </div>
            <style>{`
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
                @keyframes fade-in-scale { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                .animate-fade-in-scale { animation: fade-in-scale 0.2s ease-out forwards; animation-delay: 0.05s; }
            `}</style>
        </div>,
        document.body
    );
};

export default UpdateStatusModal;

