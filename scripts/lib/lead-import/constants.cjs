const VOCATIONAL_COURSE = 'Vocational - Certificates, Diploma, Advanced Diploma';
const REFERRED_BY_FAMILY_SOURCE = 'Referred by Family, Relatives, Partners or Friend';
const BILLBOARD_SOURCE = 'Billboards, Flyers, Brochures, Advertisment';

const ADMIN_STATUS_OPTIONS = new Set([
  'New Lead',
  'No Show',
  'No Response',
  'Undecided',
  'Genuine',
  'Non-Genuine',
  'Destination Not Offered',
  'Duplicate',
]);

const CONSULTATION_STATUS_OPTIONS = new Set([
  'Genuine Student',
  'Consulted',
  'Still undecided',
  'Pending Documents',
  'Submitted Application',
  'No Show',
  'Non-Genuine Student',
]);

const HEADERS = {
  month: 'Month',
  timestamp: 'Timestamp',
  fullName: ['Column 3', 'Full Name'],
  branch: 'Nearest Branch/Preferred Branch for Consultation',
  mobile: 'Mobile Number',
  email: 'Email Address',
  currentLocation: 'Current Location',
  dob: 'Date of Birth',
  englishTest: 'English Test (IELTS, PTE, TOEFL)',
  highestEducation: 'Highest Educational Attainment',
  hasWorked: 'Have you already worked?',
  preferredCountry: 'Preferred Country',
  preferredCourse: 'Preferred Course of Study',
  plannedStudyStart: 'When do you plan to start your study abroad?',
  hasVisaRefusal: 'Have you been refused to a visa application to any country',
  discoverySource: 'How did you know about Pathfinder?',
  consultationMethod: 'Preferred Consultation Method',
  consultationDateTime: 'Preferred Consultation Date and Time (Only For Pampanga and Cebu)',
  resumePath: 'Resume / Curriculum Vitae',
  isUsPassportHolder: 'Are you a US Passport holder?',
  referralCode: 'Referral Code',
  adminContact: 'Admin Contact',
  adminContactTimestamp: 'Contact Timestamp',
  adminStatus: 'Admin Status',
  endorsedToCounsellor: 'Endorsed to Counsellor',
  adminRemarks: 'Admin Remarks',
  consultationStatus: 'Consultation Status',
  consultedTimestamp: 'Consulted Timestamp',
  stillUndecidedTimestamp: 'Still Undecided Timestamp',
  pendingDocumentTimestamp: 'Pending Document Timestamp',
  submittedApplicationTimestamp: 'Submitted Application Timestamp',
  counsellorNotes: 'Counsellor Notes',
};

module.exports = {
  VOCATIONAL_COURSE,
  REFERRED_BY_FAMILY_SOURCE,
  BILLBOARD_SOURCE,
  ADMIN_STATUS_OPTIONS,
  CONSULTATION_STATUS_OPTIONS,
  HEADERS,
};
