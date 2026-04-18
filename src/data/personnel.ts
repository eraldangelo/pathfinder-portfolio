// This file contains the real staff data and acts as a local Access Control List (ACL).
// The application uses this data to map a logged-in user's email to their specific role and branch.

import type { ActivityStatus } from '../types';

export interface Personnel {
    name: string; // This will be fullName
    firstName?: string;
    lastName?: string;
    email: string;
    photoURL: string;
    branch: string;
    role: string;
    preferredName?: string;
    dob?: string;
    passwordNeedsReset?: boolean;
    personalEmail?: string;
    personalMobileCountryCode?: string;
    personalMobileNumber?: string;
    businessMobileCountryCode?: string;
    businessMobileNumber?: string;
    leaveBalance?: number;
    leaveUsed?: number;
    leaveAccruedMonth?: string;
    offsetBalance?: number;
    offsetUsed?: number;
    offsetResetYear?: number;
    activityStatus?: ActivityStatus;
}

export type PersonnelWithDetails = Personnel & { uid: string; };

/*
  NOTE FOR FIREBASE ADAPTATION:
  The hardcoded 'personnelData' has been removed. The application now expects
  to fetch personnel information from a 'personnel' collection in Firestore.
*/
// NOTE: Deprecated hardcoded personnel data removed. See `archived/legacy-snippets.md` if needed.

export const branchesByCountry: { [key: string]: string[] } = {
    'Philippines': ['Manila', 'Cebu', 'Davao', 'Pampanga'],
    'Australia': ['Melbourne'],
};

export const allBranches = Object.values(branchesByCountry).flat();

// Helper functions that depended on a full personnel list are now removed as per the request to destroy the personnel page and its logic.
