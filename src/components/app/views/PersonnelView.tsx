import React from 'react';
import PersonnelPage from '../../personnel/components/PersonnelPage';
import CreatePersonnelModal from '../../personnel/modals/CreatePersonnelModal';
import { PersonnelProfileModal } from '../../personnel/modals/PersonnelProfileModal';
import { canCreatePersonnel } from '../../../utils/roles';
import type { PersonnelWithDetails } from '../../../data/personnel';
import type { NewPersonnelData } from '../../personnel/types/PersonnelTypes';

interface PersonnelViewProps {
    isReady: boolean;
    userRole: string;
    allPersonnel: PersonnelWithDetails[];
    activePersonnel: PersonnelWithDetails | null;
    onOpenPersonnelProfile: (personnel: PersonnelWithDetails | null) => void;
    isCreatePersonnelOpen: boolean;
    onOpenCreateModal: () => void;
    onCloseCreateModal: () => void;
    onDeletePersonnel: (personnel: PersonnelWithDetails) => Promise<boolean>;
    onSavePersonnel: (data: NewPersonnelData) => Promise<boolean>;
}

const PersonnelView: React.FC<PersonnelViewProps> = ({
    isReady,
    userRole,
    allPersonnel,
    activePersonnel,
    onOpenPersonnelProfile,
    isCreatePersonnelOpen,
    onOpenCreateModal,
    onCloseCreateModal,
    onDeletePersonnel,
    onSavePersonnel,
}) => {
    return (
        <>
            <PersonnelPage
                isReady={isReady}
                role={userRole}
                allPersonnel={allPersonnel}
                onOpenPersonnelProfile={onOpenPersonnelProfile}
                onOpenCreateModal={onOpenCreateModal}
            />
            <PersonnelProfileModal
                isOpen={!!activePersonnel}
                onClose={() => onOpenPersonnelProfile(null)}
                personnel={activePersonnel}
                canDelete={canCreatePersonnel(userRole)}
                onDeletePersonnel={onDeletePersonnel}
            />
            <CreatePersonnelModal isOpen={isCreatePersonnelOpen} onClose={onCloseCreateModal} onSave={onSavePersonnel} />
        </>
    );
};

export default PersonnelView;
