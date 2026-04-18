import React, { useState, useEffect } from 'react';
import { auth, EmailAuthProvider } from '@/services/firebase';
import type { AuthError } from '@/types';
import { useTranslation } from '@/contexts/LanguageContext';
import { buttonPrimary, buttonSecondary, inputField, modalOverlay, modalSurface } from '@/components/common/styles/ui';


// Local User type definition
type User = {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
};

const XIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const EyeIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>;
const EyeOffIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>;


interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
    showPopup: (message: string) => void;
}

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

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose, user, showPopup }) => {
    const { t } = useTranslation();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setError('');
            setIsProcessing(false);
        }
    }, [isOpen]);
    
    useEffect(() => {
        if (newPassword && confirmPassword && newPassword !== confirmPassword) {
            setError(t('passwordsDoNotMatch'));
        } else {
            setError('');
        }
    }, [newPassword, confirmPassword, t]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!currentPassword || !newPassword || !confirmPassword) {
            setError(t('allFieldsRequired'));
            return;
        }

        if (newPassword !== confirmPassword) {
            setError(t('passwordsDoNotMatch'));
            return;
        }
        
        if (newPassword.length < 6) {
            setError(t('passwordTooShort'));
            return;
        }
        
        if (!/[A-Z]/.test(newPassword)) {
            setError(t('passwordRequiresCapital'));
            return;
        }
        
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
            setError(t('passwordRequiresSymbol'));
            return;
        }
        
        for (let i = 0; i < newPassword.length - 2; i++) {
            const c1 = newPassword.charCodeAt(i);
            const c2 = newPassword.charCodeAt(i + 1);
            const c3 = newPassword.charCodeAt(i + 2);
            if ((c2 === c1 + 1 && c3 === c2 + 1) || (c2 === c1 - 1 && c3 === c2 - 1)) {
                 setError(t('passwordNoSequential'));
                 return;
            }
        }

        setIsProcessing(true);
        setError('');

        const firebaseUser = auth.currentUser;
        if (firebaseUser && firebaseUser.email) {
            const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
            try {
                await firebaseUser.reauthenticateWithCredential(credential);
                await firebaseUser.updatePassword(newPassword);
                showPopup(t('passwordUpdateSuccess'));
                onClose();
            } catch (e) {
                const error = e as any;
                console.error("Password change error:", error);
                if (error.code === 'auth/wrong-password') {
                    setError(t('incorrectCurrentPassword'));
                } else {
                    setError(t('passwordUpdateFailed'));
                }
            } finally {
                setIsProcessing(false);
            }
        } else {
            setError(t('passwordUpdateFailed'));
            setIsProcessing(false);
        }
    };

    if (!isOpen) return null;

    return (
         <div 
            className={`${modalOverlay} z-50 flex items-center justify-center p-4 animate-fade-in`}
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="change-password-modal-title"
        >
            <div 
                className={`${modalSurface} p-6 sm:p-8 w-full max-w-md transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 id="change-password-modal-title" className="text-xl sm:text-2xl font-bold">
                        {t('changePasswordTitle')}
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors" aria-label="Close modal">
                        <XIcon />
                    </button>
                </div>

                <form onSubmit={handleSave} className="space-y-4">
                    <PasswordInput id="currentPassword" name="currentPassword" label={t('currentPassword')} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                    <PasswordInput id="newPassword" name="newPassword" label={t('newPassword')} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                    
                    <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1 pt-2">
                        <p className="font-semibold">{t('passwordRequirementsTitle')}</p>
                        <ul className="list-disc list-inside pl-2">
                            <li>{t('passwordReqLength')}</li>
                            <li>{t('passwordReqCapital')}</li>
                            <li>{t('passwordReqSymbol')}</li>
                            <li>{t('passwordReqSequential')}</li>
                        </ul>
                    </div>

                    <PasswordInput id="confirmNewPassword" name="confirmNewPassword" label={t('confirmNewPassword')} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                    
                    {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}

                    <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-black/10 dark:border-white/10">
                        <button type="button" onClick={onClose} disabled={isProcessing} className={`${buttonSecondary} disabled:opacity-50`}>
                            {t('cancel')}
                        </button>
                        <button type="submit" disabled={isProcessing || !!error} className={`${buttonPrimary} shadow-lg shadow-blue-600/30 disabled:bg-blue-400 disabled:cursor-not-allowed`}>
                            {isProcessing ? t('saving') : t('saveChanges')}
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

export default ChangePasswordModal;
