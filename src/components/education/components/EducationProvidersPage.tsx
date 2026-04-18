import React, { useState, useMemo, useEffect } from 'react';
import SchoolLogo from '@/components/common/components/SchoolLogo';
import FlagIcon from '@/components/common/components/FlagIcon';
import { useTranslation } from '@/contexts/LanguageContext';
import { getCountryCode } from '@/data/reference/countries';
import EducationProviderModal from '../modals/EducationProviderModal';
import ApplicationsPagination from '@/components/applications/components/ApplicationsPagination';
import { useEducationProviders } from '../hooks/useEducationProviders';
import type { EducationProvider } from '../types/EducationProviderTypes';

// Icons
const SearchIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>;
const ChevronDownIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>;
const SortAscendingIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 9m0 0L21 12.75M17.25 9v12" /></svg>;
const SortDescendingIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25 4.5l4.5-4.5m0 0l4.5 4.5M17.25 21V9" /></svg>;


interface EducationProvidersPageProps {
    isReady: boolean;
}

const countryToKey = (countryName: string) => {
    return countryName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
};

const CountryDisplay: React.FC<{ country: string }> = ({ country }) => {
    const { t } = useTranslation();
    const code = getCountryCode(country);
    const translatedCountry = t(countryToKey(country), country);

    return (
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-2 flex-shrink-0">
            {code && (
                <FlagIcon
                    countryCode={code}
                    label={translatedCountry}
                    className="w-4 h-3 rounded-sm"
                />
            )}
            <span>{translatedCountry}</span>
        </div>
    );
};

const EducationProvidersPage: React.FC<EducationProvidersPageProps> = ({ isReady }) => {
    const { t } = useTranslation();
    const titleAnimationClasses = `transition-all duration-700 ease-out ${isReady ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`;
    const { providers, isLoading, usingFallback, error } = useEducationProviders();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCountry, setSelectedCountry] = useState('All');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedSchool, setSelectedSchool] = useState<EducationProvider | null>(null);
    const itemsPerPage = 24;

    const countries = useMemo(() => ['All', ...Array.from(new Set(providers.map((provider) => provider.country)))].sort((a,b) => {
        if (a === 'All') return -1;
        if (b === 'All') return 1;
        return a.localeCompare(b);
    }), [providers]);

    const filteredAndSortedSchools = useMemo(() => {
        const filtered = providers
            .filter((provider) => {
                const searchMatch = searchTerm === '' || provider.name.toLowerCase().includes(searchTerm.toLowerCase());
                const countryMatch = selectedCountry === 'All' || provider.country === selectedCountry;
                return searchMatch && countryMatch;
            });

        return filtered.sort((a, b) => {
            if (sortOrder === 'asc') {
                return a.name.localeCompare(b.name);
            } else {
                return b.name.localeCompare(a.name);
            }
        });
    }, [providers, searchTerm, selectedCountry, sortOrder]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedCountry, sortOrder]);

    const paginatedSchools = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredAndSortedSchools.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredAndSortedSchools, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredAndSortedSchools.length / itemsPerPage);

    const handleSortToggle = () => {
        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    };

    return (
        <div className="relative w-full h-full max-w-[1920px] mx-auto">
            <div className="w-full h-full px-4 pt-24 lg:px-8 pb-16 flex flex-col text-sm text-gray-700 dark:text-gray-300">
                <div className={`relative z-10 mb-6 flex justify-between items-center ${titleAnimationClasses}`}>
                    <div className="flex items-center">
                        <h1 className="text-3xl font-bold text-[#004097] dark:text-blue-300">{t('educationProviders')}</h1>
                    </div>
                </div>

                {usingFallback && (
                    <div className="mb-4 rounded-xl border border-yellow-400/50 bg-yellow-50/80 px-4 py-3 text-xs text-yellow-900 dark:border-yellow-500/30 dark:bg-yellow-900/20 dark:text-yellow-100">
                        {error || "Education provider data is currently unavailable from Firestore."}
                    </div>
                )}

                {/* Filter and Search Controls */}
                <div className="mb-6 backdrop-blur-md bg-white/30 dark:bg-black/20 shadow-md border border-white/40 dark:border-white/10 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative w-full md:flex-1">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500 dark:text-gray-400"><SearchIcon /></div>
                        <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder={t('searchByProviderName')} className="w-full pl-10 pr-4 py-2 text-sm bg-white/60 dark:bg-black/40 border border-gray-400/50 dark:border-white/20 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"/>
                    </div>
                    <div className="relative w-full md:w-auto">
                        <select value={selectedCountry} onChange={e => setSelectedCountry(e.target.value)} className="w-full md:w-48 pl-3 pr-8 py-2 text-sm bg-white/60 dark:bg-black/40 border border-gray-400/50 dark:border-white/20 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                            {countries.map(c => <option key={c} value={c}>{t(countryToKey(c), c)}</option>)}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400"><ChevronDownIcon /></div>
                    </div>
                    <button onClick={handleSortToggle} className="w-full md:w-auto px-4 py-2 text-sm bg-white/60 dark:bg-black/40 border border-gray-400/50 dark:border-white/20 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center gap-2">
                         {sortOrder === 'asc' ? <SortAscendingIcon /> : <SortDescendingIcon />}
                        <span>{t('sortName')}</span>
                    </button>
                </div>
                
                {/* School Grid */}
                <div className="flex-grow">
                    {isLoading && (
                        <div className="mb-4 text-xs text-gray-500 dark:text-gray-400">
                            {t('loading', 'Loading')}...
                        </div>
                    )}
                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                        {paginatedSchools.map(school => (
                            <div key={`${school.name}-${school.country}`} className="backdrop-blur-md bg-white/30 dark:bg-black/20 shadow-lg border border-white/40 dark:border-white/10 rounded-2xl p-4 flex flex-col text-center transition-transform hover:scale-105 duration-300 ease-in-out">
                                <SchoolLogo
                                    schoolName={school.name}
                                    logoUrlOverride={school.logoUrl ?? null}
                                    className="w-20 h-20 mx-auto mb-4 rounded-full object-contain bg-white p-1 shadow-md flex-shrink-0"
                                />
                                <div className="flex-grow flex flex-col justify-center">
                                    <h3 className="font-semibold text-gray-800 dark:text-white text-base leading-tight">{school.name}</h3>
                                </div>
                                <CountryDisplay country={school.country} />
                                <button
                                    onClick={() => setSelectedSchool(school)}
                                    className="glass-btn pathfinder-blue mt-4 w-full px-3 py-1.5 text-xs font-semibold rounded-lg flex-shrink-0"
                                >
                                    {t('viewDetails')}
                                </button>
                            </div>
                        ))}
                    </div>
                     {paginatedSchools.length === 0 && (
                        <div className="text-center py-16">
                            <p className="font-semibold text-lg">{t('noProvidersFound')}</p>
                            <p className="text-gray-500 dark:text-gray-400">{t('tryAdjustingProviderFilters')}</p>
                        </div>
                    )}
                </div>
                
                {/* Pagination Controls */}
                <div className="mt-8 flex justify-center">
                    <ApplicationsPagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            </div>
            <EducationProviderModal
                isOpen={!!selectedSchool}
                school={selectedSchool}
                onClose={() => setSelectedSchool(null)}
            />
        </div>
    );
};

export default EducationProvidersPage;
