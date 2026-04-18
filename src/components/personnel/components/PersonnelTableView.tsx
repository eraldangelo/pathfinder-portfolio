import React, { Fragment } from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';
import type { PersonnelWithDetails } from '../../../data/personnel';
import { PersonnelRow } from './PersonnelRow';

interface PersonnelTableViewProps {
    groupedPersonnel: Array<[string, PersonnelWithDetails[]]>;
    onOpenPersonnelProfile: (personnel: PersonnelWithDetails) => void;
}

export const PersonnelTableView: React.FC<PersonnelTableViewProps> = ({ groupedPersonnel, onOpenPersonnelProfile }) => {
    const { t } = useTranslation();

    return (
        <div className="rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md bg-white/20 dark:bg-black/20 border border-white/20 dark:border-white/10">
            <div className="w-full h-full overflow-auto custom-scrollbar">
                <table className="w-full min-w-[800px] text-left text-sm">
                    <thead className="sticky top-0 bg-white/40 dark:bg-black/40 backdrop-blur-md z-10 text-xs uppercase text-gray-500 dark:text-gray-400">
                        <tr className="border-b border-gray-900/10 dark:border-white/10">
                            <th className="p-4 font-semibold">{t('name')}</th>
                            <th className="p-4 font-semibold">{t('email')}</th>
                            <th className="p-4 font-semibold">{t('branch')}</th>
                            <th className="p-4 font-semibold">{t('role')}</th>
                            <th className="p-4 font-semibold">{t('status')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {groupedPersonnel.map(([branch, people]) => (
                            <Fragment key={branch}>
                                <tr className="bg-black/5 dark:bg-white/5">
                                    <th colSpan={5} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-[#004097] dark:text-blue-300">
                                        <div className="flex items-center gap-3">
                                            <span>{branch}</span>
                                        </div>
                                    </th>
                                </tr>
                                {people.map((person) => (
                                    <PersonnelRow key={person.uid} person={person} onClick={() => onOpenPersonnelProfile(person)} />
                                ))}
                            </Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
