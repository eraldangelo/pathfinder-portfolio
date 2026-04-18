import React, { useEffect, useMemo, useState } from 'react';
import { branchesByCountry } from '../../../data/personnel';
import { useTranslation } from '../../../contexts/LanguageContext';
import type { User } from '../../../types';
import type { EditableSection, ProfileFormData } from '../types/ProfilePageTypes';
import { ContactSection, LanguageSection, LocationSection, NameSection } from './EditProfileModalSections';
import { modalBackdropDim } from '../../common/styles/ui';
import type { BranchChangeRequestFormData } from '../../../types/branchChangeRequest';

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
    onSave: (updatedData: Partial<ProfileFormData>) => void;
    showPopup: (message: string) => void;
    section: EditableSection | null;
    initialData: ProfileFormData;
    onBranchChangeRequestSubmit: (data: BranchChangeRequestFormData) => void | Promise<void>;
    onSelectLanguage: (locale: string, name: string) => void;
}

type BranchChangeRequestDraft = BranchChangeRequestFormData & {
    newCountry: string;
};

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
    isOpen,
    onClose,
    onSave,
    showPopup,
    section,
    initialData,
    onBranchChangeRequestSubmit,
    onSelectLanguage,
}) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState(initialData);
    const [requestData, setRequestData] = useState<BranchChangeRequestDraft>({
        newCountry: '',
        newBranch: '',
        reason: '',
    });
    const countries = useMemo(() => Object.keys(branchesByCountry), []);

    useEffect(() => {
        if (!isOpen) return;
        setFormData(initialData);
        setRequestData({ newCountry: '', newBranch: '', reason: '' });
    }, [isOpen, initialData]);

    const availableBranches = useMemo(() => {
        if (!requestData.newCountry) return [];
        return branchesByCountry[requestData.newCountry as keyof typeof branchesByCountry] || [];
    }, [requestData.newCountry]);

    useEffect(() => {
        if (!requestData.newCountry) return;
        setRequestData((prev) => ({ ...prev, newBranch: '' }));
    }, [requestData.newCountry]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRequestChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setRequestData({ ...requestData, [e.target.name]: e.target.value });
    };

    const handleSaveClick = () => {
        if (section === 'name') {
            if (!formData.firstName || !formData.lastName || !formData.day || !formData.month || !formData.year) {
                showPopup(t('allFieldsRequired', 'All fields are required.'));
                return;
            }
            onSave({
                firstName: formData.firstName,
                lastName: formData.lastName,
                preferredName: formData.preferredName,
                day: formData.day,
                month: formData.month,
                year: formData.year,
            });
            return;
        }

        if (section === 'contact') {
            onSave({
                personalEmail: formData.personalEmail,
                personalMobileCountryCode: formData.personalMobileCountryCode,
                personalMobileNumber: formData.personalMobileNumber,
                businessMobileCountryCode: formData.businessMobileCountryCode,
                businessMobileNumber: formData.businessMobileNumber,
            });
        }
    };

    const handleBranchChangeRequest = () => {
        if (requestData.newBranch && requestData.reason.trim().length >= 20) {
            onBranchChangeRequestSubmit(requestData);
        } else {
            showPopup(t('branchAndReasonRequired', 'Please select a new branch and provide a reason (min 20 characters).'));
        }
    };

    if (!isOpen) return null;

    const getTitle = () => {
        switch (section) {
            case 'name':
                return t('editNameBirthday', 'Edit Name & Birthday');
            case 'contact':
                return t('editContactDetails', 'Edit Contact Details');
            case 'location':
                return t('editCountryBranch', 'Edit Country & Branch');
            case 'language':
                return t('selectLanguage', 'Select Language');
            default:
                return '';
        }
    };

    const renderContent = () => {
        switch (section) {
            case 'name':
                return <NameSection t={t} formData={formData} onChange={handleChange} />;
            case 'contact':
                return <ContactSection t={t} formData={formData} onChange={handleChange} />;
            case 'location':
                return (
                    <LocationSection
                        t={t}
                        formData={formData}
                        requestData={requestData}
                        availableBranches={availableBranches}
                        countries={countries}
                        onRequestChange={handleRequestChange}
                    />
                );
            case 'language':
                return <LanguageSection onSelectLanguage={onSelectLanguage} />;
            default:
                return null;
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={onClose}
        >
            <div className={`${modalBackdropDim} animate-fade-in`} aria-hidden="true" />
            <div
                className="relative flex flex-col w-full max-w-lg bg-white/40 dark:bg-black/30 backdrop-blur-2xl border border-white/30 dark:border-white/20 rounded-3xl shadow-2xl text-gray-800 dark:text-white transform opacity-0 scale-95 animate-fade-in-scale"
                onClick={(event) => event.stopPropagation()}
            >
                <header className="relative p-4 sm:p-5 border-b border-black/5 dark:border-white/5 flex justify-center items-center flex-shrink-0">
                    <h2 className="text-lg font-bold text-[#004097] dark:text-blue-400">{getTitle()}</h2>
                    <div className="absolute right-4 sm:right-5 top-1/2 -translate-y-1/2">
                        <button onClick={onClose} className="w-3.5 h-3.5 rounded-full bg-red-500 hover:bg-red-600" aria-label={t('closeModal', 'Close')} />
                    </div>
                </header>

                <div className="p-6 sm:p-8">
                    {renderContent()}
                </div>

                <footer className="p-4 sm:p-5 border-t border-black/5 dark:border-white/5 flex-shrink-0 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center"
                        aria-label={t('cancel')}
                        title={t('cancel')}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6l-12 12" />
                        </svg>
                    </button>
                    {section !== 'language' && (
                        <button
                            type="button"
                            onClick={section === 'location' ? handleBranchChangeRequest : handleSaveClick}
                            className="w-12 h-12 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-colors flex items-center justify-center"
                            aria-label={section === 'location' ? t('submitRequest') : t('saveChanges')}
                            title={section === 'location' ? t('submitRequest') : t('saveChanges')}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20 6 9 17l-5-5" />
                            </svg>
                        </button>
                    )}
                </footer>

                <style>{`
                    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                    .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
                    @keyframes fade-in-scale { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                    .animate-fade-in-scale { animation: fade-in-scale 0.2s ease-out forwards; }
                `}</style>
            </div>
        </div>
    );
};
