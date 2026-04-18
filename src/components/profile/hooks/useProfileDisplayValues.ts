import { useMemo } from 'react';
import { languageFullDataMap } from '../../../contexts/LanguageContext';
import type { User } from '../../../types';
import { months } from '../utils/ProfilePageConstants';
import type { ProfileFormData } from '../types/ProfilePageTypes';

type UseProfileDisplayValuesParams = {
    user: User | null;
    profileData: ProfileFormData;
    locale: string;
    t: (key: string, fallback?: string | Record<string, unknown>, options?: Record<string, unknown>) => string;
};

export const useProfileDisplayValues = ({ user, profileData, locale, t }: UseProfileDisplayValuesParams) => {
    const birthdayDisplay = useMemo(() => {
        if (user?.dob) {
            const [year, month, day] = user.dob.split('-');
            return `${months[parseInt(month, 10) - 1]} ${day}, ${year}`;
        }
        return t('notSet');
    }, [user?.dob, t]);

    const personalMobileDisplay = useMemo(() => {
        if (profileData.personalMobileNumber) {
            return `${profileData.personalMobileCountryCode} ${profileData.personalMobileNumber}`;
        }
        return t('notSet');
    }, [profileData.personalMobileCountryCode, profileData.personalMobileNumber, t]);

    const businessMobileDisplay = useMemo(() => {
        if (profileData.businessMobileNumber) {
            return `${profileData.businessMobileCountryCode} ${profileData.businessMobileNumber}`;
        }
        return t('notSet');
    }, [profileData.businessMobileCountryCode, profileData.businessMobileNumber, t]);

    const locationDisplay = useMemo(() => {
        if (profileData.country && profileData.branch) {
            const translatedCountry = t(profileData.country.replace(/[^a-zA-Z0-9]/g, '').toLowerCase(), profileData.country);
            const translatedBranch = t(profileData.branch.toLowerCase().replace(/[\s()]/g, ''), profileData.branch);
            return `${translatedCountry} - ${translatedBranch}`;
        }
        return t('notSet');
    }, [profileData.country, profileData.branch, t]);

    const currentLanguageName = useMemo(() => {
        const langData = languageFullDataMap[locale];
        if (!langData) return 'English (United States)';
        return langData.native;
    }, [locale]);

    return {
        birthdayDisplay,
        personalMobileDisplay,
        businessMobileDisplay,
        locationDisplay,
        currentLanguageName,
    };
};
