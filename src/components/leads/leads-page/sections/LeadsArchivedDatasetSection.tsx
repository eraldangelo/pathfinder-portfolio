import React, { useEffect, useState } from 'react';
import ArchiveFiltersPanel from '../../../archive/components/archive-page/ArchiveFiltersPanel';
import { ArchiveLeadsTable } from '../../../archive/components/archive-page/ArchiveTables';
import type { ArchiveLeadRow } from '../../../archive/components/archive-page/types';
import type { StudentInfoTab } from '../../types/studentInfoTab';
import { LeadsPagePagination } from '../LeadsPagePagination';

interface ArchiveDataLike {
  isLoading: boolean;
  selectedYear: string;
  setSelectedYear: (value: string) => void;
  yearOptions: string[];
  selectedBranch: string;
  setSelectedBranch: (value: string) => void;
  branchOptions: string[];
  isBranchSelectionLocked: boolean;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
}

interface LeadsArchivedDatasetSectionProps {
  t: (key: string, defaultValue?: string) => string;
  archiveData: ArchiveDataLike;
  rows: ArchiveLeadRow[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  onOpenStudentProfile: (leadId: string, targetTab?: StudentInfoTab, leadDocPath?: string) => void;
  showBranchColumn: boolean;
  showAssignedCounsellor: boolean;
}

export const LeadsArchivedDatasetSection: React.FC<LeadsArchivedDatasetSectionProps> = ({
  t,
  archiveData,
  rows,
  totalCount,
  currentPage,
  totalPages,
  pageCount,
  onPageChange,
  onOpenStudentProfile,
  showBranchColumn,
  showAssignedCounsellor,
}) => {
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
    onPageChange(safePage);
  };

  return (
    <>
    <ArchiveFiltersPanel
      t={t}
      selectedYear={archiveData.selectedYear}
      onSelectedYearChange={archiveData.setSelectedYear}
      yearOptions={archiveData.yearOptions}
      selectedBranch={archiveData.selectedBranch}
      onSelectedBranchChange={archiveData.setSelectedBranch}
      branchOptions={archiveData.branchOptions}
      isBranchSelectionLocked={archiveData.isBranchSelectionLocked}
      searchTerm={archiveData.searchTerm}
      onSearchTermChange={archiveData.setSearchTerm}
    />

    <div
      className={`flex-1 min-h-0 min-w-0 w-full max-w-[1700px] mx-auto rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md dark:backdrop-blur-sm bg-white/20 dark:bg-black/20 border border-white/20 dark:border-white/10 transition-all duration-200 ease-out motion-reduce:transition-none ${
        isPageTransitioning ? 'translate-y-0.5 opacity-60 pointer-events-none' : 'translate-y-0 opacity-100'
      }`}
    >
      <div className="w-full overflow-auto custom-scrollbar">
        {archiveData.isLoading ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            {t('loadingArchiveData', 'Loading archive data...')}
          </div>
        ) : totalCount === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            {t('noArchivedLeads', 'No archived leads found for this filter.')}
          </div>
        ) : (
          <ArchiveLeadsTable
            t={t}
            rows={rows}
            onOpenStudentProfile={onOpenStudentProfile}
            showBranchColumn={showBranchColumn}
            showAssignedCounsellor={showAssignedCounsellor}
          />
        )}
      </div>
    </div>

    {!archiveData.isLoading && totalCount > 0 ? (
      <LeadsPagePagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageCount={pageCount}
        totalCount={totalCount}
        onFirst={() => transitionToPage(1)}
        onPrev={() => transitionToPage(currentPage - 1)}
        onNext={() => transitionToPage(currentPage + 1)}
        onLast={() => transitionToPage(totalPages)}
        onPageChange={transitionToPage}
      />
    ) : null}
    </>
  );
};
