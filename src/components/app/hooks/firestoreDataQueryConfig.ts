import {
    isAdminLikeRole,
    isAdministrativeStaffRole,
    isBranchManagerRole,
    isConsultantLikeRole,
    isDeveloperRole,
    isMarketingRole,
    isOperationsLikeRole,
    isSatelliteOfficeRole,
} from '../../../utils/roles';
import type { User } from '../../../types';
import { buildBranchQueryCandidates, toCanonicalBranch } from '../../../utils/branchCanonicalization';

export interface FirestoreQueryConfig {
    leadsQuery: any;
    applicationsQuery: any;
    submissionsQuery: any;
    shouldSortLeadsByCaseId: boolean;
    shouldSortSubmissionsByCreatedAt: boolean;
    shouldFilterApplicationsByCounsellor: boolean;
    shouldReadApplications: boolean;
    applicationsBranchClientFilter: string | null;
}

interface BuildFirestoreQueryConfigParams {
    db: any;
    user: User;
    userRole: string;
}

export const buildFirestoreQueryConfig = ({
    db,
    user,
    userRole,
}: BuildFirestoreQueryConfigParams): FirestoreQueryConfig | null => {
    let leadsQuery: any = db.collection('leads');
    let applicationsQuery: any = db.collectionGroup('applications');
    let submissionsQuery: any = db.collection('leads');
    let shouldSortLeadsByCaseId = false;
    let shouldSortSubmissionsByCreatedAt = false;
    let shouldFilterApplicationsByCounsellor = false;
    let shouldReadApplications = true;
    const userBranch = String(user.branch ?? '').trim();
    const isSatelliteOffice = isSatelliteOfficeRole(userRole);
    const canReadBranchScopedApplications =
        isBranchManagerRole(userRole) || isAdministrativeStaffRole(userRole);
    let applicationsBranchClientFilter: string | null = null;

    const isAdminLike = isAdminLikeRole(userRole);
    if (isDeveloperRole(userRole) || isOperationsLikeRole(userRole) || isMarketingRole(userRole)) {
        leadsQuery = leadsQuery.orderBy('caseId', 'desc');
        shouldSortSubmissionsByCreatedAt = true;
    } else if (isBranchManagerRole(userRole) || isAdminLike) {
        shouldSortLeadsByCaseId = true;
        shouldSortSubmissionsByCreatedAt = true;
        if (userBranch) {
            const branchCandidates = buildBranchQueryCandidates(userBranch);
            const canonicalBranch = toCanonicalBranch(userBranch) || userBranch;
            leadsQuery = branchCandidates.length > 1
                ? leadsQuery.where('branch', 'in', branchCandidates)
                : leadsQuery.where('branch', '==', canonicalBranch);
            submissionsQuery = branchCandidates.length > 1
                ? submissionsQuery.where('referredStaffBranch', 'in', branchCandidates)
                : submissionsQuery.where('referredStaffBranch', '==', canonicalBranch);
            if (canReadBranchScopedApplications && !isSatelliteOffice) {
                applicationsBranchClientFilter = canonicalBranch;
            } else {
                shouldReadApplications = false;
            }
        } else {
            shouldReadApplications = false;
        }
    } else if (isConsultantLikeRole(userRole)) {
        leadsQuery = leadsQuery.where('assignedCounsellorUid', '==', user.uid);
        applicationsQuery = applicationsQuery.where('createdByUid', '==', user.uid);
        shouldSortLeadsByCaseId = true;
        shouldFilterApplicationsByCounsellor = true;
        if (userBranch) {
            const branchCandidates = buildBranchQueryCandidates(userBranch);
            const canonicalBranch = toCanonicalBranch(userBranch) || userBranch;
            submissionsQuery = branchCandidates.length > 1
                ? submissionsQuery.where('referredStaffBranch', 'in', branchCandidates)
                : submissionsQuery.where('referredStaffBranch', '==', canonicalBranch);
        } else {
            submissionsQuery = submissionsQuery.where('assignedCounsellorUid', '==', user.uid);
        }
        shouldSortSubmissionsByCreatedAt = true;
    } else {
        return null;
    }

    return {
        leadsQuery,
        applicationsQuery,
        submissionsQuery,
        shouldSortLeadsByCaseId,
        shouldSortSubmissionsByCreatedAt,
        shouldFilterApplicationsByCounsellor,
        shouldReadApplications,
        applicationsBranchClientFilter,
    };
};
