import type { PersonnelWithDetails } from '../../../data/personnel';
import type { AssessmentSubmission } from '../../../types';
import { buildTopStaffReferrers } from '../utils/teamRankingMetrics';
import { isExcludedTopStaffReferrerName } from '../utils/topStaffReferrersConfig';

const PODIUM_MEDAL_ICON_URLS = [
  '/assets/ui/medal-gold.svg',
  '/assets/ui/medal-silver.svg',
  '/assets/ui/medal-bronze.svg',
] as const;

export const getPodiumMedalIconUrl = (index: number) => PODIUM_MEDAL_ICON_URLS[index] ?? '';

export const getPodiumMedalTitle = (index: number) => {
  if (index === 0) return 'Gold Medal';
  if (index === 1) return 'Silver Medal';
  if (index === 2) return 'Bronze Medal';
  return '';
};

const normalizeNameKey = (value?: string | null) =>
  String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();

export const buildMergedTopReferrers = ({
  assessmentSubmissions,
  rankings,
  allPersonnel,
}: {
  assessmentSubmissions?: AssessmentSubmission[];
  rankings?: Array<{ name: string; referrals: number }>;
  allPersonnel?: PersonnelWithDetails[];
}) => {
  const rankedReferrers = (Array.isArray(rankings) ? rankings : buildTopStaffReferrers(assessmentSubmissions ?? []))
    .filter((item) => !isExcludedTopStaffReferrerName(item.name));

  const referralCountByName = new Map<string, { name: string; referrals: number }>();
  rankedReferrers.forEach((item) => {
    const key = normalizeNameKey(item.name);
    if (!key) return;
    const existing = referralCountByName.get(key);
    if (existing) {
      existing.referrals += item.referrals;
    } else {
      referralCountByName.set(key, { name: item.name, referrals: item.referrals });
    }
  });

  const visibleStaffByName = new Map<string, string>();
  (allPersonnel ?? []).forEach((person) => {
    const displayName = String(person.name ?? '').trim();
    if (!displayName || isExcludedTopStaffReferrerName(displayName)) return;
    const key = normalizeNameKey(displayName);
    if (!key) return;
    if (!visibleStaffByName.has(key)) {
      visibleStaffByName.set(key, displayName);
    }
  });

  referralCountByName.forEach((value, key) => {
    if (!visibleStaffByName.has(key)) {
      visibleStaffByName.set(key, value.name);
    }
  });

  return Array.from(visibleStaffByName.entries())
    .map(([key, name]) => ({
      key,
      name,
      referrals: referralCountByName.get(key)?.referrals ?? 0,
    }))
    .sort((a, b) => {
      if (b.referrals !== a.referrals) return b.referrals - a.referrals;
      return a.name.localeCompare(b.name);
    });
};
