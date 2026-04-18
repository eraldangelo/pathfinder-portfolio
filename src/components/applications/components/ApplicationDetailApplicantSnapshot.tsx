import React from 'react';
import type { ApplicationInfo } from '../../../data/applications';
import type { Lead } from '../../leads/leads-page/LeadsPage';
import type { StudentInfoTab } from '../../leads/types/studentInfoTab';
import { useTranslation } from '../../../contexts/LanguageContext';
import { CakeIcon, ConsultantIcon, OfficeBuildingIcon, ShieldCheckIcon } from './icons';
import { formatDdMmmYyyy } from '../../../utils/date';

interface ApplicantSnapshotProps {
    application: ApplicationInfo;
    lead: Lead;
    onOpenStudentProfile: (studentId: string, targetTab?: StudentInfoTab, leadDocPath?: string) => void;
}

const ApplicantSnapshot: React.FC<ApplicantSnapshotProps> = ({ application, lead, onOpenStudentProfile }) => {
    const { t } = useTranslation();
    const assistedByDisplay = String(application.assistedBy || '').trim() || 'None';

    const handleViewProfile = (event: React.MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();
        onOpenStudentProfile(application.studentId, undefined, application.leadDocPath);
    };

    return (
        <div className="p-4 rounded-2xl backdrop-blur-md bg-white/30 dark:bg-black/20 shadow-lg border border-white/40 dark:border-white/10">
            <h3 className="text-lg font-semibold text-[#004097] dark:text-blue-300 mb-4">{t('applicantSnapshot')}</h3>
            <div>
                <div>
                    <p className="font-bold">{application.applicantName}</p>
                    <a href="#" onClick={handleViewProfile} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">{t('viewFullProfile')}</a>
                </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div className="flex items-center gap-3"><CakeIcon /> <span>{formatDdMmmYyyy(application.applicantDob)}</span></div>
                <div className="flex items-center gap-3"><ConsultantIcon /> <span>{lead.assignedCounsellor}</span></div>
                <div className="flex items-center gap-3"><OfficeBuildingIcon /> <span>{lead.branch}</span></div>
                <div className="flex items-center gap-3">
                    <div className={`flex-shrink-0 ${application.visaRefusal === 'Yes' ? 'text-red-500' : 'text-green-500'}`}>
                        <ShieldCheckIcon refused={application.visaRefusal === 'Yes'} />
                    </div>
                    <span>{t('visaRefusalLabel')} {t(application.visaRefusal.toLowerCase())}</span>
                </div>
                <div className="flex items-center gap-3 col-span-2">
                    <ConsultantIcon />
                    <span>
                        {t('admissionAssistantLabel', 'Admission Assistant')}: {assistedByDisplay}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ApplicantSnapshot;

