import { useEffect, useMemo, useRef, useState } from 'react';
import { db, ensureFirebaseReady } from '../../../services/firebase';
import { parseDate } from '../../../utils/date';
import type { User } from '../../../types';
import type { OffsetRequestItem } from '../components/TimesheetOffsetTracker';
import { filterVisibleOffsetRequests, getOffsetRequestAccess } from '../utils/offsetRequestAccess';
import { createRequesterHydrator, sortByCreatedAtDesc } from './requestHydrationUtils';

interface UseOffsetRequestsParams {
    user: User;
    userRole: string;
}

export const useOffsetRequests = ({ user, userRole }: UseOffsetRequestsParams) => {
    const [offsetRequests, setOffsetRequests] = useState<OffsetRequestItem[]>([]);
    const [isOffsetRequestsLoading, setIsOffsetRequestsLoading] = useState(false);
    const personnelCacheRef = useRef<Map<string, { name: string | null; branch: string | null; role: string | null }>>(new Map());

    const isAdminPhReadonly = (user?.email || '').toLowerCase() === 'admin_ph@example.com';
    const { isDeveloper, currentBranchKey, isOperationsDavao, canReviewOffsetRequests, canViewAllOffsetRequests } =
        getOffsetRequestAccess(user, userRole, isAdminPhReadonly);

    useEffect(() => {
        if (!user?.uid) {
            setOffsetRequests([]);
            return;
        }

        let unsubscribe: (() => void) | null = null;
        let cancelled = false;

        const hydrateMissingRequesters = createRequesterHydrator<OffsetRequestItem>({
            db,
            cacheRef: personnelCacheRef,
            requestCollectionName: 'offsetRequests',
            setRequests: setOffsetRequests,
            hydrateErrorMessage: 'Failed to hydrate offset requester info:',
            backfillErrorMessage: 'Failed to backfill offset requester info:',
        });

        const subscribe = async () => {
            setIsOffsetRequestsLoading(true);
            const ready = await ensureFirebaseReady();
            if (cancelled) return;
            if (!ready || !db) {
                setOffsetRequests([]);
                setIsOffsetRequestsLoading(false);
                return;
            }

            let query: any;
            if (canReviewOffsetRequests || canViewAllOffsetRequests || isOperationsDavao) {
                query = db.collectionGroup('offsetRequests').limit(200);
            } else {
                query = db
                    .collection('personnel')
                    .doc(user.uid)
                    .collection('offsetRequests')
                    .orderBy('createdAt', 'desc')
                    .limit(50);
            }

            unsubscribe = query.onSnapshot(
                (snapshot: any) => {
                    const items = snapshot.docs.map((doc: any) => {
                        const data = doc.data() || {};
                        const ownerId = doc.ref?.parent?.parent?.id ?? null;
                        const isSelf = ownerId && user?.uid && ownerId === user.uid;
                        const fallbackName = data.requesterName ?? (isSelf ? user.displayName ?? user.email ?? null : null);
                        const fallbackBranch = data.requesterBranch ?? (isSelf ? user.branch ?? null : null);
                        const rawHours = typeof data.hours === 'number' ? data.hours : Number(data.hours);
                        const resolvedHours = Number.isFinite(rawHours) ? rawHours : null;
                        return {
                            id: doc.id,
                            ownerId,
                            type: 'offset',
                            mode: data.mode === 'use' ? 'use' : 'add',
                            date: data.date ?? null,
                            hours: resolvedHours,
                            startTime: data.startTime ?? null,
                            endTime: data.endTime ?? null,
                            reason: String(data.reason ?? ''),
                            status: data.status === 'approved' || data.status === 'rejected' ? data.status : 'pending',
                            createdAt: parseDate(data.createdAt),
                            requesterName: fallbackName,
                            requesterBranch: fallbackBranch,
                            requesterRole: data.requesterRole ?? null,
                            approvedByName: data.approvedByName ?? data.approverName ?? null,
                        } as OffsetRequestItem;
                    });
                    const sorted = sortByCreatedAtDesc<OffsetRequestItem>(items);
                    setOffsetRequests(sorted);
                    setIsOffsetRequestsLoading(false);
                    void hydrateMissingRequesters(sorted);
                },
                (err: any) => {
                    console.error('Error fetching offset requests:', err);
                    setIsOffsetRequestsLoading(false);
                }
            );
        };

        subscribe();

        return () => {
            cancelled = true;
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [
        user?.uid,
        user?.branch,
        user?.displayName,
        user?.email,
        userRole,
        canReviewOffsetRequests,
        canViewAllOffsetRequests,
        isOperationsDavao,
    ]);

    const visibleOffsetRequests = useMemo(() => {
        if (canViewAllOffsetRequests) {
            return offsetRequests;
        }
        return filterVisibleOffsetRequests(
            offsetRequests,
            userRole,
            { canReviewOffsetRequests, canViewAllOffsetRequests, isOperationsDavao, currentBranchKey },
            user.branch
        );
    }, [
        offsetRequests,
        canViewAllOffsetRequests,
        isOperationsDavao,
        currentBranchKey,
        canReviewOffsetRequests,
        user?.branch,
        userRole,
    ]);

    return {
        visibleOffsetRequests,
        isOffsetRequestsLoading,
        canReviewOffsetRequests,
        canApproveOffsetRequests: isDeveloper && !isAdminPhReadonly,
        canViewAllOffsetRequests,
    };
};
