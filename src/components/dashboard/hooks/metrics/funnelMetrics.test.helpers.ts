import type { ApplicationInfo } from '../../../../data/applications';
import type { AssessmentSubmission } from '../../../../types';
import type { Lead } from '../../../leads/leads-page/LeadsPage';

export const toNumber = (value: string) => Number(String(value).replace(/,/g, ''));

export const app = (partial: Partial<ApplicationInfo>): ApplicationInfo => ({
  id: 'app-1',
  subId: 'sub-1',
  studentId: 'lead-1',
  citizenship: 'Philippines',
  branch: 'Manila',
  applicantName: 'Student',
  applicantDob: '01-Jan-2000',
  schoolCourses: [],
  status: 'Submitted Application',
  statusChanged: new Date() as any,
  history: [],
  visaRefusal: 'No',
  ...partial,
});

export const submission = (partial: Partial<AssessmentSubmission>): AssessmentSubmission => ({
  id: 'lead-1',
  createdAt: new Date() as any,
  preferredBranch: 'Manila',
  referredStaffBranch: 'Manila',
  assignedCounsellorUid: 'uid-1',
  assignedCounsellor: 'Counsellor One',
  fullName: 'Student',
  emailAddress: 'student@test.com',
  mobileNumber: '+639000000000',
  currentLocation: 'Manila',
  studyDestinations: ['Australia'],
  preferredCoursesOfStudy: ['Course'],
  pathfinderDiscoverySources: ['Pathfinder Website'],
  ...partial,
});

export const lead = (partial: Partial<Lead>): Lead => ({
  id: 'lead-1',
  fullName: 'Student',
  firstName: 'Student',
  lastName: 'One',
  email: 'student@test.com',
  phoneCountryCode: '+63',
  phoneNumber: '9000000000',
  citizenship: 'Philippines',
  visaRefusal: 'No',
  branch: 'Manila',
  assignedCounsellor: 'Counsellor One',
  caseId: 'PPG000000001',
  dob: '01-Jan-2000',
  maritalStatus: 'Never Married',
  leadStatus: 'New Lead',
  ...partial,
});
