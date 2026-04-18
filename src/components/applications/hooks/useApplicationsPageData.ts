import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ApplicationInfo } from '../../../data/applications';
import type { Lead } from '../../leads/leads-page/LeadsPage';
import type { AssessmentSubmission } from '../../../types';
import type { SortConfig, SortDirection, SortableKeys } from '../types/ApplicationsPageTypes';
import { isFinishedApplicationStatus } from '../utils/applicationProgress';
import { matchesApplicationBranchFilter } from '../constants/ApplicationsPageConfig';
import { matchesSearchTerm } from '../../../utils/searchMatcher';

export const ALL_COUNSELLORS_OPTION = 'All Counsellors';
export type ApplicationsViewTab = 'active' | 'finished';
const APPLICATIONS_ITEMS_PER_PAGE = 50;

interface UseApplicationsPageDataParams {
    applications: ApplicationInfo[];
    leads: Lead[];
    assessmentSubmissions: AssessmentSubmission[];
}

export const useApplicationsPageData = ({
    applications,
    leads,
    assessmentSubmissions,
}: UseApplicationsPageDataParams) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'applicantName', direction: 'ascending' });
    const [selectedBranch, setSelectedBranch] = useState('Philippines');
    const [selectedCounsellor, setSelectedCounsellor] = useState(ALL_COUNSELLORS_OPTION);
    const [studentSearchTerm, setStudentSearchTerm] = useState('');
    const [selectedViewTab, setSelectedViewTab] = useState<ApplicationsViewTab>('active');

    const studentCaseIdMap = useMemo(() => {
        const map = new Map<string, string>();
        leads.forEach((lead) => {
            map.set(lead.id, String(lead.caseId ?? '').trim());
        });
        assessmentSubmissions.forEach((submission) => {
            map.set(submission.id, String(submission.caseId ?? '').trim());
        });
        applications.forEach((application) => {
            const caseId = String(application.caseId ?? '').trim();
            if (!caseId) return;
            map.set(String(application.studentId || '').trim(), caseId);
        });
        return map;
    }, [applications, assessmentSubmissions, leads]);

    const studentCounsellorMap = useMemo(() => {
        const map = new Map<string, string>();
        const setIfPresent = (studentIdValue: unknown, counsellorValue: unknown) => {
            const studentId = String(studentIdValue || '').trim();
            const counsellor = String(counsellorValue || '').trim();
            if (!studentId || !counsellor) return;
            if (!map.has(studentId)) {
                map.set(studentId, counsellor);
            }
        };

        leads.forEach((lead) => {
            setIfPresent(lead.id, lead.assignedCounsellor);
        });

        assessmentSubmissions.forEach((submission) => {
            setIfPresent(submission.id, submission.assignedCounsellor);
        });

        applications.forEach((application) => {
            setIfPresent(application.studentId, application.assignedCounsellor);
        });

        return map;
    }, [applications, assessmentSubmissions, leads]);

    const resolveApplicationCounsellor = useCallback(
        (application: ApplicationInfo) => {
            const directCounsellor = String(application.assignedCounsellor || '').trim();
            if (directCounsellor) {
                return directCounsellor;
            }
            return studentCounsellorMap.get(String(application.studentId || '').trim()) || '';
        },
        [studentCounsellorMap],
    );

    const branchFilteredApplications = useMemo(
        () =>
            applications.filter((application) =>
                matchesApplicationBranchFilter(selectedBranch, String(application.branch || '')),
            ),
        [applications, selectedBranch],
    );

    const counsellorOptions = useMemo(() => {
        const options = new Set<string>();
        branchFilteredApplications.forEach((application) => {
            const counsellor = resolveApplicationCounsellor(application);
            if (counsellor) {
                options.add(counsellor);
            }
        });

        return [
            ALL_COUNSELLORS_OPTION,
            ...Array.from(options).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })),
        ];
    }, [branchFilteredApplications, resolveApplicationCounsellor]);

    const filteredApplications = useMemo(() => {
        const counsellorFilteredApplications = selectedCounsellor === ALL_COUNSELLORS_OPTION
            ? branchFilteredApplications
            : branchFilteredApplications.filter((application) =>
                resolveApplicationCounsellor(application).trim().toLowerCase() === selectedCounsellor.trim().toLowerCase(),
            );

        const tabFilteredApplications = counsellorFilteredApplications.filter((application) => {
            const isFinished = isFinishedApplicationStatus(application.status);
            return selectedViewTab === 'finished' ? isFinished : !isFinished;
        });

        if (!studentSearchTerm.trim()) {
            return tabFilteredApplications;
        }

        return tabFilteredApplications.filter((application) =>
            matchesSearchTerm({
                searchTerm: studentSearchTerm,
                textCandidates: [
                    application.applicantName,
                    application.caseId,
                    studentCaseIdMap.get(String(application.studentId || '').trim()),
                    application.studentId,
                    application.id,
                    resolveApplicationCounsellor(application),
                ],
            }),
        );
    }, [branchFilteredApplications, resolveApplicationCounsellor, selectedCounsellor, selectedViewTab, studentCaseIdMap, studentSearchTerm]);

    const sortedApplications = useMemo(() => {
        const sortableItems = [...filteredApplications];
        sortableItems.sort((a, b) => {
            if (sortConfig.key === 'id') {
                const aValue = studentCaseIdMap.get(a.studentId) || '';
                const bValue = studentCaseIdMap.get(b.studentId) || '';
                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            }

            if (sortConfig.key === 'statusChanged') {
                const dateA = a.statusChanged?.toMillis() || 0;
                const dateB = b.statusChanged?.toMillis() || 0;
                if (dateA < dateB) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (dateA > dateB) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            }

            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];
            if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        });
        return sortableItems;
    }, [filteredApplications, sortConfig, studentCaseIdMap]);

    const paginatedApplications = useMemo(() => {
        const startIndex = (currentPage - 1) * APPLICATIONS_ITEMS_PER_PAGE;
        return sortedApplications.slice(startIndex, startIndex + APPLICATIONS_ITEMS_PER_PAGE);
    }, [sortedApplications, currentPage]);

    const totalPages = Math.ceil(sortedApplications.length / APPLICATIONS_ITEMS_PER_PAGE);

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedBranch, selectedCounsellor, selectedViewTab, studentSearchTerm]);

    useEffect(() => {
        if (counsellorOptions.includes(selectedCounsellor)) return;
        setSelectedCounsellor(ALL_COUNSELLORS_OPTION);
    }, [counsellorOptions, selectedCounsellor]);

    const requestSort = (key: SortableKeys) => {
        let direction: SortDirection = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    return {
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
    };
};
