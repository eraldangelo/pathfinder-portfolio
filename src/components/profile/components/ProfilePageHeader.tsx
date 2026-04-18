import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useTranslation } from '../../../contexts/LanguageContext';
import type { User } from '../../../types';
import { ArrowLeftIcon, CameraIcon } from './icons';
import { IMAGE_LINKS } from '@/config/imageLinks';

interface ProfilePageHeaderProps {
    user: User;
    onNavigateBack: () => void;
    onChangePassword: () => void;
    onFileSelectClick: () => void;
    onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    fileInputRef: React.RefObject<HTMLInputElement>;
}

const DEFAULT_PROFILE_IMAGE = IMAGE_LINKS.branding.defaultAvatar;

export const ProfilePageHeader: React.FC<ProfilePageHeaderProps> = ({
    user,
    onNavigateBack,
    onChangePassword,
    onFileSelectClick,
    onFileChange,
    fileInputRef,
}) => {
    const { t } = useTranslation();
    const [profileSrc, setProfileSrc] = useState(user.photoURL || DEFAULT_PROFILE_IMAGE);

    useEffect(() => {
        setProfileSrc(user.photoURL || DEFAULT_PROFILE_IMAGE);
    }, [user.photoURL]);

    const profileHeaderName = (() => {
        const fullName = user.displayName;
        if (user.preferredName && user.preferredName.trim() && user.preferredName !== user.firstName) {
            return `${fullName} (${user.preferredName})`;
        }
        return fullName;
    })();

    return (
        <>
            <div className="py-4 border-b border-gray-300 dark:border-white/10">
                <button onClick={onNavigateBack} className="text-sm text-[#004097] dark:text-blue-300 hover:underline flex items-center gap-1.5">
                    <ArrowLeftIcon />
                    {t('backToDashboard')}
                </button>
            </div>

            <header className="w-full pt-8">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                    <div className="relative mx-auto md:mx-0 flex-shrink-0 group">
                        <Image
                            src={profileSrc}
                            alt={t('userProfileAlt')}
                            width={128}
                            height={128}
                            className="w-32 h-32 rounded-full object-cover border-4 border-yellow-400 shadow-lg"
                            onError={() => setProfileSrc(DEFAULT_PROFILE_IMAGE)}
                        />
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={onFileChange}
                            className="hidden"
                            accept="image/png, image/jpeg"
                        />
                        <button
                            onClick={onFileSelectClick}
                            className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label={t('changeProfilePicture')}
                        >
                            <CameraIcon />
                        </button>
                    </div>
                    <div className="text-center md:text-left">
                        <h1 className="text-3xl font-bold text-[#004097] dark:text-blue-300">{profileHeaderName}</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">{user.email}</p>
                        <button onClick={onChangePassword} className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                            {t('changePasswordTitle')}
                        </button>
                    </div>
                </div>
            </header>
        </>
    );
};
