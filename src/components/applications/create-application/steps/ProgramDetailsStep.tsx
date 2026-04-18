import React from 'react';
import type { ApplicationData } from '../../../leads/student-info-modal/StudentInfoModal';
import { StepSection } from './common';
import type { Translator } from '../types';

const XIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

interface ProgramEntryProps {
    t: Translator;
    schoolIndex: number;
    programIndex: number;
    programName: string;
    intakeDate: string;
    formatDateForDisplay: (dateString: string) => string;
    focusedDateId: string | null;
    onFocusedDateChange: (id: string | null) => void;
    onProgramChange: (field: 'name' | 'intakeDate', value: string) => void;
    onRemove?: () => void;
}

const ProgramEntry: React.FC<ProgramEntryProps> = ({
    t,
    schoolIndex,
    programIndex,
    programName,
    intakeDate,
    formatDateForDisplay,
    focusedDateId,
    onFocusedDateChange,
    onProgramChange,
    onRemove,
}) => (
    <div className="p-3 rounded-md bg-white/50 dark:bg-black/20 space-y-3">
        <div className="flex items-center gap-2">
            <input
                type="text"
                value={programName}
                onChange={(event) => onProgramChange('name', event.target.value)}
                placeholder={t('programName')}
                className="w-full p-2 text-sm rounded-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600"
            />
            {onRemove && (
                <button
                    type="button"
                    onClick={onRemove}
                    className="h-9 w-9 flex items-center justify-center rounded-full text-red-500 hover:bg-red-500/10 flex-shrink-0"
                    aria-label={t('removeProgram')}
                >
                    <XIcon className="w-4 h-4" />
                </button>
            )}
        </div>
        <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('intakeDate')}</label>
            <div className="relative">
                <input
                    type={focusedDateId === `${schoolIndex}-${programIndex}` ? 'month' : 'text'}
                    value={
                        focusedDateId === `${schoolIndex}-${programIndex}`
                            ? intakeDate
                            : formatDateForDisplay(intakeDate)
                    }
                    placeholder="MMM-YYYY"
                    onFocus={() => onFocusedDateChange(`${schoolIndex}-${programIndex}`)}
                    onBlur={() => onFocusedDateChange(null)}
                    onChange={(event) => onProgramChange('intakeDate', event.target.value)}
                    className="w-full text-sm font-semibold bg-white dark:bg-gray-800 p-2 rounded-md border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>
        </div>
    </div>
);

interface ProgramDetailsStepProps {
    t: Translator;
    applicationData: ApplicationData;
    focusedDateId: string | null;
    onFocusedDateChange: (id: string | null) => void;
    onProgramChange: (school: string, programIndex: number, field: 'name' | 'intakeDate', value: string) => void;
    onAddProgram: (school: string) => void;
    onRemoveProgram: (school: string, programIndex: number) => void;
    formatDateForDisplay: (dateString: string) => string;
}

const ProgramDetailsStep: React.FC<ProgramDetailsStepProps> = ({
    t,
    applicationData,
    focusedDateId,
    onFocusedDateChange,
    onProgramChange,
    onAddProgram,
    onRemoveProgram,
    formatDateForDisplay,
}) => (
    <StepSection>
        <p className="text-lg mb-4">{t('enterProgramDetails')}</p>
        <div className="space-y-4 max-h-[45vh] overflow-y-auto custom-scrollbar -mr-2 pr-2">
            {applicationData.schools.map((school, schoolIndex) => {
                const programs = applicationData.programsBySchool[school] || [];
                return (
                    <div
                        key={schoolIndex}
                        className="p-4 rounded-md bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 space-y-3"
                    >
                        <p className="font-semibold text-gray-800 dark:text-white">{school}</p>
                        {programs.map((program, programIndex) => (
                            <ProgramEntry
                                key={programIndex}
                                t={t}
                                schoolIndex={schoolIndex}
                                programIndex={programIndex}
                                programName={program.name}
                                intakeDate={program.intakeDate}
                                formatDateForDisplay={formatDateForDisplay}
                                focusedDateId={focusedDateId}
                                onFocusedDateChange={onFocusedDateChange}
                                onProgramChange={(field, value) => onProgramChange(school, programIndex, field, value)}
                                onRemove={programs.length > 1 ? () => onRemoveProgram(school, programIndex) : undefined}
                            />
                        ))}
                        <button
                            type="button"
                            onClick={() => onAddProgram(school)}
                            className="w-full p-2 text-sm text-blue-600 dark:text-blue-400 font-semibold hover:bg-blue-500/10 rounded-md transition-colors"
                        >
                            {t('addAnotherProgram')}
                        </button>
                    </div>
                );
            })}
        </div>
    </StepSection>
);

export default ProgramDetailsStep;
