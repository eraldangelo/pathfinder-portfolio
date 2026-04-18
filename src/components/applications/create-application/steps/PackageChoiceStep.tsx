import React from 'react';
import { SelectionButton, StepSection } from './common';
import type { Translator } from '../types';

interface PackageChoiceStepProps {
    t: Translator;
    isPackage: boolean | null;
    onPackageChoice: (isPackage: boolean) => void;
}

const PackageChoiceStep: React.FC<PackageChoiceStepProps> = ({ t, isPackage, onPackageChoice }) => (
    <StepSection>
        <p className="text-center text-lg mb-6">{t('packageCourseQuestion')}</p>
        <div className="flex justify-center gap-4">
            <SelectionButton
                isSelected={isPackage === true}
                onClick={() => onPackageChoice(true)}
                className="w-32 text-center"
            >
                {t('yes')}
            </SelectionButton>
            <SelectionButton
                isSelected={isPackage === false}
                onClick={() => onPackageChoice(false)}
                className="w-32 text-center"
            >
                {t('no')}
            </SelectionButton>
        </div>
    </StepSection>
);

export default PackageChoiceStep;
