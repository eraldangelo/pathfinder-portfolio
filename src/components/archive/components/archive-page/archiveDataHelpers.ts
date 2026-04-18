import { toDate } from './archivePageUtils';
import type { ArchiveLeadRow } from './types';

export const isYearlyArchiveLeadPath = (path: string) =>
  String(path || '').startsWith('archives/');

export const parseLeadPathFromStatusPath = (statusPath: string) => {
  const segments = String(statusPath || '').split('/').filter(Boolean);
  if (
    segments.length === 6
    && segments[0] === 'archives'
    && segments[2] === 'leads'
    && segments[4] === 'status'
  ) {
    return `archives/${segments[1]}/leads/${segments[3]}`;
  }
  return '';
};

export const leadIdFromLeadPath = (leadPath: string) => {
  const segments = String(leadPath || '').split('/').filter(Boolean);
  if (segments.length === 4 && segments[0] === 'archives' && segments[2] === 'leads') {
    return String(segments[3] || '').trim();
  }
  return '';
};

export const resolveArchivedDateFromStatusData = (data: Record<string, unknown>) => toDate(data.archivedAt);

export const setLatestDate = (map: Map<string, Date>, key: string, value: Date) => {
  if (!key || !value) return;
  const current = map.get(key);
  if (!current || value.getTime() > current.getTime()) {
    map.set(key, value);
  }
};

export const resolveArchivedDateForRow = (
  row: ArchiveLeadRow,
  byPath: Map<string, Date>,
  byLeadId: Map<string, Date>,
) => {
  const modalLeadPath = String(row.modalLead?.leadDocPath || '').trim();
  if (modalLeadPath && byPath.has(modalLeadPath)) {
    return byPath.get(modalLeadPath) || null;
  }
  const byLeadIdValue = byLeadId.get(String(row.id || '').trim());
  if (byLeadIdValue) return byLeadIdValue;
  return null;
};

const toMillis = (value: unknown) => {
  if (!value) return 0;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? 0 : value.getTime();
  if (typeof (value as { toDate?: () => Date }).toDate === 'function') {
    const parsed = (value as { toDate: () => Date }).toDate();
    return parsed instanceof Date && !Number.isNaN(parsed.getTime()) ? parsed.getTime() : 0;
  }
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
};

const leadCompletenessScore = (data: Record<string, unknown>) => {
  const fields = [
    'fullName',
    'name',
    'email',
    'emailAddress',
    'phoneNumber',
    'mobileNumber',
    'branch',
    'referredStaffBranch',
    'assignedCounsellor',
    'currentLocation',
    'dob',
    'dateOfBirth',
    'caseId',
  ];

  return fields.reduce((score, field) => {
    const hasValue = String(data?.[field] ?? '').trim() !== '';
    return score + (hasValue ? 1 : 0);
  }, 0);
};

export const choosePreferredLeadDoc = (currentDoc: any, incomingDoc: any) => {
  const currentPath = String(currentDoc?.ref?.path || '');
  const incomingPath = String(incomingDoc?.ref?.path || '');

  const currentIsYearly = isYearlyArchiveLeadPath(currentPath);
  const incomingIsYearly = isYearlyArchiveLeadPath(incomingPath);
  if (currentIsYearly !== incomingIsYearly) {
    return incomingIsYearly ? incomingDoc : currentDoc;
  }

  const currentData = (currentDoc?.data?.() || {}) as Record<string, unknown>;
  const incomingData = (incomingDoc?.data?.() || {}) as Record<string, unknown>;
  const currentScore = leadCompletenessScore(currentData);
  const incomingScore = leadCompletenessScore(incomingData);
  if (currentScore !== incomingScore) {
    return incomingScore > currentScore ? incomingDoc : currentDoc;
  }

  const currentArchivedMillis = toMillis(currentData.archivedAt || currentData.createdAt);
  const incomingArchivedMillis = toMillis(incomingData.archivedAt || incomingData.createdAt);
  if (currentArchivedMillis !== incomingArchivedMillis) {
    return incomingArchivedMillis > currentArchivedMillis ? incomingDoc : currentDoc;
  }

  return incomingPath.localeCompare(currentPath) > 0 ? incomingDoc : currentDoc;
};

const getDocCaseId = (doc: any) => String((doc?.data?.() || {})?.caseId || '').trim();

export const resolveMergedCaseId = (docs: any[]) => {
  if (!Array.isArray(docs) || docs.length === 0) return '';

  const yearlyCaseId = docs
    .filter((doc) => isYearlyArchiveLeadPath(String(doc?.ref?.path || '')))
    .map((doc) => getDocCaseId(doc))
    .find((value) => value !== '');
  if (yearlyCaseId) return yearlyCaseId;

  const rootCaseId = docs
    .filter((doc) => !isYearlyArchiveLeadPath(String(doc?.ref?.path || '')))
    .map((doc) => getDocCaseId(doc))
    .find((value) => value !== '');
  if (rootCaseId) return rootCaseId;

  return docs.map((doc) => getDocCaseId(doc)).find((value) => value !== '') || '';
};
