import type { Lead } from '../../leads/leads-page/LeadsPageTypes';
import type { User } from '../../../types';
import type { PersonnelWithDetails } from '../../../data/personnel';

export type EntryMode = 'list' | 'manual';

export interface CreateApplicationConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    lead: Lead;
    user: User;
    allPersonnel: PersonnelWithDetails[];
    showPopup: (message: string) => void;
}

