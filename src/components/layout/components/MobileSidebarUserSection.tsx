import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useTranslation } from '../../../contexts/LanguageContext';
import type { User } from '../../../types';
import { EditIcon } from './MobileSidebarIcons';
import { IMAGE_LINKS } from '@/config/imageLinks';

interface MobileSidebarUserSectionProps {
    user: User;
    isCollapsed: boolean;
    statusIndicatorClass: string;
    onOpenProfile: () => void;
}

const DEFAULT_PROFILE_IMAGE = IMAGE_LINKS.branding.defaultAvatar;

export const MobileSidebarUserSection: React.FC<MobileSidebarUserSectionProps> = ({
    user,
    isCollapsed,
    statusIndicatorClass,
    onOpenProfile,
}) => {
    const { t } = useTranslation();
    const [profileSrc, setProfileSrc] = useState(user.photoURL || DEFAULT_PROFILE_IMAGE);

    useEffect(() => {
        setProfileSrc(user.photoURL || DEFAULT_PROFILE_IMAGE);
    }, [user.photoURL]);

    return (
        <div className={`flex flex-col items-center text-center transition-all duration-300 my-4 ${isCollapsed ? 'lg:my-6' : ''}`}>
            <div className="relative">
                <div className={`rounded-full bg-white/10 border-2 border-yellow-400 flex items-center justify-center shadow-lg overflow-hidden flex-shrink-0 transition-all duration-300 w-16 h-16 mb-2 ${isCollapsed ? 'lg:w-12 lg:h-12 lg:mb-0' : ''}`}>
                    <Image
                        src={profileSrc}
                        alt={t('userProfileAlt')}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                        loading="eager"
                        onError={() => setProfileSrc(DEFAULT_PROFILE_IMAGE)}
                    />
                </div>
                <div
                    className={`absolute rounded-full border-2 border-white dark:border-gray-800 ${statusIndicatorClass} transition-all duration-300 ${
                        isCollapsed ? 'w-3.5 h-3.5 bottom-0 right-0' : 'w-4 h-4 bottom-2 right-0'
                    }`}
                ></div>
            </div>
            <div className={`w-full transition-opacity duration-200 overflow-hidden opacity-100 ${isCollapsed ? 'lg:opacity-0 lg:h-0' : ''}`}>
                <h3 className="text-base font-semibold text-[#004097] dark:text-blue-300 text-floating">{user.displayName || 'Test User'}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-300 text-floating">{user.email || 'test@example.com'}</p>
                <button
                    onClick={onOpenProfile}
                    className="mt-2 mx-auto flex w-fit items-center justify-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:underline transition-colors"
                >
                    <EditIcon />
                    <span>{t('viewEditProfile')}</span>
                </button>
            </div>
        </div>
    );
};
