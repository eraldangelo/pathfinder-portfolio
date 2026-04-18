import type { ApplicationInfo } from '../../../data/applications';
import { isApplicationSubmittedInWindow, isMilestoneInWindow } from '../hooks/metrics/funnelMilestoneWindow';
import { ALL_MONTHS_VALUE, ALL_QUARTERS_VALUE, ALL_YEARS_VALUE } from './funnelFilters';

export type TargetMetricKey = 'applications' | 'unconditionalOffers' | 'visaGranted';

export type TargetValues = Record<TargetMetricKey, number>;

export const OVERALL_TARGETS: TargetValues = {
  applications: 624,
  unconditionalOffers: 408,
  visaGranted: 312,
};

const MONTHS_IN_YEAR = 12;
const QUARTERS_IN_YEAR = 4;

const BRANCH_TARGETS_BY_KEY: Record<string, TargetValues> = {
  'philippines overall': OVERALL_TARGETS,
  makati: {
    applications: 180,
    unconditionalOffers: 120,
    visaGranted: 96,
  },
  manila: {
    applications: 180,
    unconditionalOffers: 120,
    visaGranted: 96,
  },
  pampanga: {
    applications: 144,
    unconditionalOffers: 96,
    visaGranted: 72,
  },
  cebu: {
    applications: 120,
    unconditionalOffers: 72,
    visaGranted: 48,
  },
  davao: {
    applications: 180,
    unconditionalOffers: 120,
    visaGranted: 96,
  },
};

const normalizeKey = (value?: string | null) => String(value ?? '').trim().toLowerCase();

export const resolveTargetValues = (selectedLocation: string): TargetValues => {
  const key = normalizeKey(selectedLocation);
  return BRANCH_TARGETS_BY_KEY[key] ?? OVERALL_TARGETS;
};

const toMonthlyTarget = (annualTarget: number) => Number((annualTarget / MONTHS_IN_YEAR).toFixed(2));
const toQuarterlyTarget = (annualTarget: number) => Number((annualTarget / QUARTERS_IN_YEAR).toFixed(2));

const resolveTargetsForSelectedPeriod = (
  annualTargets: TargetValues,
  selectedMonth: string,
  selectedQuarter: string,
): TargetValues => {
  if (selectedMonth !== ALL_MONTHS_VALUE) {
    return {
      applications: toMonthlyTarget(annualTargets.applications),
      unconditionalOffers: toMonthlyTarget(annualTargets.unconditionalOffers),
      visaGranted: toMonthlyTarget(annualTargets.visaGranted),
    };
  }

  if (selectedQuarter !== ALL_QUARTERS_VALUE) {
    return {
      applications: toQuarterlyTarget(annualTargets.applications),
      unconditionalOffers: toQuarterlyTarget(annualTargets.unconditionalOffers),
      visaGranted: toQuarterlyTarget(annualTargets.visaGranted),
    };
  }

  return annualTargets;
};

const TARGET_ROWS: { key: TargetMetricKey; label: string }[] = [
  { key: 'applications', label: 'Applications' },
  { key: 'unconditionalOffers', label: 'Unconditional Offers' },
  { key: 'visaGranted', label: 'Visa Granted' },
];

export const buildTargetVsActualRows = (
  applications: ApplicationInfo[],
  selectedLocation: string,
  selectedMonth: string = ALL_MONTHS_VALUE,
  selectedYear: string = ALL_YEARS_VALUE,
  selectedQuarter: string = ALL_QUARTERS_VALUE,
) => {
  const targets = resolveTargetsForSelectedPeriod(resolveTargetValues(selectedLocation), selectedMonth, selectedQuarter);
  const actuals: Record<TargetMetricKey, number> = {
    applications: applications.filter((application) =>
      isApplicationSubmittedInWindow(application, selectedMonth, selectedYear, selectedQuarter)
    ).length,
    unconditionalOffers: applications.filter((application) =>
      isMilestoneInWindow(application, 'unconditional offer', selectedMonth, selectedYear, selectedQuarter)
    ).length,
    visaGranted: applications.filter((application) =>
      isMilestoneInWindow(application, 'grant', selectedMonth, selectedYear, selectedQuarter)
    ).length,
  };

  const rows = TARGET_ROWS.map((metric) => {
    const actual = actuals[metric.key];
    const target = targets[metric.key];
    const achievement = target > 0 ? (actual / target) * 100 : 0;
    return {
      key: metric.key,
      label: metric.label,
      actual,
      target,
      achievement,
      clampedAchievement: Math.min(achievement, 100),
    };
  });

  const overallAchievement = rows.length
    ? rows.reduce((sum, row) => sum + row.achievement, 0) / rows.length
    : 0;

  return { rows, overallAchievement };
};
