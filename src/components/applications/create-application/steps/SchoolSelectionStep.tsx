import React from 'react';
import SchoolSelector from '../SchoolSelector';
import { StepSection } from './common';
import type { Translator } from '../types';

interface SchoolSelectionStepProps {
    t: Translator;
    entryMode: 'list' | 'manual';
    country: string;
    schoolSearchTerm: string;
    onSchoolSearchTermChange: (term: string) => void;
    filteredSchools: string[];
    selectedSchools: string[];
    onSingleSchoolSelect: (schoolName: string) => void;
    manualSchoolName: string;
    onManualSchoolChange: (value: string) => void;
}

const SchoolSelectionStep: React.FC<SchoolSelectionStepProps> = ({
    t,
    entryMode,
    country,
    schoolSearchTerm,
    onSchoolSearchTermChange,
    filteredSchools,
    selectedSchools,
    onSingleSchoolSelect,
    manualSchoolName,
    onManualSchoolChange,
}) => {
    if (entryMode === 'list') {
        return (
            <SchoolSelector
                title={`${t('selectSchoolIn', { country })}:`}
                searchTerm={schoolSearchTerm}
                onSearchTermChange={onSchoolSearchTermChange}
                filteredSchools={filteredSchools}
                selectedSchools={selectedSchools}
                onSchoolSelect={onSingleSchoolSelect}
            />
        );
    }

    return (
        <StepSection>
            <p className="text-lg mb-2">{t('typeSchoolName')}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('schoolNameInstruction')}</p>
            <input
                type="text"
                value={manualSchoolName}
                onChange={(event) => onManualSchoolChange(event.target.value)}
                placeholder={t('schoolNameFor', { country })}
                className="w-full mb-4 p-2 rounded-md bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:ring-2 focus:ring-blue-500 outline-none"
            />
        </StepSection>
    );
};

export default SchoolSelectionStep;
