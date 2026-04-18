import {
  BRANCH_COUNTRY_MAPPING,
  COUNTRY_OVERALL_MAPPING,
} from '../../constants/constants';
import {
  resolveSubmissionBranch as resolveSubmissionBranchValue,
  toCanonicalBranch,
} from '../../../../utils/branchCanonicalization';
import type { AssessmentSubmission } from '../../../../types';

const normalizeBranchKey = (value?: string | null) => String(value ?? '').trim().toLowerCase();

export const formatCount = (num: number) => num.toLocaleString();

export const normalizeAssigneeKey = (value?: string | null) => String(value ?? '').trim().toLowerCase();

export const resolveCanonicalBranch = (branch?: string | null) => {
  const canonical = toCanonicalBranch(branch);
  if (!canonical) return '';

  const mappingMatch = Object.keys(BRANCH_COUNTRY_MAPPING).find(
    (branchName) => normalizeBranchKey(branchName) === normalizeBranchKey(canonical),
  );
  return mappingMatch ?? canonical;
};

export const resolveCountryOverallByBranch = (branch?: string | null) => {
  const canonicalBranch = resolveCanonicalBranch(branch);
  if (!canonicalBranch) return undefined;

  const countryMatch = Object.entries(BRANCH_COUNTRY_MAPPING).find(
    ([branchName]) => normalizeBranchKey(branchName) === normalizeBranchKey(canonicalBranch),
  )?.[1];
  if (!countryMatch) return undefined;

  return Object.entries(COUNTRY_OVERALL_MAPPING).find(
    ([countryName]) => normalizeBranchKey(countryName) === normalizeBranchKey(countryMatch),
  )?.[1];
};

export const resolveSubmissionBranch = (submission: AssessmentSubmission) =>
  resolveSubmissionBranchValue(submission);

export const normalizeBranchValue = (value?: string | null) => normalizeBranchKey(value);

