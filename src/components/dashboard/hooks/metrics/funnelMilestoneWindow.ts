import type { ApplicationInfo } from '../../../../data/applications';
import { statusIncludesKeyword, hasStatusInCurrentOrHistory } from '../../utils/applicationStatusMatcher';
import { ALL_MONTHS_VALUE, ALL_QUARTERS_VALUE, ALL_YEARS_VALUE, matchesMonthYearFilter } from '../../utils/funnelFilters';

const toDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof (value as { toDate?: () => Date }).toDate === 'function') {
    const parsed = (value as { toDate: () => Date }).toDate();
    return parsed instanceof Date && !Number.isNaN(parsed.getTime()) ? parsed : null;
  }
  return null;
};

const parseApplicationDate = (value: unknown): Date | null => {
  const raw = String(value || '').trim();
  if (!raw) return null;

  const nativeParsed = new Date(raw);
  if (!Number.isNaN(nativeParsed.getTime())) return nativeParsed;

  const match = raw.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (!match) return null;

  const day = Number(match[1]);
  const monthToken = match[2].toLowerCase();
  const year = Number(match[3]);
  const monthIndexByToken: Record<string, number> = {
    jan: 0,
    feb: 1,
    mar: 2,
    apr: 3,
    may: 4,
    jun: 5,
    jul: 6,
    aug: 7,
    sep: 8,
    oct: 9,
    nov: 10,
    dec: 11,
  };
  const month = monthIndexByToken[monthToken];
  if (!Number.isFinite(day) || !Number.isFinite(year) || !Number.isFinite(month)) return null;

  const parsed = new Date(year, month, day);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const uniqueDates = (dates: Array<Date | null>) => {
  const seen = new Set<number>();
  const unique: Date[] = [];
  dates.forEach((date) => {
    if (!date) return;
    const millis = date.getTime();
    if (seen.has(millis)) return;
    seen.add(millis);
    unique.push(date);
  });
  return unique;
};

const getMilestoneDates = (application: ApplicationInfo, keyword: string) => {
  const dates: Array<Date | null> = [];
  if (statusIncludesKeyword(application.status, keyword)) {
    dates.push(toDate(application.statusChanged));
  }
  if (Array.isArray(application.history)) {
    application.history.forEach((entry) => {
      if (statusIncludesKeyword(entry?.status, keyword)) {
        dates.push(toDate(entry?.date));
      }
    });
  }
  return uniqueDates(dates);
};

export const isMilestoneInWindow = (
  application: ApplicationInfo,
  keyword: string,
  selectedMonth: string,
  selectedYear: string,
  selectedQuarter: string = ALL_QUARTERS_VALUE,
) => {
  if (
    selectedMonth === ALL_MONTHS_VALUE
    && selectedYear === ALL_YEARS_VALUE
    && selectedQuarter === ALL_QUARTERS_VALUE
  ) {
    return hasStatusInCurrentOrHistory(application, keyword);
  }

  const milestoneDates = getMilestoneDates(application, keyword);
  if (!milestoneDates.length) return false;
  return milestoneDates.some((date) => matchesMonthYearFilter(date, selectedMonth, selectedYear, selectedQuarter));
};

export const isApplicationSubmittedInWindow = (
  application: ApplicationInfo,
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

  const explicitApplicationDate = parseApplicationDate((application as { applicationDate?: unknown }).applicationDate);
  if (explicitApplicationDate) {
    return matchesMonthYearFilter(explicitApplicationDate, selectedMonth, selectedYear, selectedQuarter);
  }

  const submittedDates: Array<Date | null> = [];
  if (Array.isArray(application.history)) {
    application.history.forEach((entry) => {
      if (statusIncludesKeyword(entry?.status, 'submitted')) {
        submittedDates.push(toDate(entry?.date));
      }
    });
  }
  if (statusIncludesKeyword(application.status, 'submitted')) {
    submittedDates.push(toDate(application.statusChanged));
  }

  const explicitSubmissionDates = uniqueDates(submittedDates);
  const fallbackDates: Array<Date | null> = explicitSubmissionDates.length
    ? []
    : [
        Array.isArray(application.history) && application.history.length
      ? toDate(application.history[application.history.length - 1]?.date)
      : null,
        toDate(application.statusChanged),
      ];

  const submissionDates = uniqueDates([...explicitSubmissionDates, ...fallbackDates]);
  if (!submissionDates.length) return false;
  return submissionDates.some((date) => matchesMonthYearFilter(date, selectedMonth, selectedYear, selectedQuarter));
};
