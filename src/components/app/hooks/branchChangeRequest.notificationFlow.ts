import type {
    ApprovalRoleKey,
    BranchChangeApproverSummary,
    BranchChangeQueueRecord,
    BranchKey,
} from '../../../types/branchChangeRequest';
import {
    getApproverRoleLabel,
    pickApproverName,
} from './appLeadHandlers/utils/approvalRouting';
import { buildBranchChangeRequestMessage } from './branchChangeRequest.helpers';

const BRANCH_CHANGE_EVENT_KEY = 'branchChangeRequest';
const MAX_NOTIFICATION_ERROR_LENGTH = 240;

const safeErrorMessage = (error: unknown) => {
    const raw =
        error instanceof Error
            ? error.message
            : typeof error === 'string'
              ? error
              : 'Unknown notification error';
    return raw.trim().slice(0, MAX_NOTIFICATION_ERROR_LENGTH) || 'Unknown notification error';
};

const buildApproverSummary = ({
    targetBranchKey,
    targetRoles,
    recipientIds,
}: {
    targetBranchKey: BranchChangeQueueRecord['targetBranchKey'];
    targetRoles: BranchChangeQueueRecord['targetRoles'];
    recipientIds: string[];
}): BranchChangeApproverSummary => ({
    targetBranchKey,
    targetRoles: [...targetRoles],
    matchedRecipientCount: recipientIds.length,
    matchedRecipientIds: recipientIds.slice(0, 50),
});

interface NotificationFlowDeps {
    now: () => unknown;
    sendNotifications: (payloads: Array<{
        recipientUid: string;
        message: string;
        data: Record<string, string | number | boolean | null>;
    }>) => Promise<unknown>;
    resolveApprovers: (params: {
        db: any;
        targetBranchKey: BranchChangeQueueRecord['targetBranchKey'];
        targetRoles: BranchChangeQueueRecord['targetRoles'];
        excludeUid: string;
    }) => Promise<Array<{
                id: string;
                name: string | null;
                role: string;
                roleKey: ApprovalRoleKey | '';
                branch: string | null;
                branchKey: BranchKey;
                canApproveBranchChange: boolean;
                isActive: boolean;
            }>>;
}

interface RunBranchChangeApproverNotificationFlowParams {
    deps: NotificationFlowDeps;
    firestore: any;
    queueRef: { set: (payload: Record<string, unknown>, options?: { merge: boolean }) => Promise<void> };
    requestId: string;
    requesterId: string;
    requesterName: string;
    requesterRole: string | null;
    currentBranch: string | null;
    targetBranchKey: BranchChangeQueueRecord['targetBranchKey'];
    targetRoles: BranchChangeQueueRecord['targetRoles'];
    newBranch: string;
    newCountry: string | null;
    reason: string;
}

export const runBranchChangeApproverNotificationFlow = async ({
    deps,
    firestore,
    queueRef,
    requestId,
    requesterId,
    requesterName,
    requesterRole,
    currentBranch,
    targetBranchKey,
    targetRoles,
    newBranch,
    newCountry,
    reason,
}: RunBranchChangeApproverNotificationFlowParams) => {
    if (!targetBranchKey || !targetRoles.length) {
        await queueRef.set(
            {
                notificationStatus: 'failed',
                notificationError: 'Unable to resolve approver routing for this request.',
                updatedAt: deps.now(),
            },
            { merge: true }
        );
        return { approverName: null as string | null, approverRoleLabel: null as string | null };
    }

    try {
        const recipients = await deps.resolveApprovers({
            db: firestore,
            targetBranchKey,
            targetRoles,
            excludeUid: requesterId,
        });
        const recipientIds = recipients.map((recipient) => recipient.id);
        const approverSummary = buildApproverSummary({
            targetBranchKey,
            targetRoles,
            recipientIds,
        });
        const approverName = pickApproverName(recipients);
        const approverRoleLabel = getApproverRoleLabel(targetBranchKey);

        await queueRef.set(
            {
                approverSummary,
                notificationAttemptedAt: deps.now(),
                updatedAt: deps.now(),
            },
            { merge: true }
        );

        if (!recipients.length) {
            await queueRef.set(
                {
                    notificationStatus: 'failed',
                    notificationError: 'No eligible approvers found for this routing.',
                    updatedAt: deps.now(),
                },
                { merge: true }
            );
            return { approverName, approverRoleLabel };
        }

        const requestMessage = buildBranchChangeRequestMessage({
            requesterName,
            currentBranch,
            newBranch,
        });
        await deps.sendNotifications(
            recipients.map((recipient) => ({
                recipientUid: recipient.id,
                message: requestMessage,
                data: {
                    eventKey: BRANCH_CHANGE_EVENT_KEY,
                    requestId,
                    requestOwnerId: requesterId,
                    requestStatus: 'pending',
                    requestType: 'branch-change',
                    requestReason: reason,
                    requestCurrentBranch: currentBranch,
                    requestNewBranch: newBranch,
                    requestNewCountry: newCountry,
                    requesterName,
                    requesterBranch: currentBranch,
                    requesterRole,
                },
            }))
        );

        await queueRef.set(
            {
                notificationStatus: 'sent',
                notificationSentAt: deps.now(),
                notificationError: null,
                updatedAt: deps.now(),
            },
            { merge: true }
        );

        return { approverName, approverRoleLabel };
    } catch (notificationError) {
        console.error('Failed to notify branch change approvers:', notificationError);
        await queueRef.set(
            {
                notificationStatus: 'failed',
                notificationAttemptedAt: deps.now(),
                notificationError: safeErrorMessage(notificationError),
                updatedAt: deps.now(),
            },
            { merge: true }
        );
        return { approverName: null as string | null, approverRoleLabel: null as string | null };
    }
};
