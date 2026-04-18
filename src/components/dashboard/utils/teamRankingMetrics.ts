import type { ApplicationInfo } from '../../../data/applications';
import type { PersonnelWithDetails } from '../../../data/personnel';
import type { AssessmentSubmission } from '../../../types';
import type { Lead } from '../../leads/leads-page/LeadsPage';
import { isMilestoneInWindow } from '../hooks/metrics/funnelMilestoneWindow';
import { ALL_MONTHS_VALUE, ALL_QUARTERS_VALUE, ALL_YEARS_VALUE } from './funnelFilters';
import { isExcludedTopStaffReferrerName } from './topStaffReferrersConfig';

const normalize = (value?: string | null) => String(value ?? '').trim().toLowerCase();
const normalizeDisplay = (value?: string | null) => String(value ?? '').trim();

export const buildTopVisaGrantCounsellors = (
  applications: ApplicationInfo[],
  leads: Lead[],
  assessmentSubmissions: AssessmentSubmission[],
  selectedMonth: string = ALL_MONTHS_VALUE,
  selectedYear: string = ALL_YEARS_VALUE,
  selectedQuarter: string = ALL_QUARTERS_VALUE,
) => {
  const leadById = new Map(leads.map((lead) => [lead.id, lead]));
  const submissionById = new Map(assessmentSubmissions.map((submission) => [submission.id, submission]));
  const grantsByCounsellor = new Map<string, { name: string; grants: number }>();

  applications.forEach((application) => {
    if (!isMilestoneInWindow(application, 'grant', selectedMonth, selectedYear, selectedQuarter)) return;

    const linkedLead = leadById.get(application.studentId);
    const linkedSubmission = submissionById.get(application.studentId);
    const appCounsellorName = normalizeDisplay(
      (application as unknown as { assignedCounsellor?: string }).assignedCounsellor
    );
    const leadCounsellorName = normalizeDisplay(linkedLead?.assignedCounsellor);
    const submissionCounsellorName = normalizeDisplay(linkedSubmission?.assignedCounsellor);
    const appCounsellorUid = normalizeDisplay(
      (application as unknown as { assignedCounsellorUid?: string | null }).assignedCounsellorUid
    );
    const leadCounsellorUid = normalizeDisplay(linkedLead?.assignedCounsellorUid);
    const submissionCounsellorUid = normalizeDisplay(linkedSubmission?.assignedCounsellorUid);

    const counsellorName =
      appCounsellorName ||
      leadCounsellorName ||
      submissionCounsellorName ||
      (appCounsellorUid || leadCounsellorUid || submissionCounsellorUid);
    if (!counsellorName) return;

    const key = normalize(counsellorName);
    const existing = grantsByCounsellor.get(key);
    if (existing) {
      existing.grants += 1;
    } else {
      grantsByCounsellor.set(key, { name: counsellorName, grants: 1 });
    }
  });

  return [...grantsByCounsellor.values()].sort((a, b) => {
    if (b.grants !== a.grants) return b.grants - a.grants;
    return a.name.localeCompare(b.name);
  });
};

export const buildTopStaffReferrers = (assessmentSubmissions: AssessmentSubmission[]) => {
  const byReferrer = new Map<string, { name: string; referrals: number }>();

  assessmentSubmissions.forEach((submission) => {
    const referredByStaff = Boolean(submission.referredByStaff);
    const referredStaffName = normalizeDisplay(submission.referredStaffName);
    const referredStaffId = normalizeDisplay(submission.referredStaffId);

    if (!referredByStaff && !referredStaffName && !referredStaffId) {
      return;
    }

    const displayName = referredStaffName || (referredStaffId ? `Staff ${referredStaffId.slice(0, 6)}` : '');
    if (!displayName) return;
    if (isExcludedTopStaffReferrerName(displayName)) return;

    const key = normalize(displayName);
    const existing = byReferrer.get(key);
    if (existing) {
      existing.referrals += 1;
    } else {
      byReferrer.set(key, { name: displayName, referrals: 1 });
    }
  });

  return [...byReferrer.values()].sort((a, b) => {
    if (b.referrals !== a.referrals) return b.referrals - a.referrals;
    return a.name.localeCompare(b.name);
  });
};

const isEducationCounsellorRole = (role?: string | null) => {
  const roleKey = normalize(role);
  return (
    roleKey === 'education consultant'
    || roleKey === 'education counsellor'
    || roleKey === 'education counselor'
  );
};

const isBranchManagerRole = (role?: string | null) => normalize(role) === 'branch manager';

const includeBranchManagersForBranch = (branch?: string | null) => {
  const branchKey = normalize(branch);
  return branchKey === 'pampanga' || branchKey === 'cebu';
};

const normalizeName = (value?: string | null) => normalizeDisplay(value).toLowerCase();

const isEligibleEndorsedRecipient = (
  person: PersonnelWithDetails,
  branch: string | null | undefined
) => {
  const branchKey = normalize(branch);
  if (branchKey && normalize(person.branch) !== branchKey) {
    return false;
  }

  if (isEducationCounsellorRole(person.role)) {
    return true;
  }

  return includeBranchManagersForBranch(branch) && isBranchManagerRole(person.role);
};

const isEndorsedToEligibleRecipient = (
  {
    assignedCounsellorUid,
    assignedCounsellor,
  }: {
    assignedCounsellorUid?: string | null;
    assignedCounsellor?: string | null;
  },
  eligibleRecipientUids: Set<string>,
  eligibleRecipientNames: Set<string>,
  hasEligibleRecipientDirectory: boolean
) => {
  const assignedUid = normalizeDisplay(assignedCounsellorUid);
  const assignedName = normalizeName(assignedCounsellor);
  if (!assignedUid && !assignedName) return false;

  if (assignedUid && eligibleRecipientUids.has(assignedUid)) {
    return true;
  }
  if (assignedName && eligibleRecipientNames.has(assignedName)) {
    return true;
  }

  // Fallback for legacy records without resolvable personnel linkage.
  if (!hasEligibleRecipientDirectory) {
    return true;
  }

  return false;
};

export const buildLeadsEndorsedByCounsellor = ({
  leads,
  assessmentSubmissions,
  allPersonnel,
  branch,
}: {
  leads: Lead[];
  assessmentSubmissions: AssessmentSubmission[];
  allPersonnel: PersonnelWithDetails[];
  branch: string | null | undefined;
}) => {
  const eligibleRecipientUids = new Map<string, string>();
  const eligibleRecipientNames = new Map<string, string>();

  allPersonnel.forEach((person) => {
    if (!isEligibleEndorsedRecipient(person, branch)) return;
    const uid = normalizeDisplay(person.uid);
    const displayName = normalizeDisplay(person.name);
    const nameKey = normalizeName(person.name);
    if (!displayName) return;
    if (uid) eligibleRecipientUids.set(uid, displayName);
    if (nameKey) eligibleRecipientNames.set(nameKey, displayName);
  });

  const eligibleRecipientUidSet = new Set(eligibleRecipientUids.keys());
  const eligibleRecipientNameSet = new Set(eligibleRecipientNames.keys());
  const hasEligibleRecipientDirectory = eligibleRecipientUids.size > 0 || eligibleRecipientNames.size > 0;
  const countedKeys = new Set<string>();
  const countsByRecipient = new Map<string, { name: string; leads: number }>();

  const consumeAssignment = (
    recordId: string | undefined,
    assignedCounsellorUid?: string | null,
    assignedCounsellor?: string | null
  ) => {
    const recordKey = normalizeDisplay(recordId);
    const assignmentKey = `${normalizeDisplay(assignedCounsellorUid)}::${normalizeName(assignedCounsellor)}`;
    const dedupeKey = recordKey || assignmentKey;
    if (!dedupeKey || countedKeys.has(dedupeKey)) return;

    const assignedUid = normalizeDisplay(assignedCounsellorUid);
    const assignedNameKey = normalizeName(assignedCounsellor);
    const assignedNameDisplay = normalizeDisplay(assignedCounsellor);
    const matchedByUid = assignedUid ? eligibleRecipientUids.get(assignedUid) : '';
    const matchedByName = assignedNameKey ? eligibleRecipientNames.get(assignedNameKey) : '';
    const resolvedName =
      matchedByUid
      || matchedByName
      || (hasEligibleRecipientDirectory
          ? ''
          : assignedNameDisplay || (assignedUid ? `Staff ${assignedUid.slice(0, 6)}` : ''));

    const isEligible = Boolean(
      resolvedName
      && isEndorsedToEligibleRecipient(
        { assignedCounsellorUid, assignedCounsellor },
        eligibleRecipientUidSet,
        eligibleRecipientNameSet,
        hasEligibleRecipientDirectory
      )
    );

    if (!isEligible) return;
    countedKeys.add(dedupeKey);

    const key = normalize(resolvedName);
    const existing = countsByRecipient.get(key);
    if (existing) {
      existing.leads += 1;
    } else {
      countsByRecipient.set(key, { name: resolvedName, leads: 1 });
    }
  };

  leads.forEach((lead) => {
    consumeAssignment(lead.id, lead.assignedCounsellorUid, lead.assignedCounsellor);
  });

  assessmentSubmissions.forEach((submission) => {
    consumeAssignment(submission.id, submission.assignedCounsellorUid, submission.assignedCounsellor);
  });

  return [...countsByRecipient.values()].sort((a, b) => {
    if (b.leads !== a.leads) return b.leads - a.leads;
    return a.name.localeCompare(b.name);
  });
};
