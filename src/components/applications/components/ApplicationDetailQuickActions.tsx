import React, { useState } from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';
import type { ActionGuard } from '../types/ApplicationDetailTypes';
import { buttonPrimary, buttonSecondary, inputField, modalOverlay, modalSurface } from '../../common/styles/ui';
import { PencilIcon, PlusCircleIcon } from './icons';

interface QuickActionButtonProps {
    onClick: () => void;
    disabled: boolean;
    title: string;
    className: string;
    children: React.ReactNode;
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({ onClick, disabled, title, className, children }) => (
    <button onClick={onClick} disabled={disabled} title={title} className={className}>
        {children}
    </button>
);

interface QuickActionsSectionProps {
    actionGuard: ActionGuard;
    onOpenStatusModal: () => void;
    onAddGeneralNote: (noteContent: string) => void;
}

const QuickActionsSection: React.FC<QuickActionsSectionProps> = ({
    actionGuard,
    onOpenStatusModal,
    onAddGeneralNote,
}) => {
    const { t } = useTranslation();
    const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
    const [noteContent, setNoteContent] = useState('');
    const baseClass = `w-full flex items-center gap-3 p-3 rounded-lg text-left font-medium transition-colors ${actionGuard.disabledClasses}`;
    const standardClass = `${baseClass} bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10`;

    const closeAddNoteModal = () => {
        setIsAddNoteModalOpen(false);
        setNoteContent('');
    };

    const handleSaveGeneralNote = () => {
        const trimmed = noteContent.trim();
        if (!trimmed || !actionGuard.isActionAllowed) return;
        onAddGeneralNote(trimmed);
        closeAddNoteModal();
    };

    return (
        <>
            <div className="p-4 rounded-2xl backdrop-blur-md bg-white/30 dark:bg-black/20 shadow-lg border border-white/40 dark:border-white/10">
                <h3 className="text-lg font-semibold text-[#004097] dark:text-blue-300 mb-4">{t('quickActions')}</h3>
                <div className="space-y-2">
                    <QuickActionButton
                        onClick={onOpenStatusModal}
                        disabled={!actionGuard.isActionAllowed}
                        title={!actionGuard.isActionAllowed ? actionGuard.disabledTitle : t('updateStatus')}
                        className={standardClass}
                    >
                        <PencilIcon /> {t('updateStatus')}
                    </QuickActionButton>
                    <QuickActionButton
                        onClick={() => setIsAddNoteModalOpen(true)}
                        disabled={!actionGuard.isActionAllowed}
                        title={!actionGuard.isActionAllowed ? actionGuard.disabledTitle : t('addNote')}
                        className={standardClass}
                    >
                        <PlusCircleIcon /> {t('addNote')}
                    </QuickActionButton>
                </div>
            </div>

            {isAddNoteModalOpen && (
                <div
                    className="fixed inset-0 z-[70] flex items-center justify-center p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="quick-action-add-note-title"
                    onClick={closeAddNoteModal}
                >
                    <div className={`${modalOverlay} animate-fade-in`} aria-hidden="true" />
                    <div
                        className={`${modalSurface} relative w-full max-w-xl p-5`}
                        onClick={(event) => event.stopPropagation()}
                    >
                        <h4 id="quick-action-add-note-title" className="text-lg font-semibold text-[#004097] dark:text-blue-300">
                            {t('addGeneralNoteTitle', 'Add General Note')}
                        </h4>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                            {t('addGeneralNoteDescription', 'This note will be saved to the student record and shown in Notes tab.')}
                        </p>
                        <textarea
                            value={noteContent}
                            onChange={(event) => setNoteContent(event.target.value)}
                            rows={6}
                            placeholder={t('addNotePlaceholder')}
                            className={`${inputField} mt-4 text-sm`}
                        />
                        <div className="mt-4 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={closeAddNoteModal}
                                className={buttonSecondary}
                            >
                                {t('cancel')}
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveGeneralNote}
                                disabled={!noteContent.trim() || !actionGuard.isActionAllowed}
                                className={`${buttonPrimary} disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {t('saveNote', 'Save Note')}
                            </button>
                        </div>
                    </div>
                    <style>{`
                        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                        .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
                    `}</style>
                </div>
            )}
        </>
    );
};

export default QuickActionsSection;
