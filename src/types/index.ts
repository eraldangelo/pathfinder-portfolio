// types/index.ts
// This file centralizes shared type definitions to ensure consistency and maintainability across the application.

// Represents the application's user profile, derived from Firebase Auth and personnel data.
export type User = {
    uid: string;
    email: string | null;
    displayName: string | null; // Full name, e.g., "Alex Rivera"
    firstName: string | null;
    lastName: string | null;
    preferredName: string | null; // Nickname, e.g., "Alex"
    dob: string | null;
    photoURL: string | null;
    branch?: string;
    personalEmail?: string | null;
    personalMobileCountryCode?: string | null;
    personalMobileNumber?: string | null;
    businessMobileCountryCode?: string | null;
    businessMobileNumber?: string | null;
    leaveBalance?: number;
    leaveUsed?: number;
    leaveAccruedMonth?: string;
    offsetBalance?: number;
    offsetUsed?: number;
};

// Defines the overall look and feel of the application.
export type Theme = 'light' | 'dark';

// Defines the main pages or views the user can navigate to.
export type View = 'login' | 'dashboard' | 'logout' | 'profile' | 'notifications' | 'leads' | 'applications' | 'application-detail' | 'education-providers' | 'timesheet' | 'personnel' | 'archive';

// Represents the user's time tracking status for the day.
export type TimeTrackingStatus = 'timed-out' | 'timed-in' | 'on-lunch';

// Represents a user's activity status as stored on their personnel profile.
export type ActivityStatus = {
    status: TimeTrackingStatus | 'leave';
    time?: string | null;
    dateKey?: string | null;
};

// Represents a single time-stamped event in the user's daily log.
export type TimeLogEntry = {
    event: string;
    eventKey: string;
    time: string;
};

// Represents a Firebase authentication error object.
export interface AuthError {
  code: string;
  message: string;
}

// Represents a Firestore Timestamp object, ensuring compatibility.
export interface FirebaseTimestamp {
  toDate(): Date;
  toMillis(): number;
}

// Represents an assessment form submission stored in Firestore.
export type AssessmentSubmission = {
	    id: string;
	    fullName?: string | null;
	    emailAddress?: string | null;
	    mobileNumber?: string | null;
        referredByStaff?: boolean | null;
        referredStaffId?: string | null;
        referredStaffName?: string | null;
	    caseId?: string | null;
	    adminStatus?: string | null;
	    adminNotes?: string | null;
	    consultationStatus?: string | null;
	    consultationNotes?: string | null;
	    assignedCounsellor?: string | null;
	    assignedCounsellorUid?: string | null;
	    referredStaffBranch?: string | null;
        preferredBranch?: string | null;
	    hasVisaRefusal?: boolean | null;
	    currentLocation?: string | null;
	    isUsPassportHolder?: boolean | null;
	    hasWorked?: boolean | null;
	    highestEducationalAttainment?: string | null;
	    englishTest?: string | null;
	    studyDestinations?: string[] | null;
	    otherStudyDestination?: string | null;
	    preferredCoursesOfStudy?: string[] | null;
	    otherPreferredCourseOfStudy?: string | null;
	    plannedStudyStart?: string | null;
	    dateOfBirth?: string | null;
	    createdAt?: FirebaseTimestamp | Date | null;
	    resumeStoragePath?: string | null;
	    logs?: Array<{
	        id?: string | null;
	        timestamp?: FirebaseTimestamp | Date | null;
	        author?: string | null;
	        action?: string | null;
	    }> | null;
	    notes?: Array<{
	        id?: string | null;
	        subject?: string | null;
	        content?: string | null;
	        author?: string | null;
	        timestamp?: FirebaseTimestamp | Date | null;
	    }> | null;
        pathfinderDiscoverySources?: string[] | null;
        otherPathfinderDiscoverySource?: string | null;
	    source?: string | null;
	};


// --- Service Layer Types for Robust Error Handling ---

// Defines a standard structure for errors returned from services.
export type ServiceError = {
    type: 'FIRESTORE_WRITE_FAILED' | 'UNKNOWN';
    message: string;
};

// A generic wrapper for service function results, enabling typed error handling.
export type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: ServiceError };
