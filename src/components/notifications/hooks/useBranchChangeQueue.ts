import { useEffect, useMemo, useState } from 'react';
import { db } from '../../../services/firebase';
import { isBranchManagerRole, isDeveloperRole, isOperationsRole } from '../../../utils/roles';
import { getBranchKey } from '../../app/hooks/appLeadHandlers/utils/approvalRouting';
import type {
    ApprovalRoleKey,
    BranchChangeNotificationStatus,
    BranchChangeRequestStatus,
    BranchKey,
} from '../../../types/branchChangeRequest';
import type { User } from '../../../types';

export interface BranchChangeInboxScope {
    roleKey: ApprovalRoleKey;
    targetBranchKey?: BranchKey;
}

export interface BranchChangeQueueItem {
    id: string;
    requesterName: string;
    requesterRole: string | null;
    currentBranch: string | null;
    requestedBranch: string;
    requestedCountry: string | null;
    targetBranchKey: BranchKey;
    targetRoles: ApprovalRoleKey[];
    status: BranchChangeRequestStatus;
    notificationStatus: BranchChangeNotificationStatus;
    notificationError: string | null;
    createdAt: Date | null;
}

interface QueryPlanFilter {
    fieldPath: 'status' | 'targetRoles' | 'targetBranchKey';
    opStr: '==' | 'array-contains';
    value: string;
}

interface BranchChangeQueueQueryPlan {
    filters: QueryPlanFilter[];
    orderBy: { fieldPath: 'createdAt'; direction: 'desc' };
    limit: number;
}

const isTimestampLike = (value: unknown): value is { toDate: () => Date } =>
    Boolean(value && typeof (value as { toDate?: unknown }).toDate === 'function');

const toDateOrNull = (value: unknown) => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (isTimestampLike(value)) return value.toDate();
    return null;
};

const toStringOrNull = (value: unknown) => {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed || null;
};

const toBranchKey = (value: unknown): BranchKey => {
    const text = toStringOrNull(value) || '';
    const branchKey = getBranchKey(text);
    return branchKey;
};

const toRoleKeys = (value: unknown): ApprovalRoleKey[] => {
    if (!Array.isArray(value)) return [];
    return value
        .map((item) => toStringOrNull(item))
        .filter((item): item is ApprovalRoleKey =>
            item === 'operations' || item === 'branch manager' || item === 'developer'
        );
};

export const resolveBranchChangeInboxScope = ({
    userRole,
    userBranch,
}: {
    userRole: string;
    userBranch?: string | null;
}): BranchChangeInboxScope | null => {
    if (isDeveloperRole(userRole)) {
        return { roleKey: 'developer' };
    }

    const branchKey = getBranchKey(userBranch || '');
    if (isOperationsRole(userRole) && branchKey) {
        return { roleKey: 'operations', targetBranchKey: branchKey };
    }
    if (isBranchManagerRole(userRole) && branchKey) {
        return { roleKey: 'branch manager', targetBranchKey: branchKey };
    }
    return null;
};

export const mapBranchChangeQueueDoc = (
    id: string,
    data: Record<string, unknown>
): BranchChangeQueueItem => {
    const statusRaw = toStringOrNull(data.status) || 'pending';
    const status: BranchChangeRequestStatus =
        statusRaw === 'approved' || statusRaw === 'rejected' ? statusRaw : 'pending';
    const notificationRaw = toStringOrNull(data.notificationStatus) || 'pending';
    const notificationStatus: BranchChangeNotificationStatus =
        notificationRaw === 'sent' || notificationRaw === 'failed' ? notificationRaw : 'pending';

    return {
        id,
        requesterName: toStringOrNull(data.requesterName) || 'Staff',
        requesterRole: toStringOrNull(data.requesterRole),
        currentBranch: toStringOrNull(data.currentBranch),
        requestedBranch: toStringOrNull(data.requestedBranch) || '',
        requestedCountry: toStringOrNull(data.requestedCountry),
        targetBranchKey: toBranchKey(data.targetBranchKey),
        targetRoles: toRoleKeys(data.targetRoles),
        status,
        notificationStatus,
        notificationError: toStringOrNull(data.notificationError),
        createdAt: toDateOrNull(data.createdAt),
    };
};

export const buildBranchChangeQueueQueryPlan = (
    scope: BranchChangeInboxScope
): BranchChangeQueueQueryPlan => {
    const filters: QueryPlanFilter[] = [
        { fieldPath: 'status', opStr: '==', value: 'pending' },
        { fieldPath: 'targetRoles', opStr: 'array-contains', value: scope.roleKey },
    ];
    if (scope.targetBranchKey) {
        filters.push({
            fieldPath: 'targetBranchKey',
            opStr: '==',
            value: scope.targetBranchKey,
        });
    }
    return {
        filters,
        orderBy: { fieldPath: 'createdAt', direction: 'desc' },
        limit: 50,
    };
};

export const useBranchChangeQueue = ({
    user,
    userRole,
}: {
    user: User;
    userRole: string;
}) => {
    const [requests, setRequests] = useState<BranchChangeQueueItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const scope = useMemo(
        () =>
            resolveBranchChangeInboxScope({
                userRole,
                userBranch: user.branch,
            }),
        [user.branch, userRole]
    );

    useEffect(() => {
        if (!scope || !db) {
            setRequests([]);
            setIsLoading(false);
            setError(null);
            return;
        }

        setIsLoading(true);
        setError(null);

        const queryPlan = buildBranchChangeQueueQueryPlan(scope);
        let query = db.collection('branchChangeRequestQueue');
        queryPlan.filters.forEach((filter) => {
            query = query.where(filter.fieldPath, filter.opStr, filter.value);
        });
        query = query.orderBy(queryPlan.orderBy.fieldPath, queryPlan.orderBy.direction).limit(queryPlan.limit);

        const unsubscribe = query.onSnapshot(
            (snapshot: { docs: Array<{ id: string; data: () => unknown }> }) => {
                const nextItems = snapshot.docs.map((doc) =>
                    mapBranchChangeQueueDoc(doc.id, (doc.data() || {}) as Record<string, unknown>)
                );
                setRequests(nextItems);
                setIsLoading(false);
            },
            (snapshotError: unknown) => {
                console.error('Failed to subscribe to branch-change queue:', snapshotError);
                setError('Failed to load pending branch-change requests.');
                setIsLoading(false);
            }
        );

        return () => unsubscribe();
    }, [scope]);

    return { scope, requests, isLoading, error };
};
