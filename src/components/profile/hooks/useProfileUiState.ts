import { useRef, useState } from 'react';
import type { EditableSection } from '../types/ProfilePageTypes';

type LangConfirmModalState = {
    isOpen: boolean;
    locale: string;
    name: string;
};

type UseProfileUiStateParams = {
    t: (key: string, fallback?: string | Record<string, unknown>, options?: Record<string, unknown>) => string;
    setLocale: (locale: string) => void;
    showPopup: (message: string) => void;
    onProfileUpdate: (newPhotoURL?: string, updates?: { preferredName?: string; dob?: string; firstName?: string; lastName?: string }) => void;
};

export const useProfileUiState = ({ t, setLocale, showPopup, onProfileUpdate }: UseProfileUiStateParams) => {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingSection, setEditingSection] = useState<EditableSection | null>(null);
    const [isChangePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [langConfirmModal, setLangConfirmModal] = useState<LangConfirmModalState>({ isOpen: false, locale: '', name: '' });

    const openModal = (section: EditableSection) => {
        setEditingSection(section);
        setIsEditModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsEditModalOpen(false);
        setEditingSection(null);
    };

    const handleSelectLanguage = (newLocale: string, newLangName: string) => {
        handleCloseModal();
        setLangConfirmModal({ isOpen: true, locale: newLocale, name: newLangName });
    };

    const handleFileSelectClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (!['image/jpeg', 'image/png'].includes(file.type)) {
                showPopup(t('invalidFileType'));
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                showPopup(t('fileTooLarge', { size: 5 }));
                return;
            }
            setSelectedFile(file);
            setIsUploadModalOpen(true);
        }
        if (event.target) {
            event.target.value = '';
        }
    };

    const handleUploadSuccess = (newPhotoURL: string) => {
        onProfileUpdate(newPhotoURL);
        setIsUploadModalOpen(false);
        setSelectedFile(null);
    };

    const closeUploadModal = () => {
        setIsUploadModalOpen(false);
        setSelectedFile(null);
    };

    const closeConfirmModal = () => {
        setLangConfirmModal({ isOpen: false, locale: '', name: '' });
    };

    const confirmLanguageChange = () => {
        if (!langConfirmModal.locale) {
            closeConfirmModal();
            return;
        }
        localStorage.setItem('locale', langConfirmModal.locale);
        setLocale(langConfirmModal.locale);
        closeConfirmModal();
        showPopup(t('languageUpdateSuccess', 'Language updated successfully. The page will now reload.'));
        setTimeout(() => window.location.reload(), 1500);
    };

    return {
        editingSection,
        isEditModalOpen,
        isChangePasswordModalOpen,
        isUploadModalOpen,
        selectedFile,
        fileInputRef,
        langConfirmModal,
        openModal,
        handleCloseModal,
        handleSelectLanguage,
        handleFileSelectClick,
        handleFileChange,
        setChangePasswordModalOpen,
        closeUploadModal,
        handleUploadSuccess,
        closeConfirmModal,
        confirmLanguageChange,
    };
};
