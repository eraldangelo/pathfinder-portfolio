import React from 'react';
import type { ApplicationInfo } from '../../../data/applications';
import SchoolLogo from '../../common/components/SchoolLogo';
import CompactApplicationStatusBar from './CompactApplicationStatusBar';
import { useTranslation } from '../../../contexts/LanguageContext';
import { SortAscIcon, SortDescIcon } from './icons';
import type { SortConfig, SortableKeys } from '../types/ApplicationsPageTypes';
import { formatDdMmmYyyy } from '../../../utils/date';
import { getStatusLabel } from '../utils/ApplicationDetailUtils';

interface ApplicationsTableProps {
    applications: ApplicationInfo[];
    studentCaseIdMap: Map<string, string>;
    sortConfig: SortConfig;
    onRequestSort: (key: SortableKeys) => void;
    onOpenApplicationDetail: (applicationId: string) => void;
    formatStatusChangedDate: (date: ApplicationInfo['statusChanged']) => string;
    resolveApplicationCounsellor: (application: ApplicationInfo) => string;
    showAssignedCounsellorColumn: boolean;
    showBranchColumn: boolean;
}

const ApplicationsTable: React.FC<ApplicationsTableProps> = ({
    applications,
    studentCaseIdMap,
    sortConfig,
    onRequestSort,
    onOpenApplicationDetail,
    formatStatusChangedDate,
    resolveApplicationCounsellor,
    showAssignedCounsellorColumn,
    showBranchColumn,
}) => {
    const { t } = useTranslation();
    const tableColumnCount = 6 + (showAssignedCounsellorColumn ? 1 : 0) + (showBranchColumn ? 1 : 0);

    const getSortIndicator = (key: SortableKeys) => {
        if (!sortConfig || sortConfig.key !== key) return null;
        return sortConfig.direction === 'ascending' ? <SortAscIcon /> : <SortDescIcon />;
    };

    return (
        <table className="w-full min-w-[1050px] xl:min-w-[1300px] text-left text-[11px] sm:text-xs">
            <thead className="sticky top-0 bg-white/40 dark:bg-black/40 backdrop-blur-md z-10 text-xs uppercase text-gray-500 dark:text-gray-400">
                <tr className="border-b border-gray-900/10 dark:border-white/10">
                    <th className="p-2.5">
                        <button onClick={() => onRequestSort('id')} className="flex items-center gap-1 font-semibold">{t('caseId')} {getSortIndicator('id')}</button>
                    </th>
                    <th className="p-2.5">
                        <button onClick={() => onRequestSort('applicantName')} className="flex items-center gap-1 font-semibold">{t('applicant')} {getSortIndicator('applicantName')}</button>
                    </th>
                    <th className="p-2.5 font-semibold">{t('provider')}</th>
                    <th className="p-2.5 font-semibold">{t('course')}</th>
                    {showAssignedCounsellorColumn && (
                        <th className="p-2.5 font-semibold">{t('assignedCounsellor', 'Assigned Counsellor')}</th>
                    )}
                    <th className="p-2.5">
                        <button onClick={() => onRequestSort('status')} className="flex items-center gap-1 font-semibold">{t('status')} {getSortIndicator('status')}</button>
                    </th>
                    <th className="p-2.5 font-semibold">{t('progress')}</th>
                    {showBranchColumn && (
                        <th className="p-2.5">
                            <button onClick={() => onRequestSort('branch')} className="flex items-center gap-1 font-semibold">{t('branch')} {getSortIndicator('branch')}</button>
                        </th>
                    )}
                </tr>
            </thead>
            <tbody>
                {applications.length > 0 ? (
                    applications.map((app) => {
                        const providerNames = app.schoolCourses.map((sc) => sc.schoolName);
                        const providerName = providerNames.join(' / ');
                        const primarySchoolName = providerNames.length > 0 ? providerNames[providerNames.length - 1] : providerName;
                        const courses = app.schoolCourses.flatMap((sc) => sc.courses.map((c) => c.programName));
                        const hasMultipleCourses = courses.length > 1;
                        return (
                            <tr
                                key={app.id}
                                className="border-b border-gray-900/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                                onClick={() => onOpenApplicationDetail(app.id)}
                            >
                                <td className="px-2 py-2 sm:p-2.5 text-gray-600 dark:text-gray-400">
                                    <div>{studentCaseIdMap.get(app.studentId) || String(app.caseId || '').trim() || '--'}</div>
                                </td>
                                <td className="px-2 py-2 sm:p-2.5">
                                    <div className="font-semibold text-gray-900 dark:text-white">{app.applicantName}</div>
                                    <div className="text-gray-500 dark:text-gray-400">{formatDdMmmYyyy(app.applicantDob)}</div>
                                </td>
                                <td className="px-2 py-2 sm:p-2.5">
                                    <div className="flex items-center gap-2">
                                        <SchoolLogo schoolName={primarySchoolName} className="w-8 h-8 object-contain rounded-full flex-shrink-0" />
                                        <span className="font-semibold text-gray-800 dark:text-gray-200">{providerName}</span>
                                    </div>
                                </td>
                                <td className="px-2 py-2 sm:p-2.5 max-w-xs text-gray-700 dark:text-gray-300">
                                    {hasMultipleCourses ? (
                                        <ul className="list-disc pl-4 space-y-1">
                                            {courses.map((course, index) => (
                                                <li key={`${app.id}-course-${index}`} className="whitespace-normal break-words">
                                                    {course}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="whitespace-normal break-words">{courses[0] || '--'}</div>
                                    )}
                                </td>
                                {showAssignedCounsellorColumn && (
                                    <td className="px-2 py-2 sm:p-2.5 font-semibold text-gray-800 dark:text-gray-200">
                                        {resolveApplicationCounsellor(app) || '--'}
                                    </td>
                                )}
                                <td className="px-2 py-2 sm:p-2.5">
                                    <div className="font-semibold text-gray-900 dark:text-white">{getStatusLabel(t, app.status)}</div>
                                    <div className="text-gray-500 dark:text-gray-400">{formatStatusChangedDate(app.statusChanged)}</div>
                                </td>
                                <td className="px-2 py-2 sm:p-2.5 min-w-[120px]">
                                    <CompactApplicationStatusBar application={app} />
                                </td>
                                {showBranchColumn && (
                                    <td className="px-2 py-2 sm:p-2.5 font-semibold text-gray-800 dark:text-gray-200">{app.branch}</td>
                                )}
                            </tr>
                        );
                    })
                ) : (
                    <tr>
                        <td colSpan={tableColumnCount} className="px-4 py-10 text-center text-gray-500 dark:text-gray-400">
                            {t('noApplicationsAvailable')}
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    );
};

export default ApplicationsTable;
