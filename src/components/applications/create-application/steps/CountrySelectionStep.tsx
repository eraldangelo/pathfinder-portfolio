import React from 'react';
import FlagIcon from '@/components/common/components/FlagIcon';
import { getCountryCode } from '@/data/reference/countries';
import { SelectionButton, StepSection } from './common';
import type { Translator } from '../types';

interface CountrySelectionStepProps {
    t: Translator;
    countries: string[];
    aggregators: string[];
    otherCountriesLabel: string;
    selectedCountry: string;
    onCountrySelect: (country: string, mode: 'list' | 'manual') => void;
}

const CountrySelectionStep: React.FC<CountrySelectionStepProps> = ({
    t,
    countries,
    aggregators,
    otherCountriesLabel,
    selectedCountry,
    onCountrySelect,
}) => (
    <StepSection>
        <div className="space-y-8">
            <div>
                <p className="text-center text-lg mb-6">{t('selectCountryPrompt')}</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {countries.map((country) => {
                        const code = getCountryCode(country);
                        return (
                            <SelectionButton
                                key={country}
                                isSelected={selectedCountry === country}
                                onClick={() => onCountrySelect(country, 'list')}
                                className="flex items-center justify-center gap-3"
                            >
                                {code && (
                                    <FlagIcon
                                        countryCode={code}
                                        label={country}
                                        className="w-6 h-[18px] rounded-sm"
                                    />
                                )}
                                <span>{country}</span>
                            </SelectionButton>
                        );
                    })}
                </div>
            </div>

            <div>
                <h3 className="text-left font-semibold text-gray-600 dark:text-gray-400 mb-2">{otherCountriesLabel}</h3>
                <div className="border-t border-black/10 dark:border-white/10 pt-4">
                    <SelectionButton
                        isSelected={selectedCountry === otherCountriesLabel}
                        onClick={() => onCountrySelect(otherCountriesLabel, 'manual')}
                        className="w-full text-left"
                    >
                        {otherCountriesLabel}
                    </SelectionButton>
                </div>
            </div>

            <div>
                <h3 className="text-left font-semibold text-gray-600 dark:text-gray-400 mb-2">{t('aggregatorsTitle')}</h3>
                <div className="border-t border-black/10 dark:border-white/10 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {aggregators.map((aggregator) => (
                        <SelectionButton
                            key={aggregator}
                            isSelected={selectedCountry === aggregator}
                            onClick={() => onCountrySelect(aggregator, 'manual')}
                            className="text-center"
                        >
                            {aggregator}
                        </SelectionButton>
                    ))}
                </div>
            </div>
        </div>
    </StepSection>
);

export default CountrySelectionStep;
