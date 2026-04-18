const { BILLBOARD_SOURCE, HEADERS, REFERRAL_SOURCE, VOCATIONAL_COURSE } = require('./constants.cjs');
const { parsePhone, splitValues, toBoolean, toCellString, toIsoDate } = require('./valueUtils.cjs');

const buildArchiveLeadPayload = ({ read, timestamp, admin }) => {
  const mobile = toCellString(read(HEADERS.mobile));
  const phone = parsePhone(mobile);
  const preferredCourses = splitValues(read(HEADERS.preferredCourse), [VOCATIONAL_COURSE]);
  const discoverySources = splitValues(read(HEADERS.discoverySource), [REFERRAL_SOURCE, BILLBOARD_SOURCE]);
  const email = toCellString(read(HEADERS.email)).toLowerCase();

  return {
    preferredCourses,
    discoverySources,
    payload: {
      fullName: toCellString(read(HEADERS.fullName)) || 'Unknown',
      email,
      emailAddress: email,
      phoneCountryCode: phone.phoneCountryCode,
      phoneNumber: phone.phoneNumber,
      mobileNumber: `${phone.phoneCountryCode}${phone.phoneNumber}`.trim(),
      currentLocation: toCellString(read(HEADERS.currentLocation)),
      dob: toIsoDate(read(HEADERS.dob)),
      dateOfBirth: toIsoDate(read(HEADERS.dob)),
      englishTest: toCellString(read(HEADERS.englishTest)),
      highestEducationLevel: toCellString(read(HEADERS.highestEducation)),
      highestEducationalAttainment: toCellString(read(HEADERS.highestEducation)),
      hasWorked: toBoolean(read(HEADERS.hasWorked)),
      studyDestinations: splitValues(read(HEADERS.preferredCountry)),
      preferredCoursesOfStudy: preferredCourses,
      plannedStudyStart: toIsoDate(read(HEADERS.plannedStart)),
      hasVisaRefusal: toBoolean(read(HEADERS.visaRefusal)),
      visaRefusal: toBoolean(read(HEADERS.visaRefusal)) ? 'Yes' : 'No',
      pathfinderDiscoverySources: discoverySources,
      preferredConsultationMethod: toCellString(read(HEADERS.consultationMethod)),
      isUsPassportHolder: toBoolean(read(HEADERS.usPassport)),
      assignedCounsellor: toCellString(read(HEADERS.assignedCounsellor)),
      branch: toCellString(read(HEADERS.branch)),
      referredStaffBranch: toCellString(read(HEADERS.branch)),
      remarks: toCellString(read(HEADERS.remarks)),
      citizenship: 'Philippines',
      maritalStatus: 'Never Married',
      caseId: '',
      leadStatus: 'Archived',
      isArchived: true,
      submittedAt: admin.firestore.Timestamp.fromDate(timestamp),
      createdAt: admin.firestore.Timestamp.fromDate(timestamp),
    },
  };
};

module.exports = {
  buildArchiveLeadPayload,
};
