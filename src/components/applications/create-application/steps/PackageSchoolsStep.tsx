import React from 'react';
import SchoolSelector from '../SchoolSelector';
import type { Translator } from '../types';

interface PackageSchoolsStepProps {
    t: Translator;
    country: string;
    schoolSearchTerm: string;
    onSchoolSearchTermChange: (term: string) => void;
    filteredSchools: string[];
    selectedSchools: string[];
    onMultiSchoolSelect: (schoolName: string) => void;
}

const PackageSchoolsStep: React.FC<PackageSchoolsStepProps> = ({
    t,
    country,
    schoolSearchTerm,
    onSchoolSearchTermChange,
    filteredSchools,
    selectedSchools,
    onMultiSchoolSelect,
}) => (
    <SchoolSelector
        title={`${t('selectPackageSchool', { country })}:`}
        searchTerm={schoolSearchTerm}
        onSearchTermChange={onSchoolSearchTermChange}
        filteredSchools={filteredSchools.filter((school) => school !== selectedSchools[0])}
        selectedSchools={selectedSchools}
        onSchoolSelect={onMultiSchoolSelect}
    />
);

export default PackageSchoolsStep;
