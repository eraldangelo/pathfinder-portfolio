import React, { useEffect, useState } from 'react';
import type { ApplicationInfo } from '../../../data/applications';
import type { Lead } from '../../leads/leads-page/LeadsPage';
import type { AssessmentSubmission } from '../../../types';
import { useTranslation } from '../../../contexts/LanguageContext';
import { formatReadableDate } from '../../../utils/date';
// FIX: Use the exported FirebaseTimestamp instance type.
import { type FirebaseTimestamp } from '../../../types';
import {
    isAdministrativeStaffRole,
    isBranchManagerRole,
    isCounsellorRole,
    isDeveloperRole,
    isOperationsLikeRole,
} from '../../../utils/roles';
import { DownloadIcon } from '../../leads/components/icons';
import ApplicationsTable from './ApplicationsTable';
import ApplicationsPagination from './ApplicationsPagination';
import { ChevronDownIcon, ConsultantIcon, OfficeBuildingIcon, SearchIcon } from './icons';
import { APPLICATION_BRANCH_OPTIONS } from '../constants/ApplicationsPageConfig';
import { useApplicationsPageData } from '../hooks/useApplicationsPageData';
import { downloadApplicationsXls } from '../utils/applicationExportXls';
interface ApplicationsPageProps {
    isReady: boolean;
    userRole: string;
    applications: ApplicationInfo[];
    leads: Lead[];
    assessmentSubmissions: AssessmentSubmission[];
    onOpenApplicationDetail: (applicationId: string) => void;
}
const ApplicationsPage: React.FC<ApplicationsPageProps> = ({ isReady, userRole, applications, leads, assessmentSubmissions, onOpenApplicationDetail }) => {
    const { t, locale } = useTranslation();
    const titleAnimationClasses = `transition-all duration-700 ease-out ${isReady ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`;
    const shouldShowBranchFilter = !isBranchManagerRole(userRole) && !isCounsellorRole(userRole) && !isAdministrativeStaffRole(userRole);
    const filterGridClass = shouldShowBranchFilter ? 'md:grid-cols-2 xl:grid-cols-3' : 'sm:grid-cols-2';
    const shouldShowBranchColumn = shouldShowBranchFilter;
    const shouldShowAssignedCounsellorColumn =
        isDeveloperRole(userRole)
        || isOperationsLikeRole(userRole)
        || isBranchManagerRole(userRole)
        || isAdministrativeStaffRole(userRole);
    const canDownloadXls = isDeveloperRole(userRole) || isOperationsLikeRole(userRole);
    const {
        currentPage,
        setCurrentPage,
        sortConfig,
        selectedBranch,
        setSelectedBranch,
        selectedCounsellor,
        setSelectedCounsellor,
        studentSearchTerm,
        setStudentSearchTerm,
        selectedViewTab,
        setSelectedViewTab,
        studentCaseIdMap,
        resolveApplicationCounsellor,
        counsellorOptions,
        sortedApplications,
        paginatedApplications,
        totalPages,
        requestSort,
    } = useApplicationsPageData({ applications, leads, assessmentSubmissions });
    const [isPageTransitioning, setIsPageTransitioning] = useState(false);
    useEffect(() => {
        if (!isPageTransitioning) return;
        const timer = setTimeout(() => setIsPageTransitioning(false), 180);
        return () => clearTimeout(timer);
    }, [currentPage, isPageTransitioning]);
    const transitionToPage = (nextPage: number) => {
        const maxPage = Math.max(1, totalPages);
        const safePage = Math.min(Math.max(1, nextPage), maxPage);
        if (safePage === currentPage) return;
        setIsPageTransitioning(true);
        setCurrentPage(safePage);
    };
    const getViewTabClass = (tab: 'active' | 'finished') =>
        `glass-btn whitespace-nowrap rounded-xl px-5 py-2.5 text-sm font-semibold tracking-tight transition-all duration-200 ${
            selectedViewTab === tab
                ? 'pathfinder-blue text-white dark:text-blue-50 border-blue-300/45 dark:border-blue-300/35 scale-[1.01]'
                : 'gray text-slate-700 dark:text-slate-200 border-white/45 dark:border-white/15 hover:scale-[1.01]'
        }`;
    const handleDownloadXls = () => {
        downloadApplicationsXls({
            applications: sortedApplications,
            selectedViewTab,
            studentCaseIdMap,
                resolveApplicationCounsellor,
            });
    };
    const formatStatusChangedDate = (date: FirebaseTimestamp) => {
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        };
        return formatReadableDate(date, options, locale);
    };
    return (
        <div className="relative w-full min-h-full max-w-[1920px] mx-auto">
            <div className="w-full min-h-full px-3 pt-24 sm:px-4 lg:px-8 pb-16 flex flex-col gap-4 text-gray-700 dark:text-gray-300">
                <div className={`relative z-10 mb-6 flex justify-between items-center ${titleAnimationClasses}`}>
                    <div className="flex items-center">
                        <h1 className="text-3xl font-bold text-[#004097] dark:text-blue-300">{t('applications')}</h1>
                    </div>
                </div>

                <div className="mb-1 flex items-center justify-between gap-4">
                    <div className="crystal-glass-multi relative flex w-fit items-center gap-2 rounded-2xl border border-white/35 dark:border-white/15 p-2.5 shadow-[0_16px_40px_rgba(15,23,42,0.16)] dark:shadow-[0_20px_50px_rgba(2,6,23,0.55)]">
                        <span className="pointer-events-none absolute inset-x-3 top-1 h-5 rounded-full bg-white/35 dark:bg-white/10 blur-sm" aria-hidden="true" />
                        <button
                            type="button"
                            onClick={() => setSelectedViewTab('active')}
                            className={`relative z-10 ${getViewTabClass('active')}`}
                        >
                            {t('activeApplication', 'Active Application')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedViewTab('finished')}
                            className={`relative z-10 ${getViewTabClass('finished')}`}
                        >
                            {t('finishedApplication', 'Finished Application')}
                        </button>
                    </div>
                    {canDownloadXls ? (
                        <button
                            type="button"
                            onClick={handleDownloadXls}
                            className="glass-btn pathfinder-green h-11 w-11 rounded-full p-0 text-emerald-800 dark:text-emerald-100 flex items-center justify-center"
                            title={t('downloadXls', 'Download XLS')}
                            aria-label={t('downloadXls', 'Download XLS')}
                        >
                            <DownloadIcon className="w-4 h-4" />
                        </button>
                    ) : null}
                </div>
                <div className={`grid grid-cols-1 ${filterGridClass} gap-4 items-end mb-6 backdrop-blur-md bg-white/30 dark:bg-black/20 shadow-md border border-white/40 dark:border-white/10 rounded-2xl p-4`}>
                    {shouldShowBranchFilter && (
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('branch', 'Branch')}</label>
                            <div className="relative mt-1">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500 dark:text-gray-400">
                                    <OfficeBuildingIcon />
                                </div>
                                <select
                                    value={selectedBranch}
                                    onChange={(event) => setSelectedBranch(event.target.value)}
                                    className="w-full pl-10 pr-8 py-2 text-sm bg-white/60 dark:bg-black/40 border border-gray-400/50 dark:border-white/20 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                                >
                                    {APPLICATION_BRANCH_OPTIONS.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                                    <ChevronDownIcon />
                                </div>
                            </div>
                        </div>
                    )}
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('counsellor', 'Counsellor')}</label>
                        <div className="relative mt-1">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500 dark:text-gray-400">
                                <ConsultantIcon />
                            </div>
                            <select
                                value={selectedCounsellor}
                                onChange={(event) => setSelectedCounsellor(event.target.value)}
                                className="w-full pl-10 pr-8 py-2 text-sm bg-white/60 dark:bg-black/40 border border-gray-400/50 dark:border-white/20 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                            >
                                {counsellorOptions.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                                <ChevronDownIcon />
                            </div>
                        </div>
                    </div>
                    <div className="col-span-1">
                        <label htmlFor="applications-search" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('keywords', 'Keywords')}
                        </label>
                        <div className="relative mt-1">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500 dark:text-gray-400">
                                <SearchIcon className="w-5 h-5" />
                            </div>
                            <input
                                id="applications-search"
                                type="text"
                                value={studentSearchTerm}
                                onChange={(event) => setStudentSearchTerm(event.target.value)}
                                placeholder={t('searchByStudentName', 'Search student name')}
                                aria-label={t('searchByStudentName', 'Search student name')}
                                className="w-full pl-10 pr-4 py-2 text-sm bg-white/60 dark:bg-black/40 border border-gray-400/50 dark:border-white/20 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>
                <div
                    className={`flex-1 min-h-0 min-w-0 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md dark:backdrop-blur-sm bg-white/20 dark:bg-black/20 border border-white/20 dark:border-white/10 transition-all duration-200 ease-out motion-reduce:transition-none ${
                        isPageTransitioning ? 'translate-y-0.5 opacity-60 pointer-events-none' : 'translate-y-0 opacity-100'
                    }`}
                >
                    <div className="w-full overflow-auto custom-scrollbar">
                        <ApplicationsTable
                            applications={paginatedApplications}
                            studentCaseIdMap={studentCaseIdMap}
                            sortConfig={sortConfig}
                            onRequestSort={requestSort}
                            onOpenApplicationDetail={onOpenApplicationDetail}
                            formatStatusChangedDate={formatStatusChangedDate}
                            resolveApplicationCounsellor={resolveApplicationCounsellor}
                            showAssignedCounsellorColumn={shouldShowAssignedCounsellorColumn}
                            showBranchColumn={shouldShowBranchColumn}
                        />
                    </div>
                </div>
                <div className="mt-4 flex w-full flex-col gap-3">
                    <p className="text-xs font-semibold">{t('showingRecords', { count: paginatedApplications.length, total: sortedApplications.length })}</p>
                    <div className="flex w-full justify-center">
                        <ApplicationsPagination currentPage={currentPage} totalPages={totalPages} onPageChange={transitionToPage} />
                    </div>
                </div>
            </div>
        </div>
    );
};
export default ApplicationsPage;
