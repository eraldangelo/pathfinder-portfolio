import type { User } from '../../../types';
import type { BranchChangeRequestFormData } from '../../../types/branchChangeRequest';

export interface ProfilePageProps {
    user: User | null;
    onNavigateBack: () => void;
    showPopup: (message: string) => void;
    onProfileUpdate: (newPhotoURL?: string, updates?: { preferredName?: string; dob?: string; firstName?: string; lastName?: string; }) => void;
    onBranchChangeRequestSubmit: (data: BranchChangeRequestFormData) => void | Promise<void>;
}

export type EditableSection = 'name' | 'contact' | 'location' | 'language';

export interface ProfileFormData {
    firstName: string;
    lastName: string;
    preferredName: string;
    day: string;
    month: string;
    year: string;
    personalMobileCountryCode: string;
    personalMobileNumber: string;
    businessMobileCountryCode: string;
    businessMobileNumber: string;
    personalEmail: string;
    country: string;
    branch: string;
}
