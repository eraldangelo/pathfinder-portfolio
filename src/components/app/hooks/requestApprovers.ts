import type { ApprovalRoleKey, BranchKey } from '../../../types/branchChangeRequest';
import {
    filterApproverRecipients,
    getBranchQueryValues,
    mapApproverRecipientDocs,
    type ApproverRecipient,
    type ApproverRecipientDoc,
} from './appLeadHandlers/utils/approvalRouting';

// Migration safety toggle: while approval fields are still being backfilled,
// merge indexed and legacy branch-query candidates so partial rollout never
// hides valid approvers. Once backfill verification shows full coverage, this
// can be simplified to indexed-only lookup.
const MERGE_INDEX_AND_FALLBACK_DURING_APPROVAL_BACKFILL = true;

interface LoadRequestApproversParams {
    db: {
        collection: (name: string) => {
            where: (fieldPath: string, opStr: string, value: unknown) => {
                get: () => Promise<{ docs: Array<{ id: string; data: () => unknown }> }>;
            };
        };
    };
    targetBranchKey: BranchKey;
    targetRoles: ApprovalRoleKey[];
    excludeUid: string;
}

const toApproverDocs = (snapshot: { docs: Array<{ id: string; data: () => unknown }> }) =>
    snapshot.docs.map(
        (doc): ApproverRecipientDoc => ({
            id: doc.id,
            data: (doc.data() || {}) as Record<string, unknown>,
        })
    );

const dedupeApprovers = (recipients: ApproverRecipient[]) => {
    const uniqueById = new Map<string, ApproverRecipient>();
    recipients.forEach((recipient) => {
        if (!recipient.id || uniqueById.has(recipient.id)) return;
        uniqueById.set(recipient.id, recipient);
    });
    return [...uniqueById.values()];
};

const queryApprovalIndex = async ({
    db,
    targetBranchKey,
}: {
    db: LoadRequestApproversParams['db'];
    targetBranchKey: BranchKey;
}) => {
    const snapshot = await db
        .collection('personnel')
        .where('approvalBranchKey', '==', targetBranchKey)
        .get();
    return toApproverDocs(snapshot);
};

const queryBranchFallback = async ({
    db,
    targetBranchKey,
}: {
    db: LoadRequestApproversParams['db'];
    targetBranchKey: BranchKey;
}) => {
    const branchValues = getBranchQueryValues(targetBranchKey).slice(0, 10);
    if (!branchValues.length) return [] as ApproverRecipientDoc[];
    const snapshot = await db
        .collection('personnel')
        .where('branch', 'in', branchValues)
        .get();
    return toApproverDocs(snapshot);
};

export const loadRequestApprovers = async ({
    db,
    targetBranchKey,
    targetRoles,
    excludeUid,
}: LoadRequestApproversParams): Promise<ApproverRecipient[]> => {
    if (!targetBranchKey || !targetRoles.length) return [];

    let indexedDocs: ApproverRecipientDoc[] = [];
    try {
        indexedDocs = await queryApprovalIndex({ db, targetBranchKey });
    } catch (error) {
        console.warn('Request approver lookup index query failed, using fallback query.', error);
    }

    let fallbackDocs: ApproverRecipientDoc[] = [];
    if (MERGE_INDEX_AND_FALLBACK_DURING_APPROVAL_BACKFILL || !indexedDocs.length) {
        try {
            fallbackDocs = await queryBranchFallback({ db, targetBranchKey });
        } catch (error) {
            console.warn('Request approver fallback branch query failed.', error);
        }
    }

    const mergedCandidates = [...indexedDocs, ...fallbackDocs];
    const filteredRecipients = filterApproverRecipients(
        mapApproverRecipientDocs(mergedCandidates),
        { excludeUid, targetBranchKey, targetRoles }
    );
    return dedupeApprovers(filteredRecipients);
};
