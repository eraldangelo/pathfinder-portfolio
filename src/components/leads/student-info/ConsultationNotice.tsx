import React from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';

interface ConsultationNoticeProps {
}

const ConsultationNotice: React.FC<ConsultationNoticeProps> = () => {
    const { t } = useTranslation();

    return (
        <div className="text-center py-20">
            <p className="text-lg font-semibold text-gray-600 dark:text-gray-400">{t('consultationNotApplicableManager')}</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">{t('consultationAccessDenied')}</p>
        </div>
    );
};

export default ConsultationNotice;

