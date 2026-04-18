import React from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';
import { useArchiveData } from '../../archive/components/archive-page/useArchiveData';
import {
  canViewArchiveRole,
  isAdministrativeStaffRole,
  isBranchManagerRole,
  isCounsellorRole,
  isDeveloperRole,
  isMarketingRole,
  isOperationsLikeRole,
} from '../../../utils/roles';
import type { LeadsDatasetTab, LeadsPageProps } from './LeadsPageTypes';
import { LeadsPageHeader } from './LeadsPageHeader';
import { useLeadsPageData } from './hooks/useLeadsPageData';
import { useArchiveLeadsPagination } from './hooks/useArchiveLeadsPagination';
import { useLeadsDatasetTab } from './hooks/useLeadsDatasetTab';
import { LeadsArchivedDatasetSection } from './sections/LeadsArchivedDatasetSection';
import { LeadsCurrentDatasetSection } from './sections/LeadsCurrentDatasetSection';
import { LeadsDatasetToolbar } from './sections/LeadsDatasetToolbar';
import { downloadLeadsAsXls } from './utils/leadsPageXls';

export type { Lead, LogEntry, Note } from './LeadsPageTypes';

const resolveInitialDatasetTab = (
  initialViewTab: LeadsDatasetTab,
  canViewArchivedLeads: boolean,
) => (initialViewTab === 'archived' && canViewArchivedLeads ? 'archived' : 'current');

export const LeadsPage: React.FC<LeadsPageProps> = ({
  isReady,
  user,
  role,
  leads,
  assessmentSubmissions = [],
  applications,
  allPersonnel,
  showPopup,
  initialViewTab = 'current',
  onOpenStudentProfile,
  onUpdateLead,
  onAddLogEntry,
}) => {
  const { t } = useTranslation();

  const canViewArchivedLeads = canViewArchiveRole(role);
  const { activeDatasetTab, setActiveDatasetTab } = useLeadsDatasetTab(
    resolveInitialDatasetTab(initialViewTab, canViewArchivedLeads),
    canViewArchivedLeads,
  );

  const pageData = useLeadsPageData({
    assessmentSubmissions,
    applications,
    allPersonnel,
    role,
    user,
    leads,
    onUpdateLead,
    onAddLogEntry,
    showPopup,
    t,
  });

  const archiveData = useArchiveData({
    userRole: role,
    userBranch: user.branch || '',
    userUid: user.uid,
    userDisplayName: user.displayName,
    enabled: canViewArchivedLeads && activeDatasetTab === 'archived',
  });

  const archivePagination = useArchiveLeadsPagination({
    activeDatasetTab,
    filteredLeads: archiveData.filteredLeads,
    searchTerm: archiveData.searchTerm,
    selectedBranch: archiveData.selectedBranch,
    selectedYear: archiveData.selectedYear,
  });

  const showAssignedCounsellor = !isCounsellorRole(role);
  const showBranchColumn = !isBranchManagerRole(role) && !isCounsellorRole(role) && !isAdministrativeStaffRole(role);
  const canEditTableStatus = !isBranchManagerRole(role) && !isMarketingRole(role);
  const canDownloadXls = isDeveloperRole(role) || isOperationsLikeRole(role);
  const isDownloadDisabled = activeDatasetTab === 'archived' && archiveData.isLoading;

  const handleDownloadXls = () =>
    downloadLeadsAsXls({
      activeDatasetTab,
      sortedLeads: pageData.sortedLeads,
      archivedLeads: archiveData.filteredLeads,
      archiveSelectedYear: archiveData.selectedYear,
      archiveSelectedBranch: archiveData.selectedBranch,
      showPopup,
      t,
    });

  return (
    <div className="relative w-full min-h-full max-w-[1920px] mx-auto">
      <div className="w-full min-h-full px-3 pt-24 sm:px-4 lg:px-8 pb-16 flex flex-col gap-4 text-sm text-gray-700 dark:text-gray-300">
        <LeadsPageHeader isReady={isReady} />

        <LeadsDatasetToolbar
          t={t}
          canViewArchivedLeads={canViewArchivedLeads}
          canDownloadXls={canDownloadXls}
          activeDatasetTab={activeDatasetTab}
          onDatasetTabChange={setActiveDatasetTab}
          onDownloadXls={handleDownloadXls}
          isDownloadDisabled={isDownloadDisabled}
        />

        {activeDatasetTab === 'current' ? (
          <LeadsCurrentDatasetSection
            role={role}
            pageData={pageData}
            onOpenStudentProfile={onOpenStudentProfile}
            showAssignedCounsellor={showAssignedCounsellor}
            showBranchColumn={showBranchColumn}
            canEditTableStatus={canEditTableStatus}
          />
        ) : (
          <LeadsArchivedDatasetSection
            t={t}
            archiveData={archiveData}
            rows={archivePagination.paginatedArchivedLeads}
            totalCount={archivePagination.archivedTotalCount}
            currentPage={archivePagination.archiveCurrentPage}
            totalPages={archivePagination.archivedTotalPages}
            pageCount={archivePagination.archivedPageCount}
            onPageChange={archivePagination.setArchiveCurrentPage}
            onOpenStudentProfile={onOpenStudentProfile}
            showBranchColumn={showBranchColumn}
            showAssignedCounsellor={showAssignedCounsellor}
          />
        )}
      </div>
    </div>
  );
};
