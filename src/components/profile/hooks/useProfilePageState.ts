import { useTranslation } from '../../../contexts/LanguageContext';
import type { User } from '../../../types';
import { useProfileDisplayValues } from './useProfileDisplayValues';
import { useProfileFormData } from './useProfileFormData';
import { useProfileUiState } from './useProfileUiState';

type UseProfilePageStateParams = {
    user: User | null;
    showPopup: (message: string) => void;
    onProfileUpdate: (newPhotoURL?: string, updates?: { preferredName?: string; dob?: string; firstName?: string; lastName?: string }) => void;
};

export const useProfilePageState = ({ user, showPopup, onProfileUpdate }: UseProfilePageStateParams) => {
    const { t, locale, setLocale } = useTranslation();
    const uiState = useProfileUiState({ t, setLocale, showPopup, onProfileUpdate });
    const { profileData, handleSaveProfile } = useProfileFormData({
        user,
        t,
        showPopup,
        onProfileUpdate,
        onCloseEdit: uiState.handleCloseModal,
    });
    const displayValues = useProfileDisplayValues({ user, profileData, locale, t });

    return {
        t,
        profileData,
        handleSaveProfile,
        ...uiState,
        ...displayValues,
    };
};
