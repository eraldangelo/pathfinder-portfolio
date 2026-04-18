import type { User } from '../../../types';
import type { TranslateFn } from '../../../types/translation';
import type {
    BranchChangeQueueRecord,
    BranchChangeRequestFormData,
    BranchChangeRequestRecord,
} from '../../../types/branchChangeRequest';
import { db, ensureFirebaseReady, serverTimestamp } from '../../../services/firebase';
import { dispatchNotifications } from '../../../services/notificationsApi';
import {
    getApproverRoleLabel,
    getApproverTargets,
    getBranchKey,
    makePossessive,
} from './appLeadHandlers/utils/approvalRouting';
import { loadRequestApprovers } from './requestApprovers';
import { runBranchChangeApproverNotificationFlow } from './branchChangeRequest.notificationFlow';
import {
    getBranchChangeValidationError,
    normalizeBranchChangeRequest,
    shouldUseDavaoApproverRouting,
} from './branchChangeRequest.helpers';

interface SubmitBranchChangeRequestDeps {
    user: User | null;
    userRole: string | null;
    t: TranslateFn;
    showPopup: (message: string, meta?: { eventKey?: string; persist?: boolean }) => void;
}

interface BranchChangeRequestRuntimeDeps {
    ensureReady: () => Promise<boolean>;
    getDb: () => any;
    now: () => unknown;
    sendNotifications: typeof dispatchNotifications;
    resolveApprovers: typeof loadRequestApprovers;
}

const BRANCH_CHANGE_EVENT_KEY = 'branchChangeRequest';
const BRANCH_CHANGE_QUEUE_COLLECTION = 'branchChangeRequestQueue';

const getValidationMessage = (
    t: TranslateFn,
    error: ReturnType<typeof getBranchChangeValidationError>
) => {
    if (error === 'missingBranch') {
        return t(
            'branchChangeSelectBranchRequired',
            'Please select the branch you are requesting.'
        );
    }
    if (error === 'sameBranch') {
        return t(
            'branchChangeMustDifferFromCurrent',
            'Please select a branch that is different from your current branch.'
        );
    }
    return t(
        'branchAndReasonRequired',
        'Please select a new branch and provide a reason (min 20 characters).'
    );
};

const nowValue = () => (serverTimestamp ? serverTimestamp() : new Date());

const defaultRuntimeDeps: BranchChangeRequestRuntimeDeps = {
    ensureReady: ensureFirebaseReady,
    getDb: () => db,
    now: nowValue,
    sendNotifications: dispatchNotifications,
    resolveApprovers: loadRequestApprovers,
};

export const createSubmitBranchChangeRequest = (
    runtimeDeps: BranchChangeRequestRuntimeDeps = defaultRuntimeDeps
) => {
    return async (
        { user, userRole, t, showPopup }: SubmitBranchChangeRequestDeps,
        requestData: BranchChangeRequestFormData
    ) => {
        if (!user?.uid) {
            showPopup(
                t(
                    'branchChangeNoUser',
                    'Unable to submit branch change request without an authenticated user.'
                )
            );
            return;
        }

        const normalized = normalizeBranchChangeRequest(requestData);
        const validationError = getBranchChangeValidationError(normalized, user.branch);
        if (validationError) {
            showPopup(getValidationMessage(t, validationError));
            return;
        }

        const ready = await runtimeDeps.ensureReady();
        const firestore = runtimeDeps.getDb();
        if (!ready || !firestore) {
            showPopup(
                t(
                    'branchChangeUnavailable',
                    'Branch change requests are temporarily unavailable. Please try again.'
                )
            );
            return;
        }

        const requesterName = user.displayName || user.email || 'Staff';
        const currentBranch = user.branch || null;
        const requiresDavaoApprover = shouldUseDavaoApproverRouting(userRole, currentBranch);
        const { branchKey: sourceBranchKey, targetBranchKey, targetRoles } = getApproverTargets(
            currentBranch || '',
            requiresDavaoApprover
        );

        const requestRef = firestore
            .collection('personnel')
            .doc(user.uid)
            .collection('branchChangeRequests')
            .doc();
        const queueRef = firestore.collection(BRANCH_CHANGE_QUEUE_COLLECTION).doc(requestRef.id);

        const requestRecord: BranchChangeRequestRecord = {
            status: 'pending',
            reason: normalized.reason,
            requesterId: user.uid,
            requesterName,
            requesterRole: userRole ?? null,
            currentBranch,
            requestedBranch: normalized.newBranch,
            requestedCountry: normalized.newCountry,
            createdAt: runtimeDeps.now(),
            updatedAt: runtimeDeps.now(),
        };

        const queueRecord: BranchChangeQueueRecord = {
            ...requestRecord,
            requestId: requestRef.id,
            sourceBranchKey,
            targetBranchKey,
            targetRoles,
            notificationStatus: 'pending',
            notificationAttemptedAt: null,
            notificationSentAt: null,
            notificationError: null,
            approverSummary: null,
        };

        try {
            const batch = firestore.batch();
            batch.set(requestRef, requestRecord);
            batch.set(queueRef, queueRecord);
            await batch.commit();

            const { approverName, approverRoleLabel } =
                await runBranchChangeApproverNotificationFlow({
                    deps: runtimeDeps,
                    firestore,
                    queueRef,
                    requestId: requestRef.id,
                    requesterId: user.uid,
                    requesterName,
                    requesterRole: userRole ?? null,
                    currentBranch,
                    targetBranchKey,
                    targetRoles,
                    newBranch: normalized.newBranch,
                    newCountry: normalized.newCountry,
                    reason: normalized.reason,
                });

            const fallbackApproverLabel =
                approverName
                || approverRoleLabel
                || getApproverRoleLabel(getBranchKey(currentBranch || ''))
                || 'Manager';
            const submissionMessage = `Your branch change request to ${normalized.newBranch} has been submitted and is pending for ${makePossessive(fallbackApproverLabel)} review.`;

            await firestore.collection('personnel').doc(user.uid).collection('notifications').add({
                message: submissionMessage,
                createdAt: runtimeDeps.now(),
                read: false,
                eventKey: BRANCH_CHANGE_EVENT_KEY,
                requestId: requestRef.id,
                requestOwnerId: user.uid,
                requestStatus: 'pending',
                requestType: 'branch-change',
                requestReason: normalized.reason,
                requestCurrentBranch: currentBranch,
                requestNewBranch: normalized.newBranch,
                requestNewCountry: normalized.newCountry,
                requesterName,
                requesterBranch: currentBranch,
                requesterRole: userRole ?? null,
                approverName: fallbackApproverLabel,
            });

            showPopup(submissionMessage, { eventKey: BRANCH_CHANGE_EVENT_KEY, persist: false });
        } catch (error) {
            console.error('Failed to submit branch change request:', error);
            showPopup(
                t(
                    'branchChangeSubmissionFailed',
                    'Failed to submit branch change request. Please try again.'
                )
            );
        }
    };
};

export const submitBranchChangeRequest = createSubmitBranchChangeRequest();
