// FIX: Changed import for FirebaseTimestamp type from 'services/firebase' to 'types' to resolve module export error.
import { type FirebaseTimestamp } from '../types';

export const applicationStatuses = [
  'Submitted Application',
  'More Information Required',
  'Withdrawn',
  'Application Rejected',
  'Conditional Offer',
  'Unconditional Offer',
  'Payment Processed',
  'CoE/LoA Received',
  'Visa Lodged',
  'Visa Granted',
  'Visa Refused',
  'Visa Withdrawn',
  'Pre-Departure Orientation',
  'Refund Processing',
  'Application Ended',
] as const;

// Keep legacy "Submitted" for existing records while new submissions use "Submitted Application".
export type ApplicationStatus = typeof applicationStatuses[number] | 'Submitted';

export interface ApplicationStatusHistory {
  status: ApplicationStatus;
  date: FirebaseTimestamp; // Firestore Timestamp object
  notes?: string;
}

export interface CourseDetail {
    programName: string;
    intakeDate: string;
    courseEndDate?: string;
}

export interface SchoolCourses {
    schoolName: string;
    courses: CourseDetail[];
}

export interface ApplicationInfo {
  id: string;
  subId: string;
  studentId: string;
  leadDocPath?: string;
  caseId?: string;
  schoolStudentId?: string;
  citizenship: string; // Country name
  branch: string;
  applicantName: string;
  applicantDob: string; // "DD Mon YYYY"
  applicantPhotoUrl?: string;
  schoolCourses: SchoolCourses[];
  status: ApplicationStatus;
  statusChanged: FirebaseTimestamp; // Firestore Timestamp object
  history: ApplicationStatusHistory[];
  applicationDate?: string;
  assistedBy?: string;
  assignedCounsellor?: string;
  assignedCounsellorUid?: string;
  createdByUid?: string;
  createdBy?: string;
  visaRefusal: 'Yes' | 'No';
}
