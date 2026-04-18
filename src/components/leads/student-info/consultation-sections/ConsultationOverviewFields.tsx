import React from 'react';
import Image from 'next/image';
import { useTranslation } from '../../../../contexts/LanguageContext';
import type { Lead } from '../../leads-page/LeadsPageTypes';
import { AcademicCapIcon, CakeIcon, CalendarIcon, FlagIcon } from '../icons';
import { InfoField } from '../fields';
import { IMAGE_LINKS } from '@/config/imageLinks';

interface ConsultationOverviewFieldsProps {
    editedLead: Lead;
    isEditing: boolean;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    age: number | null;
    isOpeningStudyNavi: boolean;
    onOpenStudyNavi: () => void;
}

const ConsultationOverviewFields: React.FC<ConsultationOverviewFieldsProps> = ({
    editedLead,
    isEditing,
    onInputChange,
    age,
    isOpeningStudyNavi,
    onOpenStudyNavi,
}) => {
    const { t } = useTranslation();

    return (
        <>
            <InfoField
                icon={<FlagIcon />}
                label={t('preferredStudyDestination')}
                value={editedLead.studyDestinations || ''}
                isEditing={isEditing}
                name="studyDestinations"
                onChange={onInputChange}
                className="w-full min-w-0"
            />
            <InfoField
                icon={<AcademicCapIcon />}
                label={t('preferredCoursesOfStudy')}
                value={editedLead.preferredCoursesOfStudy || ''}
                isEditing={isEditing}
                name="preferredCoursesOfStudy"
                onChange={onInputChange}
                className="w-full min-w-0"
            />
            <InfoField
                icon={<CalendarIcon />}
                label={t('plannedIntakeDate')}
                value={editedLead.plannedStudyStart || ''}
                isEditing={isEditing}
                name="plannedStudyStart"
                onChange={onInputChange}
                type="month"
                className="w-full min-w-0"
            />
            <div className="w-full min-w-0 flex items-start gap-4">
                <div className="flex-shrink-0 text-blue-500 mt-1">
                    <CakeIcon />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('age', 'Age')}</p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-white mt-1">{age == null ? '' : age}</p>
                </div>
            </div>
            <div className="w-full min-w-0 flex items-start gap-4">
                <div className="flex-shrink-0 text-blue-500 mt-1">
                    <Image
                        src={IMAGE_LINKS.ui.studyNaviFavicon}
                        alt={t('studyNavi', 'StudyNavi')}
                        width={24}
                        height={24}
                        className="rounded-full object-cover"
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('studyNavi', 'StudyNavi')}</p>
                    <button
                        type="button"
                        onClick={onOpenStudyNavi}
                        disabled={isOpeningStudyNavi}
                        className="mt-1 inline-flex w-full items-center justify-center rounded-full border border-blue-500/30 px-3 py-1 text-xs font-semibold text-[#004097] dark:text-blue-300 bg-blue-50/70 dark:bg-blue-500/10 hover:bg-blue-100/80 dark:hover:bg-blue-500/20 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {isOpeningStudyNavi
                            ? t('opening', 'Opening...')
                            : t('openStudyNavi', 'Open StudyNavi')}
                    </button>
                </div>
            </div>
        </>
    );
};

export default ConsultationOverviewFields;
