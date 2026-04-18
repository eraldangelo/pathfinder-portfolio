import React from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';

interface LeadsPageHeaderProps {
    isReady: boolean;
}

export const LeadsPageHeader: React.FC<LeadsPageHeaderProps> = ({
    isReady,
}) => {
    const { t } = useTranslation();
    const titleAnimationClasses = `transition-all duration-700 ease-out ${isReady ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`;

    return (
        <div className={`relative z-10 mb-6 flex items-center ${titleAnimationClasses}`}>
            <div className="flex items-center">
                <h1 className="text-3xl font-bold text-[#004097] dark:text-blue-300">{t('studentProfile')}</h1>
            </div>
        </div>
    );
};

