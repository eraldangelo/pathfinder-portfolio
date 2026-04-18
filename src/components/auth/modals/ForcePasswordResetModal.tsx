import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/contexts/LanguageContext';
import { modalOverlayStrong, modalSurface, inputField, buttonPrimary } from '@/components/common/styles/ui';

// --- Icons ---
const EyeIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>;
const EyeOffIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>;
const CheckIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>;
const SpinnerIcon: React.FC = () => (
    <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V2C6.477 2 2 6.477 2 12h2z"></path>
    </svg>
);

// --- Props ---
interface ForcePasswordResetModalProps {
    isOpen: boolean;
    onSave: (newPassword: string) => Promise<boolean>;
}

// --- Helper Components ---
const PasswordInput: React.FC<{ id: string; name: string; label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; }> = ({ id, name, label, value, onChange }) => {
    const [isVisible, setIsVisible] = useState(false);
    return (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
            <div className="relative">
                <input 
                    type={isVisible ? 'text' : 'password'} 
                    id={id} 
                    name={name} 
                    value={value} 
                    onChange={onChange}
                    className={`${inputField} pr-10`} 
                />
                <button 
                    type="button" 
                    onClick={() => setIsVisible(!isVisible)} 
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                    {isVisible ? <EyeOffIcon /> : <EyeIcon />}
                </button>
            </div>
        </div>
    );
};

const ForcePasswordResetModal: React.FC<ForcePasswordResetModalProps> = ({ isOpen, onSave }) => {
    const { t } = useTranslation();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (newPassword && confirmPassword && newPassword !== confirmPassword) {
            setError(t('passwordsDoNotMatch'));
        } else {
            setError('');
        }
    }, [newPassword, confirmPassword, t]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!newPassword || !confirmPassword) {
            setError(t('allFieldsRequired'));
            return;
        }
        if (newPassword !== confirmPassword) {
            setError(t('passwordsDoNotMatch'));
            return;
        }
        if (newPassword.length < 8) {
            setError(t('passwordTooShort'));
            return;
        }
        
        setIsProcessing(true);
        setError('');

        const success = await onSave(newPassword);
        if (!success) {
            setIsProcessing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div 
            className={`${modalOverlayStrong} z-[100] flex items-center justify-center p-4 animate-fade-in`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="force-reset-password-modal-title"
        >
            <div 
                className={`${modalSurface} p-6 sm:p-8 w-full max-w-md transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="text-center">
                    <h2 id="force-reset-password-modal-title" className="text-xl sm:text-2xl font-bold">
                        {t('forcePasswordResetTitle')}
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{t('passwordResetRequiredMessage')}</p>
                </div>

                <form onSubmit={handleSave} className="mt-6 space-y-4">
                    <PasswordInput id="newPassword" name="newPassword" label={t('newPassword')} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                    <PasswordInput id="confirmNewPassword" name="confirmNewPassword" label={t('confirmNewPassword')} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />

                    <p className="text-xs text-gray-600 dark:text-gray-300 text-center">
                        {t('studyNaviPasswordNotice', 'Your new password will also be your new password on StudyNavi.')}
                    </p>
                    
                    {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}

                    <div className="mt-6 pt-4 flex justify-center">
                        <button
                            type="submit"
                            disabled={isProcessing || !!error}
                            className="w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center text-sm font-semibold"
                            aria-label={t('updatePassword')}
                            title={t('updatePassword')}
                        >
                            {isProcessing ? <SpinnerIcon /> : <CheckIcon />}
                        </button>
                    </div>
                </form>
            </div>
             <style>{`
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
                @keyframes fade-in-scale { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                .animate-fade-in-scale { animation: fade-in-scale 0.2s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default ForcePasswordResetModal;
