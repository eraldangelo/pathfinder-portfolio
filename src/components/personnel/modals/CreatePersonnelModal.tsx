import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from '../../../contexts/LanguageContext';
import { allBranches } from '../../../data/personnel';
import { inputField, modalBackdropDim } from '../../common/styles/ui';
import type { NewPersonnelData } from '../types/PersonnelTypes';

// --- Props ---
interface CreatePersonnelModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: NewPersonnelData) => Promise<boolean>;
}

// --- Icons ---
const XIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6l-12 12" /></svg>;
const CheckIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20 6 9 17l-5-5" /></svg>;
const SpinnerIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

// --- Helper Components ---
const InputField: React.FC<{ label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; type?: string; required?: boolean; helperText?: string; }> = ({ label, name, value, onChange, type = "text", required = false, helperText }) => (
    <div>
        <label htmlFor={name} className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}{required && <span className="text-red-500">*</span>}</label>
        <input type={type} id={name} name={name} value={value} onChange={onChange} required={required} className={`${inputField} text-sm font-semibold`} />
        {helperText && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{helperText}</p>}
    </div>
);

const SelectField: React.FC<{ label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; children: React.ReactNode; required?: boolean }> = ({ label, name, value, onChange, children, required = false }) => (
    <div>
        <label htmlFor={name} className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}{required && <span className="text-red-500">*</span>}</label>
        <select id={name} name={name} value={value} onChange={onChange} required={required} className={`${inputField} text-sm font-semibold appearance-none`}>
            {children}
        </select>
    </div>
);

const CreatePersonnelModal: React.FC<CreatePersonnelModalProps> = ({ isOpen, onClose, onSave }) => {
    const { t } = useTranslation();
    const [isMounted, setIsMounted] = useState(false);
    const [formData, setFormData] = useState<NewPersonnelData>({
        firstName: '', lastName: '', email: '', password: '', role: '', branch: '', preferredName: ''
    });
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setFormData({ firstName: '', lastName: '', email: '', password: '', role: '', branch: '', preferredName: '' });
            setIsProcessing(false);
        }
    }, [isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        const success = await onSave(formData);
        if (!success) {
            setIsProcessing(false);
        }
    };

    const isFormValid = useMemo(() => {
        return formData.firstName.trim() !== '' && formData.lastName.trim() !== '' && formData.email.trim() !== '' && formData.password.length >= 8 && formData.role !== '' && formData.branch !== '';
    }, [formData]);

    if (!isMounted || !isOpen) return null;

    const roles = [
        'Developer',
        'Operations',
        'Branch Manager',
        'Administrative Staff',
        'Education Consultant',
        'Marketing Staff',
        'Satellite Office Staff',
    ];

    return createPortal(
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-0 md:p-4 animate-fade-in"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-personnel-modal-title"
        >
            <div className={`${modalBackdropDim} animate-fade-in`} aria-hidden="true" />
            <div className="relative flex flex-col w-full h-full md:h-auto md:max-h-[90svh] max-w-2xl bg-white/40 dark:bg-black/30 backdrop-blur-2xl border border-white/30 dark:border-white/20 rounded-none md:rounded-3xl shadow-2xl text-gray-800 dark:text-white transform opacity-0 scale-95 animate-fade-in-scale" onClick={(e) => e.stopPropagation()}>
                <header className="relative p-4 sm:p-5 border-b border-black/5 dark:border-white/5 flex justify-center items-center flex-shrink-0">
                    <h2 id="create-personnel-modal-title" className="text-lg font-bold text-[#004097] dark:text-blue-400">{t('createNewPersonnelProfileTitle')}</h2>
                    <div className="absolute right-4 sm:right-5 top-1/2 -translate-y-1/2"><button onClick={onClose} className="w-3.5 h-3.5 rounded-full bg-red-500 hover:bg-red-600" aria-label={t('closeModal')}></button></div>
                </header>
                
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
                    <div className="p-4 sm:p-6 space-y-6">
                        <section>
                            <h4 className="text-lg font-semibold text-[#004097] dark:text-blue-400 border-b border-black/5 dark:border-white/5 pb-2 mb-4">{t('accountCredentials')}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InputField label={t('firstName')} name="firstName" value={formData.firstName} onChange={handleChange} required />
                                <InputField label={t('lastName')} name="lastName" value={formData.lastName} onChange={handleChange} required />
                                <InputField label={t('workEmail')} name="email" value={formData.email} onChange={handleChange} type="email" required />
                                <InputField label={t('initialPassword')} name="password" value={formData.password} onChange={handleChange} type="password" required helperText={t('passwordResetHelperText')} />
                            </div>
                        </section>

                        <section>
                            <h4 className="text-lg font-semibold text-[#004097] dark:text-blue-400 border-b border-black/5 dark:border-white/5 pb-2 mb-4">
                                {t('roleAndBranch', 'Role and Branch')}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <SelectField label={t('role')} name="role" value={formData.role} onChange={handleChange} required>
                                    <option value="">{t('selectRole')}</option>
                                    {roles.map(r => <option key={r} value={r}>{r}</option>)}
                                </SelectField>
                                <SelectField label={t('branch')} name="branch" value={formData.branch} onChange={handleChange} required>
                                    <option value="">{t('selectBranch')}</option>
                                    {allBranches.map(b => <option key={b} value={b}>{b}</option>)}
                                </SelectField>
                            </div>
                        </section>

                        <section>
                            <h4 className="text-lg font-semibold text-[#004097] dark:text-blue-400 border-b border-black/5 dark:border-white/5 pb-2 mb-4">{t('profileDetails')}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                                <InputField label={t('preferredName')} name="preferredName" value={formData.preferredName} onChange={handleChange} />
                            </div>
                        </section>
                    </div>
                </form>

                <footer className="p-4 sm:p-5 border-t border-black/5 dark:border-white/5 flex-shrink-0 flex justify-end items-center gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isProcessing}
                        className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 flex items-center justify-center"
                        aria-label={t('cancel')}
                        title={t('cancel')}
                    >
                        <XIcon />
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={!isFormValid || isProcessing}
                        className="w-12 h-12 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center"
                        aria-label={t('createProfile')}
                        title={t('createProfile')}
                    >
                        {isProcessing ? <SpinnerIcon className="w-5 h-5" /> : <CheckIcon />}
                    </button>
                </footer>
                <style>{`
                    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                    .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
                    @keyframes fade-in-scale { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                    .animate-fade-in-scale { animation: fade-in-scale 0.2s ease-out forwards; animation-delay: 0.05s; }
                `}</style>
            </div>
        </div>,
        document.body
    );
};

export default CreatePersonnelModal;

