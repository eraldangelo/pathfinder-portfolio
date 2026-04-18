import React from 'react';
import { StepSection } from './common';
import type { Translator } from '../types';

interface NotesStepProps {
    t: Translator;
    notes: string;
    assistedBy: string;
    assistanceOptions: string[];
    onNotesChange: (value: string) => void;
    onAssistedByChange: (value: string) => void;
}

const NotesStep: React.FC<NotesStepProps> = ({
    t,
    notes,
    assistedBy,
    assistanceOptions,
    onNotesChange,
    onAssistedByChange,
}) => (
    <StepSection>
        <p className="text-lg mb-4">
            {t('additionalNotes')}
            <span className="text-red-500">*</span>
        </p>
        <textarea
            value={notes}
            onChange={(event) => onNotesChange(event.target.value)}
            rows={5}
            required
            className="w-full p-2 rounded-md bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10"
        ></textarea>
        <p className={`text-xs text-right mt-1 ${notes.length < 20 ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
            {t('charactersMinimum', { current: notes.length, min: 20 })}
        </p>

        <div className="mt-4">
            <label className="block text-lg mb-2">
                {t('whoAssistedApplying', 'Who assisted you in applying?')}
                <span className="text-red-500">*</span>
            </label>
            <select
                value={assistedBy}
                onChange={(event) => onAssistedByChange(event.target.value)}
                required
                className="w-full p-2 rounded-md bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10"
            >
                {assistanceOptions.map((name) => (
                    <option key={name} value={name}>
                        {name}
                    </option>
                ))}
            </select>
        </div>
    </StepSection>
);

export default NotesStep;
