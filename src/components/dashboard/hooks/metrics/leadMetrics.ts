import type { Lead } from '../../../leads/leads-page/LeadsPage';
import type { AssessmentSubmission } from '../../../../types';
import {
  extractOthersBreakdownLabels,
  STAFF_REFERRAL_SOURCE,
  normalizeLeadMetricSpace,
  normalizeSubmissionLeadSources,
  OTHER_BREAKDOWN_DETAILS_PREFIX,
  OTHERS_SOURCE,
  sortOtherLeadSourceBreakdown,
} from './leadMetricsDiscovery';

const normalizeBranchKey = (value?: string | null) => String(value ?? '').trim().toLowerCase();
const hasStaffReferrerIdentity = (submission: AssessmentSubmission) =>
  Boolean(
    normalizeLeadMetricSpace(submission.referredStaffName)
    || normalizeLeadMetricSpace(submission.referredStaffId)
  );

export type TopLeadSourceRow = {
  source: string;
  count: number;
  details?: string;
};

const buildCounsellorLeadCounts = (leads: Lead[], branch: string) => {
  const branchKey = normalizeBranchKey(branch);
  if (!branchKey) return [] as { counsellor: string; leads: number }[];

  const branchLeads = leads.filter((lead) => normalizeBranchKey(lead.branch) === branchKey);
  const counts = branchLeads.reduce((acc, lead) => {
    if (lead.assignedCounsellor) {
      acc[lead.assignedCounsellor] = (acc[lead.assignedCounsellor] || 0) + 1;
    }
    return acc;
  }, {} as { [key: string]: number });

  return Object.entries(counts)
    .map(([counsellor, leadsCount]) => ({ counsellor, leads: leadsCount }))
    .sort((a, b) => b.leads - a.leads);
};

export const buildAdminLeadsByCounsellorData = (
  leads: Lead[],
  branch: string | null | undefined,
  isAdminLike: boolean
) => {
  if (!isAdminLike || !branch) return [] as { counsellor: string; leads: number }[];
  return buildCounsellorLeadCounts(leads, branch);
};

export const buildLeadsByCounsellorData = (
  leads: Lead[],
  managerBranch: string,
  isManager: boolean
) => {
  if (!isManager) return [] as { counsellor: string; leads: number }[];
  return buildCounsellorLeadCounts(leads, managerBranch);
};

export const buildLeadsByBranchData = (
  assessmentSubmissions: AssessmentSubmission[],
  leads: Lead[] = []
) => {
  const counts = new Map<string, number>();
  const branchLabelByKey = new Map<string, string>();

  const addBranch = (value?: string | null) => {
    const branch = String(value ?? '').trim();
    if (!branch) return;
    const key = normalizeBranchKey(branch);
    if (!key) return;
    if (!branchLabelByKey.has(key)) {
      branchLabelByKey.set(key, branch);
    }
    counts.set(key, (counts.get(key) || 0) + 1);
  };

  assessmentSubmissions.forEach((submission) => {
    const explicitBranch = String(
      (submission as AssessmentSubmission & { branch?: string | null }).branch ?? ''
    ).trim();
    addBranch(explicitBranch || submission.referredStaffBranch || submission.preferredBranch);
  });
  leads.forEach((lead) => {
    addBranch(lead.branch);
  });

  return Array.from(counts.entries())
    .map(([branchKey, leads]) => ({
      branch: branchLabelByKey.get(branchKey) || branchKey,
      leads,
    }))
    .sort((a, b) => a.branch.localeCompare(b.branch, undefined, { sensitivity: 'base' }));
};

export const buildTopLeadSourcesData = (assessmentSubmissions: AssessmentSubmission[]): TopLeadSourceRow[] => {
  const counts = new Map<string, number>();
  const otherBreakdownCounts = new Map<string, number>();

  assessmentSubmissions.forEach((submission) => {
    const normalizedSources = normalizeSubmissionLeadSources(submission);
    if (normalizedSources.size === 0) return;

    normalizedSources.forEach((source) => {
      if (source === STAFF_REFERRAL_SOURCE && !hasStaffReferrerIdentity(submission)) return;
      counts.set(source, (counts.get(source) || 0) + 1);
    });

    if (normalizedSources.has(OTHERS_SOURCE)) {
      extractOthersBreakdownLabels(submission).forEach((label) => {
        otherBreakdownCounts.set(label, (otherBreakdownCounts.get(label) || 0) + 1);
      });
    }
  });

  const rows: TopLeadSourceRow[] = Array.from(counts.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);

  const otherBreakdown = Array.from(otherBreakdownCounts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort(sortOtherLeadSourceBreakdown);

  if (otherBreakdown.length > 0) {
    const othersIndex = rows.findIndex((item) => item.source === OTHERS_SOURCE);
    if (othersIndex >= 0) {
      rows[othersIndex] = {
        ...rows[othersIndex],
        details: `${OTHER_BREAKDOWN_DETAILS_PREFIX}${JSON.stringify(otherBreakdown)}`,
      };
    }
  }

  const others = rows.find((item) => item.source === OTHERS_SOURCE);
  const withoutOthers = rows.filter((item) => item.source !== OTHERS_SOURCE);
  return others ? [...withoutOthers, others] : withoutOthers;
};

export const parseLeadSourceOthersBreakdownDetails = (details?: string) => {
  if (!details || !details.startsWith(OTHER_BREAKDOWN_DETAILS_PREFIX)) return null;
  const json = details.slice(OTHER_BREAKDOWN_DETAILS_PREFIX.length);

  try {
    const parsed = JSON.parse(json) as unknown;
    if (!Array.isArray(parsed)) return null;

    return parsed
      .map((item) => ({
        label: normalizeLeadMetricSpace((item as { label?: unknown })?.label),
        count: Number((item as { count?: unknown })?.count || 0),
      }))
      .filter((item) => item.label && Number.isFinite(item.count) && item.count > 0);
  } catch {
    return null;
  }
};
