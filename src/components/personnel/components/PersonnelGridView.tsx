import React from 'react';
import type { PersonnelWithDetails } from '../../../data/personnel';
import { PersonnelCard } from './PersonnelCard';

interface PersonnelGridViewProps {
    groupedPersonnel: Array<[string, PersonnelWithDetails[]]>;
    onOpenPersonnelProfile: (personnel: PersonnelWithDetails) => void;
}

export const PersonnelGridView: React.FC<PersonnelGridViewProps> = ({ groupedPersonnel, onOpenPersonnelProfile }) => (
    <div className="space-y-8">
        {groupedPersonnel.map(([branch, people]) => (
            <div key={branch}>
                <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-lg font-semibold text-[#004097] dark:text-blue-300">{branch}</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {people.map((person) => (
                        <PersonnelCard
                            key={person.uid}
                            person={person}
                            onClick={() => onOpenPersonnelProfile(person)}
                        />
                    ))}
                </div>
            </div>
        ))}
    </div>
);
