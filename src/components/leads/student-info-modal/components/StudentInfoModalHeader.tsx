import React from 'react';
import { useTranslation } from '../../../../contexts/LanguageContext';

interface StudentInfoModalHeaderProps {
    onMinimize: () => void;
    onClose: () => void;
}

export const StudentInfoModalHeader: React.FC<StudentInfoModalHeaderProps> = ({
    onMinimize,
    onClose,
}) => {
    const { t } = useTranslation();

    return (
        <header className="relative p-4 sm:p-5 border-b border-black/5 dark:border-white/5 flex justify-center items-center flex-shrink-0">
            <h2 id="student-info-title" className="text-lg font-bold text-[#004097] dark:text-blue-400">{t('studentInformation')}</h2>
            <div className="absolute right-4 sm:right-5 top-1/2 -translate-y-1/2 flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <button onClick={onMinimize} className="w-3.5 h-3.5 rounded-full bg-yellow-500 hover:bg-yellow-600" aria-label={t('minimize')}></button>
                    <button onClick={onClose} className="w-3.5 h-3.5 rounded-full bg-red-500 hover:bg-red-600" aria-label={t('closeModal')}></button>
                </div>
            </div>
        </header>
    );
};
