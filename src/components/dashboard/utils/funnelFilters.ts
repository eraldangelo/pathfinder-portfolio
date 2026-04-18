import type { ApplicationInfo } from '../../../data/applications';
import type { AssessmentSubmission } from '../../../types';
import type { Lead } from '../../leads/leads-page/LeadsPage';
import { BRANCH_COUNTRY_MAPPING, COUNTRY_OVERALL_MAPPING } from '../constants/constants';
import { collectApplicationTimelineYears, getApplicationDate, getSubmissionDate } from './funnelDateUtils';
import {
  resolveSubmissionBranch as resolveSubmissionBranchValue,
  toCanonicalBranch,
} from '../../../utils/branchCanonicalization';

export { getApplicationDate, getSubmissionDate };

export const ALL_MONTHS_VALUE = 'all';
export const ALL_QUARTERS_VALUE = 'all';
export const ALL_YEARS_VALUE = 'all';
export const DEFAULT_FUNNEL_LOCATION = 'Philippines Overall';
export const Pathfinder_OVERALL = 'Overall';
export const QUARTER_1_VALUE = 'q1';
export const QUARTER_2_VALUE = 'q2';
export const QUARTER_3_VALUE = 'q3';
export const QUARTER_4_VALUE = 'q4';

const QUARTER_MONTHS: Record<string, number[]> = {
  [QUARTER_1_VALUE]: [0, 1, 2],
  [QUARTER_2_VALUE]: [3, 4, 5],
  [QUARTER_3_VALUE]: [6, 7, 8],
  [QUARTER_4_VALUE]: [9, 10, 11],
};

const normalizeKey = (value?: string | null) => String(value ?? '').trim().toLowerCase();

const normalizeBranchForFunnel = (branch?: string | null) => {
  return toCanonicalBranch(branch);
};

const resolveBranchCountry = (branch?: string | null) => {
  const branchKey = normalizeKey(normalizeBranchForFunnel(branch));
  const matchedBranch = Object.entries(BRANCH_COUNTRY_MAPPING).find(
    ([branchName]) => normalizeKey(branchName) === branchKey
  );
  return matchedBranch?.[1] ?? '';
};

const resolveSubmissionBranch = (submission: AssessmentSubmission) => {
  return resolveSubmissionBranchValue(submission);
};

const countryKeyByOverallKey = new Map(
  Object.entries(COUNTRY_OVERALL_MAPPING).map(([country, overall]) => [normalizeKey(overall), normalizeKey(country)])
);

export const locationMatchesBranch = (selectedLocation: string, branch?: string | null) => {
  const selectedKey = normalizeKey(normalizeBranchForFunnel(selectedLocation));
  if (!selectedKey || selectedKey === normalizeKey(Pathfinder_OVERALL)) return true;

  const branchKey = normalizeKey(normalizeBranchForFunnel(branch));
  if (!branchKey) return false;
  if (selectedKey === branchKey) return true;

  const countryKey = countryKeyByOverallKey.get(selectedKey);
  if (!countryKey) return false;

  const branchCountry = resolveBranchCountry(branch);
  return normalizeKey(branchCountry) === countryKey;
};

const matchesQuarterFilter = (monthIndex: number, selectedQuarter: string) => {
  if (selectedQuarter === ALL_QUARTERS_VALUE) return true;
  const quarterMonths = QUARTER_MONTHS[normalizeKey(selectedQuarter)];
  if (!quarterMonths) return true;
  return quarterMonths.includes(monthIndex);
};

export const matchesMonthYearFilter = (
  date: Date | null,
  selectedMonth: string,
  selectedYear: string,
  selectedQuarter: string = ALL_QUARTERS_VALUE,
) => {
  if (
    selectedMonth === ALL_MONTHS_VALUE
    && selectedYear === ALL_YEARS_VALUE
    && selectedQuarter === ALL_QUARTERS_VALUE
  ) {
    return true;
  }
  if (!date) return false;

  if (selectedYear !== ALL_YEARS_VALUE && date.getFullYear() !== Number(selectedYear)) {
    return false;
  }

  if (selectedMonth !== ALL_MONTHS_VALUE && date.getMonth() !== Number(selectedMonth)) {
    return false;
  }

  if (selectedMonth === ALL_MONTHS_VALUE && !matchesQuarterFilter(date.getMonth(), selectedQuarter)) {
    return false;
  }

  return true;
};

export const buildFunnelLocationOptions = (
  leads: Lead[],
  applications: ApplicationInfo[],
  assessmentSubmissions: AssessmentSubmission[]
) => {
  const baseLocations = [...Object.values(COUNTRY_OVERALL_MAPPING)];
  const branchSet = new Set<string>();

  leads.forEach((lead) => {
    const branch = normalizeBranchForFunnel(lead.branch);
    if (branch) branchSet.add(branch);
  });

  applications.forEach((application) => {
    const branch = normalizeBranchForFunnel(application.branch);
    if (branch) branchSet.add(branch);
  });

  assessmentSubmissions.forEach((submission) => {
    const branch = normalizeBranchForFunnel(resolveSubmissionBranch(submission));
    if (branch) branchSet.add(branch);
  });

  const sortedBranches = Array.from(branchSet).sort((a, b) => a.localeCompare(b));
  return Array.from(new Set([...baseLocations, ...sortedBranches]));
};

export const buildAvailableYears = (
  branchFilteredApplications: ApplicationInfo[],
  branchFilteredAssessmentSubmissions: AssessmentSubmission[]
) => {
  const yearSet = new Set<number>();

  branchFilteredApplications.forEach((application) => {
    collectApplicationTimelineYears(application).forEach((year) => yearSet.add(year));
  });

  branchFilteredAssessmentSubmissions.forEach((submission) => {
    const submissionDate = getSubmissionDate(submission);
    if (submissionDate) {
      yearSet.add(submissionDate.getFullYear());
    }
  });

  return Array.from(yearSet)
    .sort((a, b) => b - a)
    .map((year) => String(year));
};

export const filterDashboardByFunnelScope = ({
  selectedLocation,
  selectedMonth,
  selectedQuarter,
  selectedYear,
  leads,
  applications,
  assessmentSubmissions,
}: {
  selectedLocation: string;
  selectedMonth: string;
  selectedQuarter?: string;
  selectedYear: string;
  leads: Lead[];
  applications: ApplicationInfo[];
  assessmentSubmissions: AssessmentSubmission[];
}) => {
  const branchFilteredApplications = applications.filter((application) =>
    locationMatchesBranch(selectedLocation, application.branch)
  );

  const branchFilteredAssessmentSubmissions = assessmentSubmissions.filter((submission) =>
    locationMatchesBranch(selectedLocation, resolveSubmissionBranch(submission))
  );

  const branchFilteredLeads = leads.filter((lead) => locationMatchesBranch(selectedLocation, lead.branch));

  const filteredApplications = branchFilteredApplications.filter((application) =>
    matchesMonthYearFilter(getApplicationDate(application), selectedMonth, selectedYear, selectedQuarter)
  );

  const filteredAssessmentSubmissions = branchFilteredAssessmentSubmissions.filter((submission) =>
    matchesMonthYearFilter(getSubmissionDate(submission), selectedMonth, selectedYear, selectedQuarter)
  );

  return {
    branchFilteredApplications,
    branchFilteredAssessmentSubmissions,
    branchFilteredLeads,
    filteredApplications,
    filteredAssessmentSubmissions,
  };
};
