import type { Lead } from '../../../leads/leads-page/LeadsPage';
import { toDate } from './archiveSharedUtils';
import type { ArchiveApplicationRow, ArchiveLeadRow } from './types';

const sortHistoryByLatest = (history: any[]) =>
  [...history].sort((a, b) => {
    const aMillis = toDate(a?.date)?.getTime() || 0;
    const bMillis = toDate(b?.date)?.getTime() || 0;
    return bMillis - aMillis;
  });

const statusFromHistory = (history: any[]) => {
  if (!Array.isArray(history)) return '';
  return String(sortHistoryByLatest(history)[0]?.status || '').trim();
};

const statusChangedFromHistory = (history: any[]) => {
  if (!Array.isArray(history)) return null;
  return toDate(sortHistoryByLatest(history)[0]?.date);
};

const splitFullName = (fullName: string) => {
  const parts = String(fullName || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return { firstName: '', middleName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], middleName: '', lastName: '' };
  if (parts.length === 2) return { firstName: parts[0], middleName: '', lastName: parts[1] };

  return {
    firstName: parts[0],
    middleName: parts.slice(1, -1).join(' '),
    lastName: parts[parts.length - 1],
  };
};

const normalizeLeadStatus = (value: unknown): Lead['leadStatus'] => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'consulted') return 'Consulted';
  if (normalized === 'for follow up' || normalized === 'for follow-up') return 'For Follow Up';
  if (normalized === 'no show') return 'No Show';
  return 'New Lead';
};

const normalizeVisaRefusal = (value: unknown): 'Yes' | 'No' => {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized === 'yes' ? 'Yes' : 'No';
};

const normalizeMaritalStatus = (value: unknown): Lead['maritalStatus'] => {
  const normalized = String(value || '').trim();
  if (
    normalized === 'Never Married' ||
    normalized === 'Engaged' ||
    normalized === 'De Facto' ||
    normalized === 'Married' ||
    normalized === 'Divorced' ||
    normalized === 'Separated' ||
    normalized === 'Widowed'
  ) {
    return normalized;
  }
  if (normalized.toLowerCase() === 'single') return 'Never Married';
  return 'Never Married';
};

const joinList = (value: unknown) =>
  Array.isArray(value)
    ? value
        .map((item) => String(item || '').trim())
        .filter(Boolean)
        .join(', ')
    : String(value || '').trim();

const resolveLeadIdFromPath = (path: string) => {
  const segments = String(path || '').split('/').filter(Boolean);
  const leadsIndex = segments.lastIndexOf('leads');
  if (leadsIndex >= 0 && segments.length > leadsIndex + 1) {
    return String(segments[leadsIndex + 1] || '').trim();
  }
  return '';
};

const resolveArchiveYearFromPath = (path: string): number | null => {
  const segments = String(path || '').split('/').filter(Boolean);
  if (segments.length >= 4 && segments[0] === 'archives' && segments[2] === 'leads') {
    const parsed = Number(String(segments[1] || '').trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

export const mapArchiveLeadDoc = (doc: any): ArchiveLeadRow => {
  const data = doc.data?.() || {};
  const leadDocPath = String(doc?.ref?.path || '').trim() || `leads/${doc.id}`;
  const archivedYearFromField = Number.isFinite(Number(data.archivedYear)) ? Number(data.archivedYear) : null;
  const archivedYear = archivedYearFromField ?? resolveArchiveYearFromPath(leadDocPath);
  const fullName = String(data.fullName || data.name || data.emailAddress || 'Unknown').trim() || 'Unknown';
  const branch = String(data.branch || data.referredStaffBranch || '').trim();
  const email = String(data.email || data.emailAddress || '')
    .trim()
    .toLowerCase();
  const phoneCountryCode = String(data.phoneCountryCode || '').trim();
  const phoneNumber = String(data.phoneNumber || data.mobileNumber || '').trim();
  const submittedAt = toDate(data.submittedAt) || toDate(data.createdAt);
  const nameParts = splitFullName(fullName);
  const archivedLeadStatus = String(data.leadStatus || '').trim();
  const sourceType: ArchiveLeadRow['sourceType'] = Object.prototype.hasOwnProperty.call(data, 'emailAddress')
    ? 'Assessment Form'
    : 'Lead';

  const modalLead: Lead = {
    id: doc.id,
    leadDocPath,
    fullName,
    firstName: String(data.firstName || '').trim() || nameParts.firstName || fullName,
    middleName: String(data.middleName || '').trim() || nameParts.middleName || '',
    lastName: String(data.lastName || '').trim() || nameParts.lastName || '',
    currentLocation: String(data.currentLocation || '').trim(),
    isUsPassportHolder: Boolean(data.isUsPassportHolder),
    hasWorked: Boolean(data.hasWorked),
    englishTest: String(data.englishTest || '').trim(),
    studyDestinations: joinList(data.studyDestinations),
    preferredCoursesOfStudy: joinList(data.preferredCoursesOfStudy),
    plannedStudyStart: String(data.plannedStudyStart || '').trim(),
    email,
    phoneCountryCode,
    phoneNumber,
    citizenship: String(data.citizenship || 'Philippines').trim(),
    visaRefusal: normalizeVisaRefusal(data.visaRefusal),
    branch,
    assignedCounsellor: String(data.assignedCounsellor || '').trim(),
    assignedCounsellorUid: String(data.assignedCounsellorUid || '').trim(),
    resumeStoragePath: String(data.resumeStoragePath || '').trim(),
    caseId: String(data.caseId || '').trim(),
    submittedAt,
    dob: String(data.dob || data.dateOfBirth || '').trim(),
    maritalStatus: normalizeMaritalStatus(data.maritalStatus),
    leadStatus: normalizeLeadStatus(data.leadStatus),
    adminStatus: data.adminStatus,
    consultationStatus: data.consultationStatus,
    consultationNotes: data.consultationNotes,
    adminNotes: data.adminNotes,
  };

  return {
    id: doc.id,
    caseId: modalLead.caseId || '--',
    fullName: modalLead.fullName,
    branch: modalLead.branch || '--',
    email: modalLead.email || '--',
    phoneCountryCode: modalLead.phoneCountryCode || '',
    phoneNumber: modalLead.phoneNumber || '',
    visaRefusal: modalLead.visaRefusal || 'No',
    leadStatus: archivedLeadStatus || modalLead.leadStatus || 'New Lead',
    submittedAt: modalLead.submittedAt || null,
    assignedCounsellor: modalLead.assignedCounsellor || '--',
    sourceType,
    archivedYear,
    archivedAt: toDate(data.archivedAt),
    modalLead,
  };
};

export const mapArchiveApplicationDoc = (doc: any): ArchiveApplicationRow => {
  const data = doc.data?.() || {};
  const docPath = String(doc?.ref?.path || '').trim();
  const archivedYearFromField = Number.isFinite(Number(data.archivedYear)) ? Number(data.archivedYear) : null;
  const archivedYear = archivedYearFromField ?? resolveArchiveYearFromPath(docPath);
  const leadId = resolveLeadIdFromPath(String(doc.ref?.path || ''));
  const latestStatus = String(data.status || statusFromHistory(data.history) || '--').trim();
  const latestStatusDate = toDate(data.statusChanged) || statusChangedFromHistory(data.history);
  const schoolName = Array.isArray(data.schoolCourses)
    ? data.schoolCourses
        .map((item: any) => String(item?.schoolName || '').trim())
        .filter(Boolean)
        .join(' / ')
    : '--';

  return {
    id: doc.id,
    leadId,
    applicantName: String(data.applicantName || '--').trim(),
    branch: String(data.branch || '--').trim(),
    schoolName: schoolName || '--',
    status: latestStatus || '--',
    statusChanged: latestStatusDate,
    archivedYear,
    archivedAt: toDate(data.archivedAt),
  };
};
