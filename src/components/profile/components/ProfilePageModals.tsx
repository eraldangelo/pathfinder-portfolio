import React from 'react';
import { EditProfileModal } from '../modals/EditProfileModal';
import ChangePasswordModal from '../../auth/modals/ChangePasswordModal';
import UploadProfilePictureModal from '../modals/UploadProfilePictureModal';
import ConfirmActionModal from '../../common/components/ConfirmActionModal';
import { QuestionIcon } from './icons';
import type { EditableSection, ProfileFormData } from '../types/ProfilePageTypes';
import type { User } from '../../../types';
import type { BranchChangeRequestFormData } from '../../../types/branchChangeRequest';

interface ProfilePageModalsProps {
    user: User;
    showPopup: (message: string) => void;
    profileData: ProfileFormData;
    editingSection: EditableSection | null;
    isEditModalOpen: boolean;
    onCloseEdit: () => void;
    onSaveProfile: (updatedData: Partial<ProfileFormData>) => void;
    onBranchChangeRequestSubmit: (data: BranchChangeRequestFormData) => void | Promise<void>;
    onSelectLanguage: (locale: string, name: string) => void;
    isChangePasswordModalOpen: boolean;
    onCloseChangePassword: () => void;
    isUploadModalOpen: boolean;
    selectedFile: File | null;
    onCloseUpload: () => void;
    onUploadSuccess: (newPhotoURL: string) => void;
    confirmModal: {
        isOpen: boolean;
        title: string;
        message: string;
        confirmButtonText: string;
    };
    onCloseConfirm: () => void;
    onConfirm: () => void;
}

export const ProfilePageModals: React.FC<ProfilePageModalsProps> = ({
    user,
    showPopup,
    profileData,
    editingSection,
    isEditModalOpen,
    onCloseEdit,
    onSaveProfile,
    onBranchChangeRequestSubmit,
    onSelectLanguage,
    isChangePasswordModalOpen,
    onCloseChangePassword,
    isUploadModalOpen,
    selectedFile,
    onCloseUpload,
    onUploadSuccess,
    confirmModal,
    onCloseConfirm,
    onConfirm,
}) => (
    <>
        <EditProfileModal
            isOpen={isEditModalOpen}
            onClose={onCloseEdit}
            user={user}
            onSave={onSaveProfile}
            showPopup={showPopup}
            section={editingSection}
            initialData={profileData}
            onBranchChangeRequestSubmit={(data) => {
                onCloseEdit();
                onBranchChangeRequestSubmit(data);
            }}
            onSelectLanguage={onSelectLanguage}
        />

        <ChangePasswordModal
            isOpen={isChangePasswordModalOpen}
            onClose={onCloseChangePassword}
            user={user}
            showPopup={showPopup}
        />

        <UploadProfilePictureModal
            isOpen={isUploadModalOpen}
            onClose={onCloseUpload}
            user={user}
            showPopup={showPopup}
            file={selectedFile}
            onUploadSuccess={onUploadSuccess}
        />

        <ConfirmActionModal
            isOpen={confirmModal.isOpen}
            onClose={onCloseConfirm}
            onConfirm={onConfirm}
            title={confirmModal.title}
            message={confirmModal.message}
            confirmButtonText={confirmModal.confirmButtonText}
            confirmButtonClassName="bg-blue-600 hover:bg-blue-700"
            icon={<QuestionIcon />}
        />
    </>
);
