const buildLeadDocPayload = ({ rowEntry, admin, fileName, importedAt }) => {
  const { payload, rowNumber } = rowEntry;
  const timestamp = admin.firestore.Timestamp;

  const leadPayload = {
    fullName: payload.fullName,
    email: payload.email,
    emailAddress: payload.emailAddress,
    phoneCountryCode: payload.phoneCountryCode,
    phoneNumber: payload.phoneNumber,
    mobileNumber: payload.mobileNumber,
    currentLocation: payload.currentLocation,
    dob: payload.dob,
    dateOfBirth: payload.dateOfBirth,
    englishTest: payload.englishTest,
    highestEducationLevel: payload.highestEducationLevel,
    highestEducationalAttainment: payload.highestEducationalAttainment,
    hasWorked: payload.hasWorked,
    studyDestinations: payload.studyDestinations,
    preferredCountry: payload.preferredCountry,
    preferredCoursesOfStudy: payload.preferredCoursesOfStudy,
    otherPreferredCourseOfStudy: payload.otherPreferredCourseOfStudy,
    otherStudyDestination: '',
    plannedStudyStart: payload.plannedStudyStart,
    hasVisaRefusal: payload.hasVisaRefusal,
    visaRefusal: payload.visaRefusal,
    pathfinderDiscoverySources: payload.pathfinderDiscoverySources,
    otherPathfinderDiscoverySource: payload.otherPathfinderDiscoverySource ?? null,
    leadSource: payload.leadSource,
    preferredConsultationMethod: payload.preferredConsultationMethod,
    preferredConsultationDateTime: payload.preferredConsultationDateTime,
    isUsPassportHolder: payload.isUsPassportHolder,
    assignedCounsellor: payload.assignedCounsellor,
    branch: payload.branch,
    preferredBranch: payload.preferredBranch,
    referredStaffBranch: payload.referredStaffBranch,
    resumeStoragePath: payload.resumeStoragePath,
    citizenship: payload.citizenship,
    maritalStatus: payload.maritalStatus,
    caseId: payload.caseId,
    leadStatus: payload.leadStatus,
    source: payload.source,
    sourceMonth: payload.sourceMonth,
    submittedAt: timestamp.fromDate(payload.submittedAtDate),
    createdAt: timestamp.fromDate(payload.createdAtDate),
    migrationMeta: {
      source: 'xlsx',
      fileName,
      rowNumber,
      importedAt: timestamp.fromDate(importedAt),
    },
  };

  if (payload.assignedCounsellorUid) {
    leadPayload.assignedCounsellorUid = payload.assignedCounsellorUid;
  }
  if (payload.referredByStaff) {
    leadPayload.referredByStaff = true;
    if (payload.referredStaffId) leadPayload.referredStaffId = payload.referredStaffId;
    if (payload.referredStaffName) leadPayload.referredStaffName = payload.referredStaffName;
  }
  if (payload.referralCode) {
    leadPayload.referralCode = payload.referralCode;
  }
  if (payload.adminContacted) {
    leadPayload.adminContacted = true;
  }
  if (payload.adminContactedAtDate instanceof Date) {
    leadPayload.adminContactedAt = timestamp.fromDate(payload.adminContactedAtDate);
  }
  if (payload.consultedAtDate instanceof Date) {
    leadPayload.consultedAt = timestamp.fromDate(payload.consultedAtDate);
  }
  if (payload.stillUndecidedAtDate instanceof Date) {
    leadPayload.stillUndecidedAt = timestamp.fromDate(payload.stillUndecidedAtDate);
  }
  if (payload.submittedApplicationAtDate instanceof Date) {
    leadPayload.submittedApplicationAt = timestamp.fromDate(payload.submittedApplicationAtDate);
  }
  if (payload.adminStatus) {
    leadPayload.adminStatus = payload.adminStatus;
  }
  if (payload.consultationStatus) {
    leadPayload.consultationStatus = payload.consultationStatus;
  }

  return leadPayload;
};

const buildStatusDocs = ({ leadId, rowEntry, admin }) => {
  const { payload } = rowEntry;
  const docs = [];

  if (payload.adminStatus) {
    const when = payload.adminContactedAtDate || payload.submittedAtDate;
    docs.push({
      id: `${leadId}-admin-status`,
      data: {
        id: `${leadId}-admin-status`,
        status: payload.adminStatus,
        source: 'admin',
        author: payload.adminAuthor?.name || 'System User',
        authorUid: payload.adminAuthor?.uid || null,
        timestamp: admin.firestore.Timestamp.fromDate(when),
      },
    });
  }

  if (payload.consultationStatus) {
    const when = payload.consultedAtDate || payload.submittedAtDate;
    docs.push({
      id: `${leadId}-consultation-status`,
      data: {
        id: `${leadId}-consultation-status`,
        status: payload.consultationStatus,
        source: 'consultation',
        author: payload.consultationAuthor?.name || payload.assignedCounsellor || 'Counsellor',
        authorUid: payload.consultationAuthor?.uid || payload.assignedCounsellorUid || null,
        timestamp: admin.firestore.Timestamp.fromDate(when),
      },
    });
  }

  return docs;
};

const buildNoteDocs = ({ leadId, rowEntry, admin }) => {
  const { payload } = rowEntry;
  const docs = [];

  if (payload.adminRemarks) {
    const when = payload.adminContactedAtDate || payload.submittedAtDate;
    docs.push({
      id: `${leadId}-admin-note`,
      data: {
        id: `${leadId}-admin-note`,
        subject: payload.adminStatus ? `Admin: ${payload.adminStatus}` : 'Admin: Screening',
        content: payload.adminRemarks,
        author: payload.adminAuthor?.name || 'System User',
        authorUid: payload.adminAuthor?.uid || null,
        timestamp: admin.firestore.Timestamp.fromDate(when),
      },
    });
  }

  if (payload.counsellorNotes) {
    const when = payload.consultedAtDate || payload.submittedAtDate;
    docs.push({
      id: `${leadId}-counsellor-note`,
      data: {
        id: `${leadId}-counsellor-note`,
        subject: payload.consultationStatus
          ? `Consultation: ${payload.consultationStatus}`
          : 'Consultation: General',
        content: payload.counsellorNotes,
        author: payload.consultationAuthor?.name || payload.assignedCounsellor || 'Counsellor',
        authorUid: payload.consultationAuthor?.uid || payload.assignedCounsellorUid || null,
        timestamp: admin.firestore.Timestamp.fromDate(when),
      },
    });
  }

  return docs;
};

module.exports = {
  buildLeadDocPayload,
  buildStatusDocs,
  buildNoteDocs,
};
