import React from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';
import type { Lead } from '../leads-page/LeadsPage';
import { phoneCountryCodes } from '../../../data/reference/phoneCountryCodes';
import {
    AcademicCapIcon,
    BriefcaseIcon,
    CakeIcon,
    CalendarIcon,
    EnvelopeIcon,
    FlagIcon,
    HomeIcon,
    PassportIcon,
    PhoneCallingIcon,
    ShieldCheckIcon,
    UserIcon,
} from './icons';
import { InfoField } from './fields';

interface StudentInfoDetailsProps {
    editedLead: Lead;
    isEditing: boolean;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

const StudentInfoDetails: React.FC<StudentInfoDetailsProps> = ({ editedLead, isEditing, onInputChange }) => {
    const { t } = useTranslation();
    const visaRefusalValue = editedLead.visaRefusal === 'Yes' ? 'Yes' : 'No';
    const studyDestinationsValue = Array.isArray(editedLead.studyDestinations)
        ? editedLead.studyDestinations.join(', ')
        : String(editedLead.studyDestinations || '');
    const preferredCoursesOfStudyValue = Array.isArray(editedLead.preferredCoursesOfStudy)
        ? editedLead.preferredCoursesOfStudy.join(', ')
        : String(editedLead.preferredCoursesOfStudy || '');
    const formatPhilippineNumber = (countryCode: string, phoneNumber: string) => {
        const ccDigits = (countryCode || '').replace(/\D/g, '') || '63';
        const rawDigits = (phoneNumber || '').replace(/\D/g, '');
        let localNumber = rawDigits;

        if (localNumber.startsWith('0') && localNumber.length >= 11) {
            localNumber = localNumber.slice(1);
        } else if (localNumber.startsWith('63') && localNumber.length >= 12) {
            localNumber = localNumber.slice(2);
        } else if (localNumber.length > 10) {
            localNumber = localNumber.slice(-10);
        }

        if (localNumber.length >= 10) {
            const first = localNumber.slice(0, 3);
            const second = localNumber.slice(3, 6);
            const third = localNumber.slice(6, 10);
            return `+${ccDigits} ${first} ${second} ${third}`;
        }

        return `+${ccDigits} ${localNumber}`;
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
            <h4 className="md:col-span-2 lg:col-span-3 text-lg font-semibold text-[#004097] dark:text-blue-400 border-b border-black/5 dark:border-white/5 pb-2">
                {t('personalDetails')}
            </h4>

            <InfoField
                icon={<UserIcon />}
                label={t('fullName')}
                value={editedLead.fullName}
                isEditing={isEditing}
                name="fullName"
                onChange={onInputChange}
            />
            <InfoField icon={<CakeIcon />} label={t('dateOfBirth')} value={editedLead.dob} isEditing={isEditing} name="dob" onChange={onInputChange} type="date" />
            <InfoField
                icon={<HomeIcon />}
                label={t('currentLocation')}
                value={editedLead.currentLocation || ''}
                isEditing={isEditing}
                name="currentLocation"
                onChange={onInputChange}
            />

            <InfoField icon={<EnvelopeIcon />} label={t('emailAddress')} value={editedLead.email} isEditing={false} name="email" onChange={() => {}} />
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0 text-blue-500 mt-1"><PhoneCallingIcon /></div>
                <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('mobileNumber')}</p>
                    {isEditing ? (
                        <div className="flex gap-2 mt-1">
                            <select
                                name="phoneCountryCode"
                                value={editedLead.phoneCountryCode}
                                onChange={onInputChange}
                                className="text-sm font-semibold bg-black/5 dark:bg-white/5 p-2 rounded-md border border-black/10 dark:border-white/10 outline-none"
                            >
                                {phoneCountryCodes.map((country) => (
                                    <option key={country.code} value={country.dial_code}>
                                        {country.code} {country.dial_code}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="text"
                                name="phoneNumber"
                                value={editedLead.phoneNumber}
                                onChange={onInputChange}
                                className="w-full text-sm font-semibold bg-black/5 dark:bg-black/40 p-2 rounded-md border border-black/10 dark:border-white/20"
                            />
                        </div>
                    ) : (
                        <p className="text-sm font-semibold text-gray-800 dark:text-white mt-1">
                            {formatPhilippineNumber(editedLead.phoneCountryCode, editedLead.phoneNumber)}
                        </p>
                    )}
                </div>
            </div>

            <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1 text-[#004097]">
                    <PassportIcon />
                </div>
                <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('usPassportHolder')}</p>
                    {isEditing ? (
                        <select
                            name="isUsPassportHolder"
                            value={editedLead.isUsPassportHolder ? 'Yes' : 'No'}
                            onChange={onInputChange}
                            className="w-full text-sm font-semibold bg-black/5 dark:bg-white/5 p-2 rounded-md mt-1 border border-black/10 dark:border-white/10 focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="No">{t('no')}</option>
                            <option value="Yes">{t('yes')}</option>
                        </select>
                    ) : (
                        <p className={`text-sm font-semibold mt-1 ${editedLead.isUsPassportHolder ? 'text-green-500' : 'text-gray-800 dark:text-white'}`}>
                            {t(editedLead.isUsPassportHolder ? 'yes' : 'no')}
                        </p>
                    )}
                </div>
            </div>

            <div className="flex items-start gap-4 md:col-span-3">
                <div className={`flex-shrink-0 mt-1 ${visaRefusalValue === 'Yes' ? 'text-red-500' : 'text-blue-500'}`}>
                    <ShieldCheckIcon refused={visaRefusalValue === 'Yes'} />
                </div>
                <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('visaRefusal')}</p>
                    {isEditing ? (
                        <select
                            name="visaRefusal"
                            value={visaRefusalValue}
                            onChange={onInputChange}
                            className="w-full text-sm font-semibold bg-black/5 dark:bg-white/5 p-2 rounded-md mt-1 border border-black/10 dark:border-white/10 focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="No">{t('no')}</option>
                            <option value="Yes">{t('yes')}</option>
                        </select>
                    ) : (
                        <p className={`text-sm font-semibold mt-1 ${visaRefusalValue === 'Yes' ? 'text-red-500' : 'text-green-500'}`}>
                            {t(visaRefusalValue.toLowerCase())}
                        </p>
                    )}
                </div>
            </div>

            <h4 className="md:col-span-2 lg:col-span-3 text-lg font-semibold text-[#004097] dark:text-blue-400 border-b border-black/5 dark:border-white/5 pb-2 mt-4">
                {t('educationAndWorkHistory')}
            </h4>

            <InfoField icon={<AcademicCapIcon />} label={t('highestEducationLevel')} value={editedLead.highestEducationLevel || ''} isEditing={isEditing} name="highestEducationLevel" onChange={onInputChange} />
            <InfoField icon={<AcademicCapIcon />} label={t('englishTest')} value={editedLead.englishTest || ''} isEditing={isEditing} name="englishTest" onChange={onInputChange} />
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0 text-blue-500 mt-1"><BriefcaseIcon /></div>
                <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('hasWorked')}</p>
                    {isEditing ? (
                        <select
                            name="hasWorked"
                            value={editedLead.hasWorked ? 'Yes' : 'No'}
                            onChange={onInputChange}
                            className="w-full text-sm font-semibold bg-black/5 dark:bg-white/5 p-2 rounded-md mt-1 border border-black/10 dark:border-white/10 focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="No">{t('no')}</option>
                            <option value="Yes">{t('yes')}</option>
                        </select>
                    ) : (
                        <p className={`text-sm font-semibold mt-1 ${editedLead.hasWorked ? 'text-green-500' : 'text-gray-800 dark:text-white'}`}>
                            {t(editedLead.hasWorked ? 'yes' : 'no')}
                        </p>
                    )}
                </div>
            </div>

            <h4 className="md:col-span-2 lg:col-span-3 text-lg font-semibold text-[#004097] dark:text-blue-400 border-b border-black/5 dark:border-white/5 pb-2 mt-4">
                {t('studyDestination')}
            </h4>

            {(isEditing || studyDestinationsValue.trim()) && (
                <InfoField
                    icon={<FlagIcon />}
                    label={t('preferredStudyDestination')}
                    value={studyDestinationsValue}
                    isEditing={isEditing}
                    name="studyDestinations"
                    onChange={onInputChange}
                />
            )}
            {(isEditing || preferredCoursesOfStudyValue.trim()) && (
                <InfoField
                    icon={<AcademicCapIcon />}
                    label={t('preferredCoursesOfStudy')}
                    value={preferredCoursesOfStudyValue}
                    isEditing={isEditing}
                    name="preferredCoursesOfStudy"
                    onChange={onInputChange}
                />
            )}
            <InfoField
                icon={<CalendarIcon />}
                label={t('plannedIntakeDate')}
                value={editedLead.plannedStudyStart || ''}
                isEditing={isEditing}
                name="plannedStudyStart"
                onChange={onInputChange}
                type="month"
            />
        </div>
    );
};

export default StudentInfoDetails;
