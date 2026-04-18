import React, { useCallback } from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';
import type { ApplicationData } from '../../leads/student-info-modal/StudentInfoModal';
import CountrySelectionStep from './steps/CountrySelectionStep';
import SchoolSelectionStep from './steps/SchoolSelectionStep';
import PackageChoiceStep from './steps/PackageChoiceStep';
import PackageSchoolsStep from './steps/PackageSchoolsStep';
import ProgramDetailsStep from './steps/ProgramDetailsStep';
import NotesStep from './steps/NotesStep';
import CreateApplicationFooter from './CreateApplicationFooter';

interface CreateApplicationStepsProps {
    step: number;
    entryMode: 'list' | 'manual';
    applicationData: ApplicationData;
    setApplicationData: React.Dispatch<React.SetStateAction<ApplicationData>>;
    countries: string[];
    aggregators: string[];
    otherCountriesLabel: string;
    schoolSearchTerm: string;
    onSchoolSearchTermChange: (term: string) => void;
    filteredSchools: string[];
    onCountrySelect: (country: string, mode: 'list' | 'manual') => void;
    onSingleSchoolSelect: (schoolName: string) => void;
    onMultiSchoolSelect: (schoolName: string) => void;
    focusedDateId: string | null;
    onFocusedDateChange: (id: string | null) => void;
    onProgramChange: (school: string, programIndex: number, field: 'name' | 'intakeDate', value: string) => void;
    onAddProgram: (school: string) => void;
    onRemoveProgram: (school: string, programIndex: number) => void;
    formatDateForDisplay: (dateString: string) => string;
    assistanceOptions: string[];
    isStepValid: boolean;
    isSaving: boolean;
    onBack: () => void;
    onNext: () => void;
    onSubmit: () => void;
}


const CreateApplicationSteps: React.FC<CreateApplicationStepsProps> = ({
    step,
    entryMode,
    applicationData,
    setApplicationData,
    countries,
    aggregators,
    otherCountriesLabel,
    schoolSearchTerm,
    onSchoolSearchTermChange,
    filteredSchools,
    onCountrySelect,
    onSingleSchoolSelect,
    onMultiSchoolSelect,
    focusedDateId,
    onFocusedDateChange,
    onProgramChange,
    onAddProgram,
    onRemoveProgram,
    formatDateForDisplay,
    assistanceOptions,
    isStepValid,
    isSaving,
    onBack,
    onNext,
    onSubmit,
}) => {
    const { t } = useTranslation();
    const handleManualSchoolChange = useCallback(
        (value: string) => {
            setApplicationData((prev) => ({ ...prev, schools: [value] }));
        },
        [setApplicationData]
    );
    const handlePackageChoice = useCallback(
        (value: boolean) => {
            setApplicationData((prev) => ({ ...prev, isPackage: value }));
        },
        [setApplicationData]
    );
    const handleNotesChange = useCallback(
        (value: string) => {
            setApplicationData((prev) => ({ ...prev, notes: value }));
        },
        [setApplicationData]
    );
    const handleAssistedByChange = useCallback(
        (value: string) => {
            setApplicationData((prev) => ({ ...prev, assistedBy: value }));
        },
        [setApplicationData]
    );

    return (
        <>
            <div className="h-[60vh] p-6 sm:p-8 overflow-hidden">
                {step === 1 && (
                    <CountrySelectionStep
                        t={t}
                        countries={countries}
                        aggregators={aggregators}
                        otherCountriesLabel={otherCountriesLabel}
                        selectedCountry={applicationData.country}
                        onCountrySelect={onCountrySelect}
                    />
                )}

                {step === 2 && (
                    <SchoolSelectionStep
                        t={t}
                        entryMode={entryMode}
                        country={applicationData.country}
                        schoolSearchTerm={schoolSearchTerm}
                        onSchoolSearchTermChange={onSchoolSearchTermChange}
                        filteredSchools={filteredSchools}
                        selectedSchools={applicationData.schools}
                        onSingleSchoolSelect={onSingleSchoolSelect}
                        manualSchoolName={applicationData.schools[0] || ''}
                        onManualSchoolChange={handleManualSchoolChange}
                    />
                )}

                {step === 3 && (
                    <PackageChoiceStep t={t} isPackage={applicationData.isPackage} onPackageChoice={handlePackageChoice} />
                )}

                {step === 4 && applicationData.isPackage && (
                    <PackageSchoolsStep
                        t={t}
                        country={applicationData.country}
                        schoolSearchTerm={schoolSearchTerm}
                        onSchoolSearchTermChange={onSchoolSearchTermChange}
                        filteredSchools={filteredSchools}
                        selectedSchools={applicationData.schools}
                        onMultiSchoolSelect={onMultiSchoolSelect}
                    />
                )}

                {step === 5 && (
                    <ProgramDetailsStep
                        t={t}
                        applicationData={applicationData}
                        focusedDateId={focusedDateId}
                        onFocusedDateChange={onFocusedDateChange}
                        onProgramChange={onProgramChange}
                        onAddProgram={onAddProgram}
                        onRemoveProgram={onRemoveProgram}
                        formatDateForDisplay={formatDateForDisplay}
                    />
                )}

                {step === 6 && (
                    <NotesStep
                        t={t}
                        notes={applicationData.notes}
                        assistedBy={applicationData.assistedBy}
                        assistanceOptions={assistanceOptions}
                        onNotesChange={handleNotesChange}
                        onAssistedByChange={handleAssistedByChange}
                    />
                )}
            </div>

            <CreateApplicationFooter
                step={step}
                isSaving={isSaving}
                isStepValid={isStepValid}
                onBack={onBack}
                onNext={onNext}
                onSubmit={onSubmit}
            />
        </>
    );
};

export default CreateApplicationSteps;
