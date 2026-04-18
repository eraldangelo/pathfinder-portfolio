import { useEffect, useMemo, useState } from 'react';
import type { ArchiveLeadRow } from '../../../archive/components/archive-page/types';
import type { LeadsDatasetTab } from '../LeadsPageTypes';
import { ITEMS_PER_PAGE } from '../LeadsPageConstants';

interface UseArchiveLeadsPaginationParams {
  activeDatasetTab: LeadsDatasetTab;
  filteredLeads: ArchiveLeadRow[];
  searchTerm: string;
  selectedBranch: string;
  selectedYear: string;
}

export const useArchiveLeadsPagination = ({
  activeDatasetTab,
  filteredLeads,
  searchTerm,
  selectedBranch,
  selectedYear,
}: UseArchiveLeadsPaginationParams) => {
  const [archiveCurrentPage, setArchiveCurrentPage] = useState(1);

  const archivedTotalCount = filteredLeads.length;
  const archivedTotalPages = Math.max(1, Math.ceil(archivedTotalCount / ITEMS_PER_PAGE));

  const paginatedArchivedLeads = useMemo(() => {
    const startIndex = (archiveCurrentPage - 1) * ITEMS_PER_PAGE;
    return filteredLeads.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [archiveCurrentPage, filteredLeads]);

  const archivedPageCount = paginatedArchivedLeads.length;

  useEffect(() => {
    setArchiveCurrentPage(1);
  }, [activeDatasetTab, searchTerm, selectedBranch, selectedYear]);

  useEffect(() => {
    setArchiveCurrentPage((prevPage) => Math.min(prevPage, archivedTotalPages));
  }, [archivedTotalPages]);

  return {
    archiveCurrentPage,
    setArchiveCurrentPage,
    archivedTotalCount,
    archivedTotalPages,
    paginatedArchivedLeads,
    archivedPageCount,
  };
};
