import React from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';

interface CreateApplicationFooterProps {
    step: number;
    isSaving: boolean;
    isStepValid: boolean;
    onBack: () => void;
    onNext: () => void;
    onSubmit: () => void;
}

const SpinnerIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
    </svg>
);

const ChevronLeftIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
);

const ChevronRightIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);

const CreateApplicationFooter: React.FC<CreateApplicationFooterProps> = ({
    step,
    isSaving,
    isStepValid,
    onBack,
    onNext,
    onSubmit,
}) => {
    const { t } = useTranslation();

    return (
        <footer className="p-4 sm:p-5 mt-auto pt-4 flex justify-end items-center flex-shrink-0 gap-3">
            {step > 1 && (
                <button
                    type="button"
                    onClick={onBack}
                    disabled={isSaving}
                    aria-label={t('back')}
                    title={t('back')}
                    className="glass-btn gray w-11 h-11 rounded-full p-0 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    <ChevronLeftIcon />
                </button>
            )}

            {step === 6 ? (
                <>
                    <button
                        type="button"
                        onClick={onSubmit}
                        disabled={!isStepValid || isSaving}
                        aria-label={t('proceed')}
                        title={t('proceed')}
                        className="glass-btn pathfinder-blue w-11 h-11 rounded-full p-0 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {isSaving ? <SpinnerIcon className="w-5 h-5" /> : <CheckIcon />}
                    </button>
                </>
            ) : (
                <button
                    type="button"
                    onClick={onNext}
                    disabled={!isStepValid || isSaving}
                    aria-label={t('next')}
                    title={t('next')}
                    className="glass-btn pathfinder-blue w-11 h-11 rounded-full p-0 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    <ChevronRightIcon />
                </button>
            )}
        </footer>
    );
};

export default CreateApplicationFooter;
