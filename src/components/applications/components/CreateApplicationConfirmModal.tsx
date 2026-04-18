import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';
import type { ApplicationData } from '../../leads/student-info-modal/StudentInfoModal';
import { createOrUpdateApplication } from '../../../services/applicationService';
import CreateApplicationSteps from '../create-application/CreateApplicationSteps';
import { modalOverlay, modalSurface } from '../../common/styles/ui';
import type { CreateApplicationConfirmModalProps, EntryMode } from '../types/CreateApplicationConfirmModalTypes';
import { aggregators, countries, schoolsByCountry } from '../constants/CreateApplicationConfirmModalConstants';
import { CREATE_APPLICATION_MODAL_STYLES } from '../constants/CreateApplicationConfirmModalStyles';
import { useApplicationAssistanceOptions } from '../hooks/useApplicationAssistanceOptions';
import {
    emptyApplicationData,
    ensureProgramsBySchool,
    filterSchools,
    formatDateForDisplay,
    isStepValid as isStepValidFor,
} from '../utils/CreateApplicationConfirmModalUtils';

const CreateApplicationConfirmModal: React.FC<CreateApplicationConfirmModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    lead,
    user,
    allPersonnel,
    showPopup,
}) => {
    const { t } = useTranslation();
    const [step, setStep] = useState(1);
    const [entryMode, setEntryMode] = useState<EntryMode>('list');
    const [applicationData, setApplicationData] = useState<ApplicationData>(emptyApplicationData);
    const [schoolSearchTerm, setSchoolSearchTerm] = useState('');
    const [focusedDateId, setFocusedDateId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const otherCountriesLabel = t('otherCountries');

    useEffect(() => {
        if (isOpen) {
            setApplicationData(emptyApplicationData);
            setStep(1);
            setEntryMode('list');
            setSchoolSearchTerm('');
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const previousBodyOverflow = document.body.style.overflow;
        const previousHtmlOverflow = document.documentElement.style.overflow;
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previousBodyOverflow;
            document.documentElement.style.overflow = previousHtmlOverflow;
        };
    }, [isOpen]);
    
    const handleCountrySelect = (country: string, mode: 'list' | 'manual') => {
        setApplicationData(prev => ({...prev, country: country, schools: [] }));
        setEntryMode(mode);
        handleNext();
    };

    const handleNext = () => {
        // When moving to step 5, initialize programs array based on selected schools
        if (step === 4 || (step === 3 && applicationData.isPackage === false) || (step === 2 && entryMode === 'manual')) {
            setApplicationData(prev => ensureProgramsBySchool(prev));
        }

        if (step === 2 && entryMode === 'manual') {
            setStep(5); // Skip package questions for manual entry
            return;
        }
        if (step === 3 && applicationData.isPackage === false) {
            setStep(5); // Skip package school selection
        } else {
            setStep(prev => prev + 1);
        }
    };
    const handleBack = () => {
         if (step === 6) { // From notes step
            setStep(5);
            return;
         }
         if (step === 5) {
            if (entryMode === 'manual') {
                setStep(1);
                return;
            }
            if (applicationData.isPackage === false) {
                setStep(3); // Go back to package question
                return;
            }
             if (applicationData.isPackage === true) {
                setStep(4); // Go back to multi-school selection
                return;
            }
        }
        setStep(prev => prev - 1);
    };
    
    const handleSingleSchoolSelect = (schoolName: string) => {
        setApplicationData(prev => ({ ...prev, schools: [schoolName] }));
    };
    
    const handleMultiSchoolSelect = (schoolName: string) => {
        setApplicationData(prev => {
            const currentPrimarySchool = prev.schools[0];
            const otherSchools = prev.schools.slice(1);
            
            const newOtherSchools = otherSchools.includes(schoolName)
                ? otherSchools.filter(s => s !== schoolName)
                : [...otherSchools, schoolName];

            return { ...prev, schools: [currentPrimarySchool, ...newOtherSchools] };
        });
    };

    const handleProgramChange = (schoolName: string, programIndex: number, field: 'name' | 'intakeDate', value: string) => {
        setApplicationData(prev => {
            const newPrograms = { ...prev.programsBySchool };
            const schoolPrograms = [...newPrograms[schoolName]];
            schoolPrograms[programIndex] = { ...schoolPrograms[programIndex], [field]: value };
            newPrograms[schoolName] = schoolPrograms;
            return { ...prev, programsBySchool: newPrograms };
        });
    };

    const handleAddProgram = (schoolName: string) => {
        setApplicationData(prev => {
            const newPrograms = { ...prev.programsBySchool };
            const schoolPrograms = [...newPrograms[schoolName], { name: '', intakeDate: '' }];
            newPrograms[schoolName] = schoolPrograms;
            return { ...prev, programsBySchool: newPrograms };
        });
    };

    const handleRemoveProgram = (schoolName: string, programIndex: number) => {
        setApplicationData(prev => {
            const newPrograms = { ...prev.programsBySchool };
            const schoolPrograms = [...newPrograms[schoolName]];
            schoolPrograms.splice(programIndex, 1);
            newPrograms[schoolName] = schoolPrograms;
            return { ...prev, programsBySchool: newPrograms };
        });
    };

    const handleSubmit = async () => {
        setIsSaving(true);
        const result = await createOrUpdateApplication(lead, applicationData, user, t);
        setIsSaving(false);

        // FIX: Changed the conditional to use a strict equality check (=== false). This is a more robust way to perform type narrowing on a discriminated union with a boolean literal, resolving the TypeScript error.
        if (result.success === false) {
            showPopup(result.error.message);
            return;
        }

        onSuccess();
        const providerDisplayName = applicationData.schools.join(' / ');
        showPopup(t('popupAppCreatedSuccess', { applicantName: lead.fullName, providerName: providerDisplayName }));
    };
    
    const filteredSchools = useMemo(() => {
        return filterSchools(applicationData.country, schoolSearchTerm, schoolsByCountry);
    }, [applicationData.country, schoolSearchTerm]);

    const assistanceOptions = useApplicationAssistanceOptions(allPersonnel);

    const isStepValid = useMemo(() => {
        return isStepValidFor(step, applicationData, entryMode);
    }, [step, applicationData, entryMode]);

    if (!isOpen) return null;

    return (
        <div 
            className={`${modalOverlay} z-[60] flex items-center justify-center p-4 animate-fade-in`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="app-confirm-modal-title"
        >
            <div 
                className={`${modalSurface} flex flex-col w-full max-w-2xl transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale`}
                onClick={(e) => e.stopPropagation()}
            >
                <header className="relative p-4 sm:p-5 border-b border-black/5 dark:border-white/5 flex justify-center items-center flex-shrink-0">
                    <h2 id="app-confirm-modal-title" className="text-lg font-bold text-[#004097] dark:text-blue-400">{t('createNewApplicationTitle')}</h2>
                     <div className="absolute right-4 sm:right-5 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <button onClick={onClose} className="w-3.5 h-3.5 rounded-full bg-red-500 hover:bg-red-600" aria-label={t('closeModal')}></button>
                    </div>
                </header>
                
                {/* Step Content */}
                <CreateApplicationSteps
                    step={step}
                    entryMode={entryMode}
                    applicationData={applicationData}
                    setApplicationData={setApplicationData}
                    countries={countries}
                    aggregators={aggregators}
                    otherCountriesLabel={otherCountriesLabel}
                    schoolSearchTerm={schoolSearchTerm}
                    onSchoolSearchTermChange={setSchoolSearchTerm}
                    filteredSchools={filteredSchools}
                    onCountrySelect={handleCountrySelect}
                    onSingleSchoolSelect={handleSingleSchoolSelect}
                    onMultiSchoolSelect={handleMultiSchoolSelect}
                    focusedDateId={focusedDateId}
                    onFocusedDateChange={setFocusedDateId}
                    onProgramChange={handleProgramChange}
                    onAddProgram={handleAddProgram}
                    onRemoveProgram={handleRemoveProgram}
                    formatDateForDisplay={formatDateForDisplay}
                    assistanceOptions={assistanceOptions}
                    isStepValid={isStepValid}
                    isSaving={isSaving}
                    onBack={handleBack}
                    onNext={handleNext}
                    onSubmit={handleSubmit}
                />
            </div>
            <style>{CREATE_APPLICATION_MODAL_STYLES}</style>
        </div>
    );
};

export default CreateApplicationConfirmModal;


