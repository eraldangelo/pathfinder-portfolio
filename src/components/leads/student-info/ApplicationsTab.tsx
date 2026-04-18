import React from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';
import type { ApplicationInfo } from '../../../data/applications';
import SchoolLogo from '../../common/components/SchoolLogo';
import { getStatusLabel } from '../../applications/utils/ApplicationDetailUtils';

const PlusIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

interface ApplicationsTabProps {
    applications: ApplicationInfo[];
    onCreateApplication: () => void;
    onOpenApplicationDetail: (applicationId: string) => void;
    onClose: () => void;
    canCreateApplication: boolean;
}

const ApplicationsTab: React.FC<ApplicationsTabProps> = ({ applications, onCreateApplication, onOpenApplicationDetail, onClose, canCreateApplication }) => {
    const { t } = useTranslation();

    // FIX: Replaced the limited switch-case with a more robust, keyword-based function for styling status chips, ensuring consistency with ApplicationDetailPage and correctly handling the "Submitted" status.
    const getStatusChipClass = (status: string) => {
        const lowerStatus = status.toLowerCase();
         if (lowerStatus.includes('granted')) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
        if (lowerStatus.includes('unconditional') || lowerStatus.includes('received')) return 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200';
        if (lowerStatus.includes('required') || lowerStatus.includes('refused') || lowerStatus.includes('withdrawn')) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
        if (lowerStatus.includes('conditional') || lowerStatus.includes('refund')) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
        if (lowerStatus.includes('submitted') || lowerStatus.includes('lodged') || lowerStatus.includes('processed')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    };

    return (
        <div className="space-y-4">
             <div className="flex justify-end items-center">
                {canCreateApplication && (
                    <button
                        onClick={onCreateApplication}
                        title={t('createNewApplication')}
                        aria-label={t('createNewApplication')}
                        className="glass-btn pathfinder-blue w-11 h-11 rounded-full p-0"
                    >
                        <PlusIcon className="w-5 h-5" />
                    </button>
                )}
            </div>
            <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/10">
                <table className="w-full text-sm text-left">
                    <thead className="bg-black/5 dark:bg-white/5 text-xs uppercase text-gray-500 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-2 sm:px-4 py-3 font-semibold">#</th>
                            <th scope="col" className="px-2 sm:px-4 py-3 font-semibold">{t('provider')}</th>
                            <th scope="col" className="px-2 sm:px-4 py-3 font-semibold">{t('course')}</th>
                            <th scope="col" className="px-2 sm:px-4 py-3 font-semibold">{t('status')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {applications.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-4 py-10 text-center text-gray-500 dark:text-gray-400">
                                    {t('noApplicationsAvailable')}
                                </td>
                            </tr>
                        ) : (
                           applications.map((app, index) => {
                            const providerNames = app.schoolCourses.map(sc => sc.schoolName);
                            const providerName = providerNames.join(' / ');
                            const primarySchoolName = providerNames.length > 0 ? providerNames[providerNames.length - 1] : providerName;
                            const courses = app.schoolCourses.flatMap(sc => sc.courses.map(c => c.programName));

                            return (
                                <tr 
                                    key={app.id} 
                                    className="border-b border-black/5 dark:border-white/5 last:border-b-0 cursor-pointer hover:bg-black/10 dark:hover:bg-white/10"
                                    onClick={() => {
                                        onOpenApplicationDetail(app.id);
                                        onClose();
                                    }}
                                >
                                       <td className="px-2 py-2 sm:px-4 sm:py-3 font-medium text-gray-700 dark:text-gray-400">{index + 1}</td>
                                       <td className="px-2 py-2 sm:px-4 sm:py-3 font-medium text-gray-700 dark:text-gray-400">
                                           <div className="flex items-start gap-3">
                                               <SchoolLogo schoolName={primarySchoolName} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                                               <div>
                                                   {providerName.split(' / ').map((p, i) => (
                                                       <div key={i}>
                                                           {i > 0 ? '+ ' : ''}{p}
                                                       </div>
                                                   ))}
                                               </div>
                                           </div>
                                       </td>
                                       <td className="px-2 py-2 sm:px-4 sm:py-3 text-gray-700 dark:text-gray-400">
                                            {courses.length > 0 ? (
                                                <ul className="list-disc list-inside space-y-1">
                                                    {courses.map((c, i) => (
                                                        <li key={i}>{c}</li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                'N/A'
                                            )}
                                       </td>
                                       <td className="px-2 py-2 sm:px-4 sm:py-3">
                                           <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusChipClass(app.status)}`}>
                                               {getStatusLabel(t, app.status)}
                                           </span>
                                       </td>
                                   </tr>
                                );
                           })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ApplicationsTab;

