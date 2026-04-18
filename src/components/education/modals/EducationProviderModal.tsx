import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import SchoolLogo from '@/components/common/components/SchoolLogo';
import FlagIcon from '@/components/common/components/FlagIcon';
import { useTranslation } from '@/contexts/LanguageContext';
import { getCountryCode } from '@/data/reference/countries';
import { modalBackdropDim } from '@/components/common/styles/ui';
import type { EducationProvider } from '../types/EducationProviderTypes';

const GlobeIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
        <path d="M2 12h20" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
);

const MapPinIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 21s-6-5.33-6-10a6 6 0 0 1 12 0c0 4.67-6 10-6 10z" />
        <circle cx="12" cy="11" r="2.5" />
    </svg>
);

const BookIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z" />
    </svg>
);

const CalendarIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);

const splitPrograms = (value: string[] | string | null | undefined) => {
    if (Array.isArray(value)) {
        return value.map((program) => String(program).trim()).filter(Boolean);
    }
    if (!value) return [];
    return value
        .split(';')
        .map((program) => program.trim())
        .filter(Boolean);
};

const CountryBadge: React.FC<{ country: string }> = ({ country }) => {
    const { t } = useTranslation();
    const code = getCountryCode(country);
    const translatedCountry = t(country.replace(/[^a-zA-Z0-9]/g, '').toLowerCase(), country);

    return (
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            {code && (
                <FlagIcon
                    countryCode={code}
                    label={translatedCountry}
                    className="w-[18px] h-3 rounded-sm"
                />
            )}
            <span>{translatedCountry}</span>
        </div>
    );
};

interface EducationProviderModalProps {
    isOpen: boolean;
    school: EducationProvider | null;
    onClose: () => void;
}

const EducationProviderModal: React.FC<EducationProviderModalProps> = ({ isOpen, school, onClose }) => {
    const { t } = useTranslation();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const generalPrograms = useMemo(() => splitPrograms(school?.generalPrograms), [school?.generalPrograms]);
    const popularPrograms = useMemo(() => splitPrograms(school?.popularPrograms), [school?.popularPrograms]);
    const websiteUrl = school?.website || (school?.domain ? `https://${school.domain}` : null);
    const intakeInfo = school?.intakes || '';
    const displayWebsite = useMemo(() => {
        if (!websiteUrl) return '';
        try {
            return new URL(websiteUrl).hostname.replace(/^www\./, '');
        } catch {
            return websiteUrl.replace(/^https?:\/\//, '');
        }
    }, [websiteUrl]);

    if (!isMounted || !isOpen || !school) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-0 md:p-4 animate-fade-in"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="education-provider-title"
        >
            <div className={`${modalBackdropDim} animate-fade-in`} aria-hidden="true" />
            <div
                className="relative flex flex-col w-full h-full md:h-[90svh] md:max-w-3xl bg-white/40 dark:bg-black/30 backdrop-blur-2xl border border-white/30 dark:border-white/20 rounded-none md:rounded-3xl shadow-2xl text-gray-800 dark:text-white transform opacity-0 scale-95 animate-fade-in-scale"
                onClick={(event) => event.stopPropagation()}
            >
                <header className="relative p-4 sm:p-5 border-b border-black/5 dark:border-white/5 flex justify-center items-center flex-shrink-0">
                    <h2 id="education-provider-title" className="text-lg font-bold text-[#004097] dark:text-blue-400">
                        {t('educationProviderDetails', 'Education Provider Details')}
                    </h2>
                    <div className="absolute right-4 sm:right-5 top-1/2 -translate-y-1/2">
                        <button onClick={onClose} className="w-3.5 h-3.5 rounded-full bg-red-500 hover:bg-red-600" aria-label={t('closeModal', 'Close')} />
                    </div>
                </header>

                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                    <div className="p-6 flex flex-col items-center text-center">
                        <SchoolLogo
                            schoolName={school.name}
                            logoUrlOverride={school.logoUrl ?? null}
                            className="w-24 h-24 rounded-full object-contain bg-white p-2 shadow-md border-4 border-yellow-400"
                        />
                        <h3 className="mt-4 text-2xl font-bold text-[#004097] dark:text-blue-300">{school.name}</h3>
                        <div className="mt-2">
                            <CountryBadge country={school.country} />
                        </div>
                    </div>

                    <div className="px-6 border-t border-black/10 dark:border-white/10 pt-5 text-gray-700 dark:text-gray-300">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3">
                                <MapPinIcon />
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('country', 'Country')}</p>
                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{school.country}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <GlobeIcon />
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('website', 'Website')}</p>
                                    {websiteUrl ? (
                                        <a
                                            href={websiteUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-sm font-semibold text-blue-600 dark:text-blue-300 hover:underline break-all"
                                        >
                                            {displayWebsite}
                                        </a>
                                    ) : (
                                        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{t('notAvailable', 'Not available')}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <CalendarIcon />
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('intakes', 'Intakes')}</p>
                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{intakeInfo || t('notAvailable', 'Not available')}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <BookIcon />
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('programsCount', 'Programs')}</p>
                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        {generalPrograms.length + popularPrograms.length || t('notAvailable', 'Not available')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 pb-6">
                        <section className="pt-5 border-t border-black/10 dark:border-white/10">
                            <h4 className="text-sm font-semibold text-[#004097] dark:text-blue-300 mb-3">
                                {t('generalPrograms', 'General Programs')}
                            </h4>
                            {generalPrograms.length ? (
                                <div className="flex flex-wrap gap-2">
                                    {generalPrograms.map((program, index) => (
                                        <span
                                            key={`${program}-${index}`}
                                            className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100/70 dark:bg-blue-500/20 text-blue-700 dark:text-blue-200"
                                        >
                                            {program}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400">{t('programsUpdating', 'Programs are being updated.')}</p>
                            )}
                        </section>

                        <section className="pt-5 mt-5 border-t border-black/10 dark:border-white/10">
                            <h4 className="text-sm font-semibold text-[#004097] dark:text-blue-300 mb-3">
                                {t('popularPrograms', 'Popular Programs')}
                            </h4>
                            {popularPrograms.length ? (
                                <div className="flex flex-wrap gap-2">
                                    {popularPrograms.map((program, index) => (
                                        <span
                                            key={`${program}-${index}`}
                                            className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100/70 dark:bg-green-500/20 text-green-700 dark:text-green-200"
                                        >
                                            {program}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400">{t('programsUpdating', 'Programs are being updated.')}</p>
                            )}
                        </section>
                    </div>
                </div>
            </div>
            <style>{`
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
                @keyframes fade-in-scale { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                .animate-fade-in-scale { animation: fade-in-scale 0.2s ease-out forwards; animation-delay: 0.05s; }
            `}</style>
        </div>,
        document.body
    );
};

export default EducationProviderModal;
