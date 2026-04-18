import React from 'react';
import type { ApplicationInfo } from '../../../data/applications';
import SchoolLogo from '../../common/components/SchoolLogo';
import type { Lead } from '../../leads/leads-page/LeadsPage';
import { useTranslation } from '../../../contexts/LanguageContext';
import { getStatusChipClass, getStatusLabel } from '../utils/ApplicationDetailUtils';
import { ArrowLeftIcon } from './icons';

interface HeaderSectionProps {
    application: ApplicationInfo;
    lead: Lead;
    providerDisplayName: string;
    onNavigateBack: () => void;
}

const HeaderSection: React.FC<HeaderSectionProps> = ({ application, lead, providerDisplayName, onNavigateBack }) => {
    const { t } = useTranslation();

    return (
        <header className="relative z-10 mb-6">
            <button onClick={onNavigateBack} className="text-sm text-[#004097] dark:text-blue-300 hover:underline flex items-center gap-1.5 mb-4">
                <ArrowLeftIcon />
                {t('backToApplicationsList')}
            </button>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 rounded-2xl backdrop-blur-md bg-white/30 dark:bg-black/20 shadow-md border border-white/40 dark:border-white/10">
                <div className="flex items-center gap-4 flex-grow">
                    <SchoolLogo schoolName={providerDisplayName} className="w-16 h-16 rounded-full object-contain bg-white p-1 shadow-md flex-shrink-0 hidden sm:block" />
                    <div className="text-left">
                        <h1 className="text-2xl font-bold text-[#004097] dark:text-blue-300">{application.applicantName}</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            <span className="font-semibold">{providerDisplayName}</span> | {t('caseId')}: {lead.caseId}
                        </p>
                    </div>
                </div>
                <div className={`flex-shrink-0 px-3 py-1.5 text-sm font-semibold rounded-full ${getStatusChipClass(application.status)}`}>
                    {getStatusLabel(t, application.status)}
                </div>
            </div>
        </header>
    );
};

export default HeaderSection;

