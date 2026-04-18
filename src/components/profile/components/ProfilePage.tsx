import React from 'react';
import type { ProfilePageProps } from '../types/ProfilePageTypes';
import { ProfilePageCards } from './ProfilePageCards';
import { ProfilePageHeader } from './ProfilePageHeader';
import { ProfilePageModals } from './ProfilePageModals';
import { useProfilePageState } from '../hooks/useProfilePageState';


const ProfilePage: React.FC<ProfilePageProps> = ({ user, onNavigateBack, showPopup, onProfileUpdate, onBranchChangeRequestSubmit }) => {
    const {
        t,
        profileData,
        editingSection,
        isEditModalOpen,
        isChangePasswordModalOpen,
        isUploadModalOpen,
        selectedFile,
        fileInputRef,
        langConfirmModal,
        birthdayDisplay,
        personalMobileDisplay,
        businessMobileDisplay,
        locationDisplay,
        currentLanguageName,
        openModal,
        handleCloseModal,
        handleSaveProfile,
        handleSelectLanguage,
        handleFileSelectClick,
        handleFileChange,
        setChangePasswordModalOpen,
        closeUploadModal,
        handleUploadSuccess,
        closeConfirmModal,
        confirmLanguageChange,
    } = useProfilePageState({ user, showPopup, onProfileUpdate });

    if (!user) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <p>{t('loadingUserProfile')}</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full text-gray-900 dark:text-gray-100 font-sans">
             <div className="w-full h-full max-w-[1920px] mx-auto px-4 pt-20 lg:px-8 pb-16">
                <div className="max-w-5xl mx-auto">
                    <div className="flex flex-col gap-8 lg:gap-12">
                        <ProfilePageHeader
                            user={user}
                            onNavigateBack={onNavigateBack}
                            onChangePassword={() => setChangePasswordModalOpen(true)}
                            onFileSelectClick={handleFileSelectClick}
                            onFileChange={handleFileChange}
                            fileInputRef={fileInputRef}
                        />

                        <ProfilePageCards
                            user={user}
                            profileData={profileData}
                            birthdayDisplay={birthdayDisplay}
                            personalMobileDisplay={personalMobileDisplay}
                            businessMobileDisplay={businessMobileDisplay}
                            locationDisplay={locationDisplay}
                            currentLanguageName={currentLanguageName}
                            onOpenSection={openModal}
                            showLanguageCard={false}
                        />
                    </div>
                </div>
            </div>

            <ProfilePageModals
                user={user}
                showPopup={showPopup}
                profileData={profileData}
                editingSection={editingSection}
                isEditModalOpen={isEditModalOpen}
                onCloseEdit={handleCloseModal}
                onSaveProfile={handleSaveProfile}
                onBranchChangeRequestSubmit={onBranchChangeRequestSubmit}
                onSelectLanguage={handleSelectLanguage}
                isChangePasswordModalOpen={isChangePasswordModalOpen}
                onCloseChangePassword={() => setChangePasswordModalOpen(false)}
                isUploadModalOpen={isUploadModalOpen}
                selectedFile={selectedFile}
                onCloseUpload={closeUploadModal}
                onUploadSuccess={handleUploadSuccess}
                confirmModal={{
                    isOpen: langConfirmModal.isOpen,
                    title: t('confirmLanguageChangeTitle'),
                    message: t('confirmLanguageChangeMessage', { langName: langConfirmModal.name }),
                    confirmButtonText: t('changeAndReload'),
                }}
                onCloseConfirm={closeConfirmModal}
                onConfirm={confirmLanguageChange}
            />
        </div>
    );
};
export default ProfilePage;
