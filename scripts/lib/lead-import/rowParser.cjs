const { HEADERS, ADMIN_STATUS_OPTIONS, CONSULTATION_STATUS_OPTIONS, REFERRED_BY_FAMILY_SOURCE, BILLBOARD_SOURCE, VOCATIONAL_COURSE } = require('./constants.cjs');
const { normalizeSubmissionLeadSources } = require('../lead-sources/submissionNormalization.cjs');
const { normalizePreferredCourses } = require('../preferred-courses/normalization.cjs');
const { normalizeSpace, normalizeKey } = require('../lead-sources/textUtils.cjs');
const {
  toCellString,
  toDate,
  toIsoDate,
  normalizeBranch,
  monthStampFromDate,
  buildDuplicateKey,
  buildNameEmailKey,
  resolveHeaderColumn,
} = require('./utils.cjs');
const {
  resolveEndorsedCounsellor,
  resolvePersonalLeadReferrer,
  resolveAdminAuthorByBranch,
} = require('./personnelResolver.cjs');

const splitValues = (rawValue, protectedPhrases = []) => {
  const raw = toCellString(rawValue);
  if (!raw) return [];

  const replacements = new Map();
  let text = raw;
  protectedPhrases.forEach((phrase, index) => {
    const token = `__PROTECTED_${index}__`;
    replacements.set(token, phrase);
    text = text.replace(new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), token);
  });

  const seen = new Set();
  const output = [];
  text
    .split(/[;|,\n]/)
    .map((part) =>
      normalizeSpace(part).replace(/__PROTECTED_\d+__/g, (token) => replacements.get(token) || token)
    )
    .filter(Boolean)
    .forEach((part) => {
      const key = normalizeKey(part);
      if (!seen.has(key)) {
        seen.add(key);
        output.push(part);
      }
    });
  return output;
};

const toBoolean = (rawValue) => {
  const key = normalizeKey(rawValue);
  if (!key) return false;
  return key === 'yes' || key === 'true' || key === '1';
};

const parsePhone = (rawValue) => {
  const raw = toCellString(rawValue);
  if (!raw) return { phoneCountryCode: '', phoneNumber: '' };
  const tokens = raw.split(/\s+/).filter(Boolean);
  if (tokens.length > 1 && /^\+?\d{1,4}$/.test(tokens[0])) {
    const code = tokens[0].startsWith('+') ? tokens[0] : `+${tokens[0]}`;
    const number = tokens.slice(1).join('').replace(/[^\d]/g, '');
    return { phoneCountryCode: code, phoneNumber: number };
  }
  return { phoneCountryCode: '', phoneNumber: raw.replace(/[^\d]/g, '') };
};

const normalizeAdminStatus = (value) => {
  const trimmed = normalizeSpace(value);
  if (!trimmed) return '';
  return ADMIN_STATUS_OPTIONS.has(trimmed) ? trimmed : '';
};

const normalizeConsultationStatus = (value) => {
  const trimmed = normalizeSpace(value);
  if (!trimmed) return '';
  return CONSULTATION_STATUS_OPTIONS.has(trimmed) ? trimmed : '';
};

const resolveLeadStatus = ({ adminStatus, consultationStatus, submittedApplicationAt }) => {
  if (consultationStatus === 'Submitted Application' || submittedApplicationAt) return 'Submitted Application';
  if (consultationStatus === 'Consulted') return 'Consulted';
  if (consultationStatus === 'Still undecided' || consultationStatus === 'Pending Documents') {
    return 'For Follow Up';
  }
  if (adminStatus === 'No Response' || adminStatus === 'Undecided') return 'For Follow Up';
  if (adminStatus === 'No Show') return 'No Show';
  return 'New Lead';
};

const resolveMonth = (rawValue, timestamp) => {
  const raw = toCellString(rawValue);
  if (raw && /\d{4}/.test(raw) && !/yyyy/i.test(raw)) return raw;
  return monthStampFromDate(timestamp) || raw;
};

const parseLeadRow = ({ row, headerMap, directory }) => {
  const read = (headerOrHeaders) => {
    const column = resolveHeaderColumn(headerMap, headerOrHeaders);
    return column ? row.getCell(column).value : null;
  };

  const fullName = toCellString(read(HEADERS.fullName));
  const email = toCellString(read(HEADERS.email)).toLowerCase();
  const mobile = toCellString(read(HEADERS.mobile));
  if (!fullName && !email && !mobile) return null;

  const timestamp = toDate(read(HEADERS.timestamp)) || new Date();
  const branch = normalizeBranch(read(HEADERS.branch));
  const monthValue = resolveMonth(read(HEADERS.month), timestamp);

  const endorsed = resolveEndorsedCounsellor(toCellString(read(HEADERS.endorsedToCounsellor)), directory);
  const adminRemarks = toCellString(read(HEADERS.adminRemarks));
  const counsellorNotes = toCellString(read(HEADERS.counsellorNotes));

  const personalLeadReferrer = resolvePersonalLeadReferrer({
    leadName: fullName,
    adminRemarks,
    counsellorNotes,
    assignedCounsellorUid: endorsed.assignedCounsellorUid,
    assignedCounsellor: endorsed.assignedCounsellor,
    directory,
  });

  const sourceRaw = toCellString(read(HEADERS.discoverySource));
  const sourceParts = splitValues(sourceRaw, [REFERRED_BY_FAMILY_SOURCE, BILLBOARD_SOURCE]);
  const hasExplicitPathfinderStaffReferral = sourceParts.some(
    (value) => normalizeKey(value) === normalizeKey('I was referred by a Pathfinder Staff'),
  );
  let resolvedStaffReferrer = personalLeadReferrer;
  if (!resolvedStaffReferrer && hasExplicitPathfinderStaffReferral) {
    if (endorsed.assignedCounsellorUid) {
      resolvedStaffReferrer = directory.byUid.get(endorsed.assignedCounsellorUid) || null;
    }
    if (!resolvedStaffReferrer && endorsed.assignedCounsellor) {
      resolvedStaffReferrer = { uid: '', name: endorsed.assignedCounsellor };
    }
  }

  const referredByStaff = Boolean(resolvedStaffReferrer);
  const referredStaffId = resolvedStaffReferrer?.uid || '';
  const referredStaffName = resolvedStaffReferrer?.name || '';

  const { normalizedSources, normalizedOther } = normalizeSubmissionLeadSources(sourceParts, null, {
    referredStaffBranch: branch,
    referredStaffName,
  });

  const preferredCountryRaw = toCellString(read(HEADERS.preferredCountry));
  const studyDestinations = splitValues(preferredCountryRaw);

  const rawCourses = splitValues(read(HEADERS.preferredCourse), [VOCATIONAL_COURSE]);
  const courses = normalizePreferredCourses({
    preferredCoursesOfStudy: rawCourses,
    otherPreferredCourseOfStudy: '',
  });

  const adminStatus = normalizeAdminStatus(read(HEADERS.adminStatus));
  const consultationStatus = normalizeConsultationStatus(read(HEADERS.consultationStatus));
  const adminContacted = toBoolean(read(HEADERS.adminContact));

  const adminContactedAt = toDate(read(HEADERS.adminContactTimestamp));
  const consultedAt = toDate(read(HEADERS.consultedTimestamp));
  const stillUndecidedAt = toDate(read(HEADERS.stillUndecidedTimestamp));
  const submittedApplicationAt = toDate(read(HEADERS.submittedApplicationTimestamp));

  const phone = parsePhone(mobile);
  const adminAuthor = resolveAdminAuthorByBranch(branch, directory);
  const consultationAuthor = endorsed.assignedCounsellorUid
    ? directory.byUid.get(endorsed.assignedCounsellorUid)
    : null;

  const leadStatus = resolveLeadStatus({ adminStatus, consultationStatus, submittedApplicationAt });
  const referralCode = toCellString(read(HEADERS.referralCode));

  const payload = {
    fullName: fullName || 'Unknown',
    email,
    emailAddress: email,
    phoneCountryCode: phone.phoneCountryCode,
    phoneNumber: phone.phoneNumber,
    mobileNumber: mobile,
    currentLocation: toCellString(read(HEADERS.currentLocation)),
    dob: toIsoDate(read(HEADERS.dob)),
    dateOfBirth: toIsoDate(read(HEADERS.dob)),
    englishTest: toCellString(read(HEADERS.englishTest)),
    highestEducationLevel: toCellString(read(HEADERS.highestEducation)),
    highestEducationalAttainment: toCellString(read(HEADERS.highestEducation)),
    hasWorked: toBoolean(read(HEADERS.hasWorked)),
    studyDestinations,
    preferredCountry: preferredCountryRaw,
    preferredCoursesOfStudy: courses.normalizedCourses,
    otherPreferredCourseOfStudy: courses.normalizedOther || '',
    plannedStudyStart: toCellString(read(HEADERS.plannedStudyStart)),
    hasVisaRefusal: toBoolean(read(HEADERS.hasVisaRefusal)),
    visaRefusal: toBoolean(read(HEADERS.hasVisaRefusal)) ? 'Yes' : 'No',
    pathfinderDiscoverySources: normalizedSources,
    otherPathfinderDiscoverySource: normalizedOther,
    leadSource: sourceRaw,
    preferredConsultationMethod: toCellString(read(HEADERS.consultationMethod)),
    preferredConsultationDateTime: toCellString(read(HEADERS.consultationDateTime)),
    isUsPassportHolder: toBoolean(read(HEADERS.isUsPassportHolder)),
    assignedCounsellor: endorsed.assignedCounsellor,
    assignedCounsellorUid: endorsed.assignedCounsellorUid || undefined,
    branch,
    preferredBranch: branch,
    referredStaffBranch: branch,
    referredByStaff,
    referredStaffId: referredStaffId || undefined,
    referredStaffName: referredStaffName || undefined,
    referralCode: referralCode || undefined,
    remarks: adminRemarks,
    citizenship: 'Philippines',
    maritalStatus: 'Never Married',
    caseId: '',
    leadStatus,
    source: 'xlsx-migration',
    sourceMonth: monthValue,
    resumeStoragePath: toCellString(read(HEADERS.resumePath)),
    submittedAtDate: timestamp,
    createdAtDate: timestamp,
    adminContacted,
    adminContactedAtDate: adminContactedAt,
    adminStatus,
    consultationStatus,
    consultedAtDate: consultedAt,
    stillUndecidedAtDate: stillUndecidedAt,
    submittedApplicationAtDate: submittedApplicationAt,
    adminRemarks,
    counsellorNotes,
    adminAuthor,
    consultationAuthor,
  };

  return {
    rowNumber: row.number,
    duplicateKey: buildDuplicateKey(payload),
    duplicateNameEmailKey: buildNameEmailKey(payload),
    payload,
  };
};

module.exports = {
  parseLeadRow,
};
