import React from 'react';
import Image from 'next/image';
import { useTranslation } from '../../../contexts/LanguageContext';
import type { PersonnelWithDetails } from '../../../data/personnel';
import { getDisplayRole, getStatusMeta } from '../utils/personnelUtils';
import { IMAGE_LINKS } from '@/config/imageLinks';

const DEFAULT_PROFILE_IMAGE = IMAGE_LINKS.branding.defaultAvatar;

interface PersonnelCardProps {
    person: PersonnelWithDetails;
    onClick: () => void;
}

export const PersonnelCard: React.FC<PersonnelCardProps> = ({ person, onClick }) => {
    const { t } = useTranslation();
    const statusMeta = getStatusMeta(person, t);

    return (
        <button onClick={onClick} className="w-full text-center p-4 rounded-2xl backdrop-blur-md bg-white/30 dark:bg-black/20 shadow-lg border border-white/40 dark:border-white/10 hover:bg-white/50 dark:hover:bg-black/30 transition-all duration-300 ease-in-out hover:scale-105">
            <div className="relative w-20 h-20 mx-auto">
                <Image
                    src={person.photoURL || DEFAULT_PROFILE_IMAGE}
                    alt={person.name}
                    width={80}
                    height={80}
                    className="w-20 h-20 rounded-full object-cover mx-auto border-2 border-yellow-400 shadow-md"
                />
                <span
                    className={`absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white dark:border-gray-800 ${statusMeta.colorClass}`}
                    title={statusMeta.tooltip}
                    aria-label={statusMeta.tooltip}
                />
            </div>
            <div className="mt-3 w-full px-1 text-center">
                <h3
                    className="mx-auto min-h-[2.5rem] text-sm font-semibold leading-snug text-gray-800 dark:text-white"
                    style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                    }}
                >
                    {person.name}
                </h3>
                <p
                    className="mt-1 min-h-[2rem] text-xs font-medium leading-snug text-blue-600 dark:text-blue-400"
                    style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                    }}
                >
                    {getDisplayRole(person.role)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{person.branch}</p>
            </div>
        </button>
    );
};
