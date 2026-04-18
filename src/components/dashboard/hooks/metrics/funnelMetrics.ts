import type { Lead } from '../../../leads/leads-page/LeadsPage';
import type { ApplicationInfo } from '../../../../data/applications';
import type { AssessmentSubmission } from '../../../../types';
import {
  ALL_LOCATION_KEYS,
} from '../../constants/constants';
import {
  ALL_MONTHS_VALUE,
  ALL_QUARTERS_VALUE,
  ALL_YEARS_VALUE,
  getSubmissionDate,
  matchesMonthYearFilter,
} from '../../utils/funnelFilters';
import { isApplicationSubmittedInWindow, isMilestoneInWindow } from './funnelMilestoneWindow';
import {
  formatCount,
  normalizeAssigneeKey,
  normalizeBranchValue,
  resolveCanonicalBranch,
  resolveCountryOverallByBranch,
  resolveSubmissionBranch,
} from './funnelMetricsLocationUtils';

export const buildAdminFunnelData = (
  leads: Lead[],
  applications: ApplicationInfo[],
  assessmentSubmissions: AssessmentSubmission[],
  genuineSubmissionIds: Set<string>,
  branch: string | null | undefined,
  isAdminLike: boolean
) => {
  const branchKey = normalizeBranchValue(resolveCanonicalBranch(branch));
  const currentYear = String(new Date().getFullYear());
  if (!isAdminLike || !branchKey) {
    return {
      totalLeads: '0',
      genuineStudents: '0',
      applications: '0',
      offers: '0',
      coe: '0',
      lodged: '0',
      granted: '0',
      refused: '0',
    };
  }
  const totalLeads = assessmentSubmissions.filter(
    (submission) => normalizeBranchValue(resolveCanonicalBranch(resolveSubmissionBranch(submission))) === branchKey
  ).length;
  const genuineStudents = assessmentSubmissions.filter(
    (submission) =>
      normalizeBranchValue(resolveCanonicalBranch(resolveSubmissionBranch(submission))) === branchKey
      && genuineSubmissionIds.has(submission.id)
  ).length;
  const branchLeadIds = new Set(
    leads
      .filter((lead) => normalizeBranchValue(resolveCanonicalBranch(lead.branch)) === branchKey)
      .map((lead) => lead.id)
  );
  const branchApps = applications.filter((app) => branchLeadIds.has(app.studentId));
  const branchSubmittedAppsThisYear = branchApps.filter((app) =>
    isApplicationSubmittedInWindow(app, ALL_MONTHS_VALUE, currentYear)
  );
  return {
    totalLeads: formatCount(totalLeads),
    genuineStudents: formatCount(genuineStudents),
    applications: formatCount(branchSubmittedAppsThisYear.length),
    offers: formatCount(branchApps.filter((app) => isMilestoneInWindow(app, 'unconditional offer', ALL_MONTHS_VALUE, currentYear)).length),
    coe: formatCount(branchApps.filter((app) => isMilestoneInWindow(app, 'coe', ALL_MONTHS_VALUE, currentYear)).length),
    lodged: formatCount(branchApps.filter((app) => isMilestoneInWindow(app, 'lodge', ALL_MONTHS_VALUE, currentYear)).length),
    granted: formatCount(branchApps.filter((app) => isMilestoneInWindow(app, 'grant', ALL_MONTHS_VALUE, currentYear)).length),
    refused: formatCount(branchApps.filter((app) => isMilestoneInWindow(app, 'refuse', ALL_MONTHS_VALUE, currentYear)).length),
  };
};

export const buildConsultantFunnelData = (
  leads: Lead[],
  applications: ApplicationInfo[],
  assessmentSubmissions: AssessmentSubmission[],
  genuineSubmissionIds: Set<string>,
  displayName: string | null,
  userId: string | null,
  isConsultantLike: boolean,
  selectedMonth: string = ALL_MONTHS_VALUE,
  selectedYear: string = String(new Date().getFullYear()),
  selectedQuarter: string = ALL_QUARTERS_VALUE,
) => {
  if (!isConsultantLike || !displayName) return null;
  const currentUid = String(userId ?? '').trim();
  const currentDisplayName = normalizeAssigneeKey(displayName);
  const consultantSubmissions = assessmentSubmissions.filter((submission) => {
    const assignedUid = String(submission.assignedCounsellorUid ?? '').trim();
    if (currentUid && assignedUid && assignedUid === currentUid) return true;
    const assignedName = normalizeAssigneeKey(submission.assignedCounsellor);
    if (currentDisplayName !== '' && assignedName === currentDisplayName) return true;
    return false;
  });
  const windowFilteredConsultantSubmissions = consultantSubmissions.filter((submission) =>
    matchesMonthYearFilter(getSubmissionDate(submission), selectedMonth, selectedYear, selectedQuarter)
  );
  const totalLeads = windowFilteredConsultantSubmissions.length;
  const genuineStudents = windowFilteredConsultantSubmissions.filter((submission) => genuineSubmissionIds.has(submission.id)).length;
  const consultantLeadIds = new Set(
    leads
      .filter((lead) => {
        const assignedUid = String(lead.assignedCounsellorUid ?? '').trim();
        if (currentUid && assignedUid && assignedUid === currentUid) return true;
        const assignedName = normalizeAssigneeKey(lead.assignedCounsellor);
        return currentDisplayName !== '' && assignedName === currentDisplayName;
      })
      .map((lead) => lead.id)
  );
  const consultantApps = applications.filter((app) => {
    if (consultantLeadIds.has(app.studentId)) return true;
    const assignedUid = String(
      (app as unknown as { assignedCounsellorUid?: string | null }).assignedCounsellorUid ?? ''
    ).trim();
    if (currentUid && assignedUid && assignedUid === currentUid) return true;
    const assignedName = normalizeAssigneeKey(
      (app as unknown as { assignedCounsellor?: string | null }).assignedCounsellor
    );
    return currentDisplayName !== '' && assignedName === currentDisplayName;
  });
  const consultantSubmittedAppsInWindow = consultantApps.filter((app) =>
    isApplicationSubmittedInWindow(app, selectedMonth, selectedYear, selectedQuarter)
  );
  return {
    totalLeads: formatCount(totalLeads),
    genuineStudents: formatCount(genuineStudents),
    applications: formatCount(consultantSubmittedAppsInWindow.length),
    offers: formatCount(consultantApps.filter((app) => isMilestoneInWindow(app, 'unconditional offer', selectedMonth, selectedYear, selectedQuarter)).length),
    coe: formatCount(consultantApps.filter((app) => isMilestoneInWindow(app, 'coe', selectedMonth, selectedYear, selectedQuarter)).length),
    lodged: formatCount(consultantApps.filter((app) => isMilestoneInWindow(app, 'lodge', selectedMonth, selectedYear, selectedQuarter)).length),
    granted: formatCount(consultantApps.filter((app) => isMilestoneInWindow(app, 'grant', selectedMonth, selectedYear, selectedQuarter)).length),
    refused: formatCount(consultantApps.filter((app) => isMilestoneInWindow(app, 'refuse', selectedMonth, selectedYear, selectedQuarter)).length),
  };
};

export const buildManagerFunnelData = (
  applications: ApplicationInfo[],
  assessmentSubmissions: AssessmentSubmission[],
  genuineSubmissionIds: Set<string>,
  selectedMonth: string = ALL_MONTHS_VALUE,
  selectedYear: string = ALL_YEARS_VALUE,
  selectedQuarter: string = ALL_QUARTERS_VALUE,
) => {
  const data: {
    [key: string]: {
      totalLeads: number;
      genuineStudents: number;
      applications: number;
      offers: number;
      coe: number;
      lodged: number;
      granted: number;
      refused: number;
    };
  } = {};
  ALL_LOCATION_KEYS.forEach((key) => {
    data[key] = {
      totalLeads: 0,
      genuineStudents: 0,
      applications: 0,
      offers: 0,
      coe: 0,
      lodged: 0,
      granted: 0,
      refused: 0,
    };
  });
  assessmentSubmissions.forEach((submission) => {
    if (!matchesMonthYearFilter(getSubmissionDate(submission), selectedMonth, selectedYear, selectedQuarter)) {
      return;
    }
    const submissionBranch = resolveCanonicalBranch(resolveSubmissionBranch(submission));
    const countryOverallKey = resolveCountryOverallByBranch(submissionBranch);
    const locationsToUpdate = ['Overall'];
    if (submissionBranch && data[submissionBranch]) {
      locationsToUpdate.push(submissionBranch);
    }
    if (countryOverallKey && data[countryOverallKey]) {
      locationsToUpdate.push(countryOverallKey);
    }
    const isGenuine = genuineSubmissionIds.has(submission.id);
    locationsToUpdate.forEach((location) => {
      data[location].totalLeads += 1;
      if (isGenuine) {
        data[location].genuineStudents += 1;
      }
    });
  });

  applications.forEach((app) => {
    const appBranch = resolveCanonicalBranch(app.branch);
    const countryOverallKey = resolveCountryOverallByBranch(appBranch);
    const locationsToUpdate = ['Overall'];
    if (appBranch && data[appBranch]) {
      locationsToUpdate.push(appBranch);
    }
    if (countryOverallKey && data[countryOverallKey]) {
      locationsToUpdate.push(countryOverallKey);
    }
    const isApplicationSubmitted = isApplicationSubmittedInWindow(app, selectedMonth, selectedYear, selectedQuarter);
    const isOffer = isMilestoneInWindow(app, 'unconditional offer', selectedMonth, selectedYear, selectedQuarter);
    const isCoe = isMilestoneInWindow(app, 'coe', selectedMonth, selectedYear, selectedQuarter);
    const isLodged = isMilestoneInWindow(app, 'lodge', selectedMonth, selectedYear, selectedQuarter);
    const isGranted = isMilestoneInWindow(app, 'grant', selectedMonth, selectedYear, selectedQuarter);
    const isRefused = isMilestoneInWindow(app, 'refuse', selectedMonth, selectedYear, selectedQuarter);
    locationsToUpdate.forEach((location) => {
      if (isApplicationSubmitted) data[location].applications += 1;
      if (isOffer) data[location].offers += 1;
      if (isCoe) data[location].coe += 1;
      if (isLodged) data[location].lodged += 1;
      if (isGranted) data[location].granted += 1;
      if (isRefused) data[location].refused += 1;
    });
  });
  const formattedData: {
    [key: string]: {
      totalLeads: string;
      genuineStudents: string;
      applications: string;
      offers: string;
      coe: string;
      lodged: string;
      granted: string;
      refused: string;
    };
  } = {};
  Object.keys(data).forEach((key) => {
    formattedData[key] = {
      totalLeads: data[key].totalLeads.toLocaleString(),
      genuineStudents: data[key].genuineStudents.toLocaleString(),
      applications: data[key].applications.toLocaleString(),
      offers: data[key].offers.toLocaleString(),
      coe: data[key].coe.toLocaleString(),
      lodged: data[key].lodged.toLocaleString(),
      granted: data[key].granted.toLocaleString(),
      refused: data[key].refused.toLocaleString(),
    };
  });

  return formattedData;
};

