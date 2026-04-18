import React from 'react';
import Image from 'next/image';
import { useTranslation } from '../../../contexts/LanguageContext';
import type { PersonnelWithDetails } from '../../../data/personnel';
import { getDisplayRole, getStatusMeta } from '../utils/personnelUtils';
import { IMAGE_LINKS } from '@/config/imageLinks';

const DEFAULT_PROFILE_IMAGE = IMAGE_LINKS.branding.defaultAvatar;

interface PersonnelRowProps {
    person: PersonnelWithDetails;
    onClick: () => void;
}

export const PersonnelRow: React.FC<PersonnelRowProps> = ({ person, onClick }) => {
    const { t } = useTranslation();
    const statusMeta = getStatusMeta(person, t);

    return (
        <tr onClick={onClick} className="border-b border-gray-900/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer">
            <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                    <Image
                        src={person.photoURL || DEFAULT_PROFILE_IMAGE}
                        alt={person.name}
                        width={36}
                        height={36}
                        className="w-9 h-9 rounded-full object-cover"
                    />
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{person.name}</span>
                </div>
            </td>
            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{person.email}</td>
            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{person.branch}</td>
            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{getDisplayRole(person.role)}</td>
            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                    <span className={`h-3 w-3 rounded-full ${statusMeta.colorClass}`} title={statusMeta.tooltip} aria-label={statusMeta.tooltip} />
                    <span className="text-sm">{statusMeta.label}</span>
                </div>
            </td>
        </tr>
    );
};
