import React, { useEffect, useRef, useState } from 'react';
import { ChevronDownIcon, GlobeIconWidget } from '../../components/icons';
import FlagIcon from '@/components/common/components/FlagIcon';
import { TREND_COUNTRIES, type TrendCountry, getCountryFlagCode } from './visaApprovalRateTrend.constants';

interface VisaTrendCountryDropdownProps {
    selectedCountry: TrendCountry;
    onCountryChange: (country: TrendCountry) => void;
}

const VisaTrendCountryDropdown: React.FC<VisaTrendCountryDropdownProps> = ({
    selectedCountry,
    onCountryChange,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const selectedCountryFlagCode = getCountryFlagCode(selectedCountry);

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

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className="inline-flex max-w-full items-center gap-2 rounded-lg border border-gray-400/50 bg-white/60 px-2 py-1 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 dark:border-white/20 dark:bg-black/50 dark:text-gray-200"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                {selectedCountryFlagCode ? (
                    <FlagIcon
                        countryCode={selectedCountryFlagCode}
                        label={selectedCountry}
                        className="h-3 w-4 shrink-0 rounded-sm"
                    />
                ) : (
                    <span className="inline-flex text-gray-500 dark:text-gray-400">
                        <GlobeIconWidget className="h-4 w-4" />
                    </span>
                )}
                <span className="truncate">{selectedCountry}</span>
                <ChevronDownIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </button>

            {isOpen && (
                <div className="absolute left-0 z-30 mt-2 max-h-72 min-w-[220px] overflow-auto rounded-xl border border-gray-300/60 bg-white/95 shadow-xl backdrop-blur-sm dark:border-white/15 dark:bg-[#0f172a]/95">
                    {TREND_COUNTRIES.map((country) => {
                        const flagCode = getCountryFlagCode(country);
                        const isSelected = country === selectedCountry;
                        return (
                            <button
                                key={country}
                                type="button"
                                onClick={() => {
                                    onCountryChange(country);
                                    setIsOpen(false);
                                }}
                                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                                    isSelected
                                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200'
                                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10'
                                }`}
                                role="option"
                                aria-selected={isSelected}
                            >
                                {flagCode ? (
                                    <FlagIcon
                                        countryCode={flagCode}
                                        label={country}
                                        className="h-3 w-4 shrink-0 rounded-sm"
                                    />
                                ) : (
                                    <span className="inline-flex text-gray-500 dark:text-gray-400">
                                        <GlobeIconWidget className="h-4 w-4" />
                                    </span>
                                )}
                                <span>{country}</span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default VisaTrendCountryDropdown;
