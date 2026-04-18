import React, { useEffect, useRef, useState } from 'react';
import { languageFullDataMap } from '../../../contexts/LanguageContext';
import type { ProfileFormData } from '../types/ProfilePageTypes';
import { countryCodes, days, months, years, type CountryCodeOption } from '../utils/ProfilePageConstants';
import { InputField, SelectField } from './EditProfileModalFields';
import { inputField } from '../../common/styles/ui';
import FlagIcon from '@/components/common/components/FlagIcon';

type Translator = (key: string, fallbackOrOptions?: string | Record<string, unknown>, options?: Record<string, unknown>) => string;

type CountryCodeSelectProps = {
    name: string;
    value: string;
    options: readonly CountryCodeOption[];
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
};

const CountryCodeSelect: React.FC<CountryCodeSelectProps> = ({ name, value, options, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (!containerRef.current) return;
            if (!containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find((option) => option.code === value) || options[0];

    const handleSelect = (nextValue: string) => {
        onChange({
            target: { name, value: nextValue },
        } as React.ChangeEvent<HTMLSelectElement>);
        setIsOpen(false);
    };

    return (
        <div ref={containerRef} className="relative min-w-[7.5rem]">
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className={`${inputField} inline-flex w-full items-center gap-2 justify-between`}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <span className="inline-flex items-center gap-2">
                    {selectedOption.countryCode ? (
                        <FlagIcon
                            countryCode={selectedOption.countryCode}
                            label={selectedOption.name}
                            className="w-4 h-3 rounded-sm shrink-0"
                        />
                    ) : (
                        <span className="inline-block w-4 h-3 rounded-sm bg-gray-300 dark:bg-gray-600" />
                    )}
                    <span>{selectedOption.code}</span>
                </span>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4 text-gray-500 dark:text-gray-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute left-0 top-full mt-1 z-30 max-h-56 w-full overflow-auto rounded-lg border border-black/10 dark:border-white/15 bg-white dark:bg-slate-900 shadow-lg">
                    {options.map((option) => {
                        const isSelected = option.code === value;
                        return (
                            <button
                                key={option.code}
                                type="button"
                                onClick={() => handleSelect(option.code)}
                                className={`w-full px-2 py-2 text-sm text-left inline-flex items-center gap-2 ${
                                    isSelected
                                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200'
                                        : 'hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200'
                                }`}
                                role="option"
                                aria-selected={isSelected}
                            >
                                {option.countryCode ? (
                                    <FlagIcon
                                        countryCode={option.countryCode}
                                        label={option.name}
                                        className="w-4 h-3 rounded-sm shrink-0"
                                    />
                                ) : (
                                    <span className="inline-block w-4 h-3 rounded-sm bg-gray-300 dark:bg-gray-600" />
                                )}
                                <span>{option.code}</span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

type NameSectionProps = {
    t: Translator;
    formData: ProfileFormData;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
};

export const NameSection: React.FC<NameSectionProps> = ({ t, formData, onChange }) => (
    <div className="space-y-4">
        <InputField label={t('firstName')} name="firstName" value={formData.firstName} onChange={onChange} />
        <InputField label={t('lastName')} name="lastName" value={formData.lastName} onChange={onChange} />
        <InputField label={t('preferredName')} name="preferredName" value={formData.preferredName} onChange={onChange} />
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('birthday')}</label>
            <div className="grid grid-cols-3 gap-2">
                <SelectField name="day" value={formData.day} onChange={onChange}>
                    {days.map((day) => <option key={day} value={day}>{day}</option>)}
                </SelectField>
                <SelectField name="month" value={formData.month} onChange={onChange}>
                    {months.map((month) => <option key={month} value={month}>{t(month.toLowerCase(), month)}</option>)}
                </SelectField>
                <SelectField name="year" value={formData.year} onChange={onChange}>
                    {years.map((year) => <option key={year} value={year}>{year}</option>)}
                </SelectField>
            </div>
        </div>
    </div>
);

type ContactSectionProps = {
    t: Translator;
    formData: ProfileFormData;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
};

export const ContactSection: React.FC<ContactSectionProps> = ({ t, formData, onChange }) => (
    <div className="space-y-4">
        <InputField label={t('personalEmail', 'Personal Email')} name="personalEmail" value={formData.personalEmail} onChange={onChange} type="email" />
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('personalMobileNumber', 'Personal Mobile Number')}</label>
            <div className="flex gap-2">
                <CountryCodeSelect
                    name="personalMobileCountryCode"
                    value={formData.personalMobileCountryCode}
                    options={countryCodes}
                    onChange={onChange}
                />
                <input name="personalMobileNumber" value={formData.personalMobileNumber} onChange={onChange} type="tel" className={inputField} />
            </div>
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('businessMobileNumber', 'Business Mobile Number')}</label>
            <div className="flex gap-2">
                <CountryCodeSelect
                    name="businessMobileCountryCode"
                    value={formData.businessMobileCountryCode}
                    options={countryCodes}
                    onChange={onChange}
                />
                <input name="businessMobileNumber" value={formData.businessMobileNumber} onChange={onChange} type="tel" className={inputField} />
            </div>
        </div>
    </div>
);

type LocationSectionProps = {
    t: Translator;
    formData: ProfileFormData;
    requestData: { newCountry: string; newBranch: string; reason: string };
    availableBranches: string[];
    countries: string[];
    onRequestChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
};

export const LocationSection: React.FC<LocationSectionProps> = ({
    t,
    formData,
    requestData,
    availableBranches,
    countries,
    onRequestChange,
}) => (
    <div className="space-y-4">
        <div>
            <p className="font-semibold text-gray-700 dark:text-gray-300">{t('currentLocation')}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t(formData.country.toLowerCase(), formData.country)} - {t(formData.branch.toLowerCase().replace(/[\s()]/g, ''), formData.branch)}</p>
        </div>
        <div className="pt-4 border-t border-black/10 dark:border-white/10">
            <h4 className="font-semibold text-gray-700 dark:text-gray-300">{t('requestBranchChange')}</h4>
            <div className="space-y-4 mt-2">
                <SelectField name="newCountry" value={requestData.newCountry} onChange={onRequestChange}>
                    <option value="">{t('selectCountry')}</option>
                    {countries.map((country) => <option key={country} value={country}>{t(country.toLowerCase(), country)}</option>)}
                </SelectField>
                <SelectField name="newBranch" value={requestData.newBranch} onChange={onRequestChange} disabled={!requestData.newCountry}>
                    <option value="">{t('selectBranch')}</option>
                    {availableBranches.map((branch) => <option key={branch} value={branch}>{t(branch.toLowerCase().replace(/[\s()]/g, ''), branch)}</option>)}
                </SelectField>
                <div>
                    <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('reason')}</label>
                    <textarea id="reason" name="reason" rows={3} value={requestData.reason} onChange={onRequestChange} className={inputField} />
                    <p className="text-xs text-right mt-1">{t('charactersMinimum', { current: requestData.reason.trim().length, min: 20 })}</p>
                </div>
            </div>
        </div>
    </div>
);

type LanguageSectionProps = {
    onSelectLanguage: (locale: string, name: string) => void;
};

export const LanguageSection: React.FC<LanguageSectionProps> = ({ onSelectLanguage }) => (
    <div className="space-y-2 max-h-80 overflow-y-auto">
        {Object.entries(languageFullDataMap).map(([localeCode, langData]) => (
            <button key={localeCode} onClick={() => onSelectLanguage(localeCode, langData.native)} className="w-full text-left p-3 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors flex items-center gap-3">
                <FlagIcon
                    countryCode={langData.countryCode}
                    label={langData.english}
                    className="w-5 h-[15px] rounded-sm shrink-0"
                    fallback={<span className="inline-block w-5 h-[15px] rounded-sm bg-gray-300 dark:bg-gray-600" />}
                />
                <span>{langData.native}</span>
            </button>
        ))}
    </div>
);
