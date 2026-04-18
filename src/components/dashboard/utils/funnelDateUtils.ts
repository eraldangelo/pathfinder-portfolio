import type { ApplicationInfo } from '../../../data/applications';
import type { AssessmentSubmission } from '../../../types';
import { statusIncludesKeyword } from './applicationStatusMatcher';

export const toDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (typeof (value as { toDate?: () => Date }).toDate === 'function') {
    const parsed = (value as { toDate: () => Date }).toDate();
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
};

const parseDdMmmYyyy = (value: unknown): Date | null => {
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
  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) return null;

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

const getOldestHistoryDate = (application: ApplicationInfo) => {
  if (!Array.isArray(application.history) || !application.history.length) return null;
  const historyDates = application.history
    .map((entry) => toDate(entry?.date))
    .filter((date): date is Date => Boolean(date))
    .sort((a, b) => a.getTime() - b.getTime());
  return historyDates[0] ?? null;
};

const getSubmittedDates = (application: ApplicationInfo) => {
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

  submittedDates.push(parseDdMmmYyyy((application as { applicationDate?: unknown }).applicationDate));
  return uniqueDates(submittedDates).sort((a, b) => a.getTime() - b.getTime());
};

export const getApplicationDate = (application: ApplicationInfo) => {
  const submittedDates = getSubmittedDates(application);
  if (submittedDates.length > 0) return submittedDates[0];
  return getOldestHistoryDate(application) ?? toDate(application.statusChanged) ?? null;
};

export const getSubmissionDate = (submission: AssessmentSubmission) => toDate(submission.createdAt);

export const collectApplicationTimelineYears = (application: ApplicationInfo) => {
  const yearSet = new Set<number>();
  const collectYear = (value: unknown) => {
    const date = toDate(value);
    if (!date) return;
    yearSet.add(date.getFullYear());
  };

  collectYear(application.statusChanged);
  collectYear((application as { applicationDate?: unknown }).applicationDate);

  if (Array.isArray(application.history)) {
    application.history.forEach((entry) => {
      collectYear(entry?.date);
    });
  }

  return yearSet;
};
