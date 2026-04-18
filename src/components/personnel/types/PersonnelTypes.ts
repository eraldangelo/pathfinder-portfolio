import type { PersonnelWithDetails } from '../../../data/personnel';

export interface NewPersonnelData {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: string;
    branch: string;
    preferredName: string;
}

export interface PersonnelPageProps {
    isReady: boolean;
    role: string;
    allPersonnel: PersonnelWithDetails[];
    onOpenPersonnelProfile: (personnel: PersonnelWithDetails) => void;
    onOpenCreateModal: () => void;
}
