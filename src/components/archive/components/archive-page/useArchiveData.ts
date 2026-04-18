import { useEffect, useMemo, useRef, useState } from 'react';
import {
  canViewArchiveRole,
  isAdministrativeStaffRole,
  isArchiveViewerRole,
  isBranchManagerRole,
  isCounsellorRole,
} from '../../../../utils/roles';
import { normalize } from './archivePageUtils';
import { matchesSearchTerm } from '../../../../utils/searchMatcher';
import type { ArchiveApplicationRow, ArchiveLeadRow, ArchiveTab } from './types';
import { useArchiveSubscriptions } from './useArchiveSubscriptions';

interface UseArchiveDataParams {
  userRole: string;
  userBranch: string;
  userUid?: string;
  userDisplayName?: string | null;
  enabled?: boolean;
}

export const useArchiveData = ({
  userRole,
  userBranch,
  userUid,
  userDisplayName,
  enabled = true,
}: UseArchiveDataParams) => {
  const archivedStatusDatesRef = useRef<{
    byPath: Map<string, Date>;
    byLeadId: Map<string, Date>;
  }>({
    byPath: new Map(),
    byLeadId: new Map(),
  });
  const [isLoading, setIsLoading] = useState<boolean>(enabled);
  const [activeTab, setActiveTab] = useState<ArchiveTab>('leads');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [archivedLeads, setArchivedLeads] = useState<ArchiveLeadRow[]>([]);
  const [archivedApplications, setArchivedApplications] = useState<ArchiveApplicationRow[]>([]);

  const canViewArchive = enabled && canViewArchiveRole(userRole);
  const canRunYearlyArchive = isArchiveViewerRole(userRole);
  const isBranchManager = isBranchManagerRole(userRole);
  const isAdministrativeStaff = isAdministrativeStaffRole(userRole);
  const isCounsellor = isCounsellorRole(userRole);
  const allowApplicationsTab = !isAdministrativeStaff && !isCounsellor;
  const isBranchSelectionLocked = isBranchManager || isAdministrativeStaff;
  const userBranchKey = normalize(userBranch);
  const userUidKey = normalize(userUid);
  const userDisplayNameKey = normalize(userDisplayName);

  useEffect(() => {
    if (!allowApplicationsTab) {
      setActiveTab('leads');
    }
  }, [allowApplicationsTab]);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
  }, [enabled]);

  useArchiveSubscriptions({
    canViewArchive,
    allowApplicationsTab,
    archivedStatusDatesRef,
    setIsLoading,
    setArchivedLeads,
    setArchivedApplications,
  });

  const scopedLeads = useMemo(() => {
    let rows = archivedLeads;

    if (isBranchSelectionLocked) {
      if (!userBranchKey) return [];
      rows = rows.filter((lead) => normalize(lead.branch) === userBranchKey);
    }

    if (isCounsellor) {
      rows = rows.filter((lead) => {
        const assignedCounsellorUid = normalize(lead.modalLead?.assignedCounsellorUid);
        if (assignedCounsellorUid && userUidKey) {
          return assignedCounsellorUid === userUidKey;
        }

        const assignedCounsellorName = normalize(
          lead.modalLead?.assignedCounsellor || lead.assignedCounsellor
        );
        return Boolean(userDisplayNameKey && assignedCounsellorName && assignedCounsellorName === userDisplayNameKey);
      });
    }

    return rows;
  }, [
    archivedLeads,
    isBranchSelectionLocked,
    userBranchKey,
    isCounsellor,
    userUidKey,
    userDisplayNameKey,
  ]);

  const scopedApplications = useMemo(() => {
    if (!allowApplicationsTab) return [];
    if (!isBranchManager) return archivedApplications;
    if (!userBranchKey) return [];
    return archivedApplications.filter((application) => normalize(application.branch) === userBranchKey);
  }, [allowApplicationsTab, archivedApplications, isBranchManager, userBranchKey]);

  const branchOptions = useMemo(() => {
    if (isBranchSelectionLocked && userBranch) return [String(userBranch)];
    const values = Array.from(
      new Set(
        [...scopedLeads.map((lead) => lead.branch), ...scopedApplications.map((app) => app.branch)]
          .map((value) => String(value || '').trim())
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));
    return ['all', ...values];
  }, [isBranchSelectionLocked, scopedApplications, scopedLeads, userBranch]);

  useEffect(() => {
    if (isBranchSelectionLocked && userBranch) {
      setSelectedBranch(userBranch);
    }
  }, [isBranchSelectionLocked, userBranch]);

  const yearOptions = useMemo(() => {
    const years = new Set<number>();
    scopedLeads.forEach((lead) => {
      if (lead.archivedYear) years.add(lead.archivedYear);
    });
    scopedApplications.forEach((application) => {
      if (application.archivedYear) years.add(application.archivedYear);
    });
    return ['all', ...Array.from(years).sort((a, b) => b - a).map((year) => String(year))];
  }, [scopedApplications, scopedLeads]);

  const filteredLeads = useMemo(
    () =>
      scopedLeads
        .filter((lead) => {
          if (selectedYear !== 'all' && String(lead.archivedYear || '') !== selectedYear) return false;
          if (selectedBranch !== 'all' && normalize(lead.branch) !== normalize(selectedBranch)) return false;
          return matchesSearchTerm({
            searchTerm,
            textCandidates: [
              lead.fullName,
              lead.caseId,
              lead.id,
              lead.email,
              lead.assignedCounsellor,
              lead.modalLead?.firstName,
              lead.modalLead?.middleName,
              lead.modalLead?.lastName,
            ],
            numericCandidates: [
              lead.phoneCountryCode,
              lead.phoneNumber,
              `${lead.phoneCountryCode}${lead.phoneNumber}`,
              `${lead.phoneCountryCode} ${lead.phoneNumber}`,
            ],
          });
        })
        .sort((a, b) => (b.archivedAt?.getTime() || 0) - (a.archivedAt?.getTime() || 0)),
    [scopedLeads, searchTerm, selectedBranch, selectedYear],
  );

  const filteredApplications = useMemo(
    () =>
      scopedApplications
        .filter((application) => {
          if (selectedYear !== 'all' && String(application.archivedYear || '') !== selectedYear) return false;
          if (selectedBranch !== 'all' && normalize(application.branch) !== normalize(selectedBranch)) return false;
          return matchesSearchTerm({
            searchTerm,
            textCandidates: [
              application.applicantName,
              application.schoolName,
              application.leadId,
              application.id,
              application.branch,
              application.status,
            ],
          });
        })
        .sort((a, b) => (b.archivedAt?.getTime() || 0) - (a.archivedAt?.getTime() || 0)),
    [scopedApplications, searchTerm, selectedBranch, selectedYear],
  );

  return {
    isLoading,
    canRunYearlyArchive,
    isBranchManager,
    allowApplicationsTab,
    isBranchSelectionLocked,
    activeTab,
    setActiveTab,
    searchTerm,
    setSearchTerm,
    selectedYear,
    setSelectedYear,
    selectedBranch,
    setSelectedBranch,
    scopedLeads,
    scopedApplications,
    filteredLeads,
    filteredApplications,
    yearOptions,
    branchOptions,
  };
};
