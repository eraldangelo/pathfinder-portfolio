import type { TrendPoint } from '../types/types';
import {
  ALL_MONTHS_VALUE,
  ALL_QUARTERS_VALUE,
  ALL_YEARS_VALUE,
  matchesMonthYearFilter,
} from './funnelFilters';

const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const MONTH_NAME_TO_INDEX = new Map<string, number>();
MONTH_LABELS.forEach((month, index) => {
  MONTH_NAME_TO_INDEX.set(month.toLowerCase(), index);
  MONTH_NAME_TO_INDEX.set(month.slice(0, 3).toLowerCase(), index);
});

const normalize = (value?: string | null) => String(value ?? '').trim().toLowerCase();

export const resolveQuarterLabel = (quarter: string) => {
  const quarterKey = normalize(quarter);
  if (quarterKey === 'q1') return 'Quarter 1';
  if (quarterKey === 'q2') return 'Quarter 2';
  if (quarterKey === 'q3') return 'Quarter 3';
  if (quarterKey === 'q4') return 'Quarter 4';
  return quarter;
};

export const resolveFilterLabel = (month: string, quarter: string, year: string) => {
  const normalizedMonth = normalize(month);
  const normalizedQuarter = normalize(quarter);
  const monthIndex = Number(month);
  const monthLabel =
    normalizedMonth === ALL_MONTHS_VALUE.toLowerCase()
      ? 'All Months'
      : (MONTH_LABELS[monthIndex] ?? month);
  const quarterLabel =
    normalizedQuarter === ALL_QUARTERS_VALUE.toLowerCase()
      ? 'All Quarter'
      : resolveQuarterLabel(quarter);
  const yearLabel = normalize(year) === ALL_YEARS_VALUE.toLowerCase() ? 'All Years' : year;

  if (normalizedMonth === ALL_MONTHS_VALUE.toLowerCase() && normalizedQuarter !== ALL_QUARTERS_VALUE.toLowerCase()) {
    return `${quarterLabel} ${yearLabel}`.trim();
  }

  if (normalizedMonth !== ALL_MONTHS_VALUE.toLowerCase()) {
    return `${monthLabel} ${yearLabel}`.trim();
  }

  return `${monthLabel} / ${quarterLabel} / ${yearLabel}`;
};

const parseTrendMonthLabel = (value?: string | null): Date | null => {
  const input = String(value ?? '').trim();
  if (!input) return null;

  const parts = input.split(/\s+/);
  if (parts.length !== 2) return null;

  const monthIndex = MONTH_NAME_TO_INDEX.get(parts[0].toLowerCase());
  const year = Number(parts[1]);
  if (typeof monthIndex !== 'number' || !Number.isFinite(year)) return null;

  const parsed = new Date(year, monthIndex, 1);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const filterTrendPointsByPeriod = (
  trendPoints: TrendPoint[],
  selectedMonth: string = ALL_MONTHS_VALUE,
  selectedQuarter: string = ALL_QUARTERS_VALUE,
  selectedYear: string = ALL_YEARS_VALUE,
) =>
  trendPoints.filter((point) => {
    const pointDate = parseTrendMonthLabel(point.month);
    if (!pointDate) {
      return (
        normalize(selectedMonth) === ALL_MONTHS_VALUE.toLowerCase()
        && normalize(selectedQuarter) === ALL_QUARTERS_VALUE.toLowerCase()
        && normalize(selectedYear) === ALL_YEARS_VALUE.toLowerCase()
      );
    }
    return matchesMonthYearFilter(pointDate, selectedMonth, selectedYear, selectedQuarter);
  });
