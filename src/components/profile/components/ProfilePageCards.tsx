import React from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';
import { ProfileInfoCard } from './ProfileInfoCard';
import type { EditableSection, ProfileFormData } from '../types/ProfilePageTypes';
import type { User } from '../../../types';
import { GlobeIcon, LanguageIcon, PersonIcon, PhoneIcon } from './icons';

interface ProfilePageCardsProps {
    user: User;
    profileData: ProfileFormData;
    birthdayDisplay: string;
    personalMobileDisplay: string;
    businessMobileDisplay: string;
    locationDisplay: string;
    currentLanguageName: string;
    onOpenSection: (section: EditableSection) => void;
    showLanguageCard?: boolean;
}

export const ProfilePageCards: React.FC<ProfilePageCardsProps> = ({
    user,
    profileData,
    birthdayDisplay,
    personalMobileDisplay,
    businessMobileDisplay,
    locationDisplay,
    currentLanguageName,
    onOpenSection,
    showLanguageCard = true,
}) => {
    const { t } = useTranslation();

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ProfileInfoCard title={t('nameBirthday')} icon={<PersonIcon />} onClick={() => onOpenSection('name')}>
                <p>{t('fullName')}: <strong>{user.firstName} {user.lastName}</strong></p>
                <p>{t('preferredName')}: <strong>{user.preferredName || t('notSet')}</strong></p>
                <p>{t('birthday')}: <strong>{birthdayDisplay}</strong></p>
            </ProfileInfoCard>

            <ProfileInfoCard title={t('contactDetails')} icon={<PhoneIcon />} onClick={() => onOpenSection('contact')}>
                <p>{t('personal', 'Personal')} {t('mobileNumber')}: <strong>{personalMobileDisplay}</strong></p>
                <p>{t('business', 'Business')} {t('mobileNumber')}: <strong>{businessMobileDisplay}</strong></p>
                <p>{t('personal', 'Personal')} {t('email')}: <strong>{profileData.personalEmail || t('notSet')}</strong></p>
            </ProfileInfoCard>

            <ProfileInfoCard title={t('countryBranch')} icon={<GlobeIcon />} onClick={() => onOpenSection('location')}>
                <p>{t('location')}: <strong>{locationDisplay}</strong></p>
            </ProfileInfoCard>

            {showLanguageCard ? (
                <ProfileInfoCard title={t('language')} icon={<LanguageIcon />} onClick={() => onOpenSection('language')}>
                    <p>{t('currentLanguage')}: <strong>{currentLanguageName}</strong></p>
                </ProfileInfoCard>
            ) : null}
        </div>
    );
};
