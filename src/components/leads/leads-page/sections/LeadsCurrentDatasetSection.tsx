import React, { useEffect, useState } from 'react';
import { LeadsPageFilters } from '../LeadsPageFilters';
import { LeadsPagePagination } from '../LeadsPagePagination';
import { LeadsPageTable } from '../LeadsPageTable';
import type { LeadsPageDataResult } from '../hooks/useLeadsPageData';

interface LeadsCurrentDatasetSectionProps {
  role: string;
  pageData: LeadsPageDataResult;
  onOpenStudentProfile: (leadId: string) => void;
  showAssignedCounsellor: boolean;
  showBranchColumn: boolean;
  canEditTableStatus: boolean;
}

export const LeadsCurrentDatasetSection: React.FC<LeadsCurrentDatasetSectionProps> = ({
  role,
  pageData,
  onOpenStudentProfile,
  showAssignedCounsellor,
  showBranchColumn,
  canEditTableStatus,
}) => {
  const {
    selectedBranch,
    setSelectedBranch,
    branchOptions,
    selectedMonth,
    setSelectedMonth,
    monthOptions,
    selectedCounsellor,
    setSelectedCounsellor,
    counsellorOptions,
    searchTerm,
    setSearchTerm,
    paginatedLeads,
    sortConfig,
    requestSort,
    handleStatusChange,
    currentPage,
    setCurrentPage,
    totalPages,
    pageCount,
    totalCount,
  } = pageData;

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

  return (
    <>
      <LeadsPageFilters
        role={role}
        selectedBranch={selectedBranch}
        onBranchChange={setSelectedBranch}
        branchOptions={branchOptions}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        monthOptions={monthOptions}
        selectedCounsellor={selectedCounsellor}
        onCounsellorChange={setSelectedCounsellor}
        counsellorOptions={counsellorOptions}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <div
        className={`transition-all duration-200 ease-out motion-reduce:transition-none ${
          isPageTransitioning ? 'translate-y-0.5 opacity-60 pointer-events-none' : 'translate-y-0 opacity-100'
        }`}
      >
        <LeadsPageTable
          leads={paginatedLeads}
          sortConfig={sortConfig}
          onRequestSort={requestSort}
          onOpenStudentProfile={onOpenStudentProfile}
          onStatusChange={handleStatusChange}
          showBranchColumn={showBranchColumn}
          showAssignedCounsellor={showAssignedCounsellor}
          canEditStatus={canEditTableStatus}
        />
      </div>

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
    </>
  );
};
