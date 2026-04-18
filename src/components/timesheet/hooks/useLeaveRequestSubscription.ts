import { useEffect, useRef, useState } from 'react';
import { db, ensureFirebaseReady } from '../../../services/firebase';
import { parseDate } from '../../../utils/date';
import { countWeekdaysBetween } from '../../../utils/leave';
import type { User } from '../../../types';
import type { LeaveRequestItem } from '../components/TimesheetLeaveRequests';
import { createRequesterHydrator, sortByCreatedAtDesc } from './requestHydrationUtils';

interface UseLeaveRequestSubscriptionParams {
    user: User;
    canApproveRequests: boolean;
    canViewAllLeaveRequests: boolean;
    isOperationsDavao: boolean;
}

export const useLeaveRequestSubscription = ({
    user,
    canApproveRequests,
    canViewAllLeaveRequests,
    isOperationsDavao,
}: UseLeaveRequestSubscriptionParams) => {
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequestItem[]>([]);
    const [isLeaveRequestsLoading, setIsLeaveRequestsLoading] = useState(false);
    const personnelCacheRef = useRef<Map<string, { name: string | null; branch: string | null; role: string | null }>>(new Map());

    useEffect(() => {
        if (!user?.uid) {
            setLeaveRequests([]);
            return;
        }

        let unsubscribe: (() => void) | null = null;
        let cancelled = false;

        const hydrateMissingRequesters = createRequesterHydrator<LeaveRequestItem>({
            db,
            cacheRef: personnelCacheRef,
            requestCollectionName: 'leaveRequests',
            setRequests: setLeaveRequests,
            hydrateErrorMessage: 'Failed to hydrate requester info:',
            backfillErrorMessage: 'Failed to backfill requester info:',
        });

        const subscribe = async () => {
            setIsLeaveRequestsLoading(true);
            const ready = await ensureFirebaseReady();
            if (cancelled) return;
            if (!ready || !db) {
                setLeaveRequests([]);
                setIsLeaveRequestsLoading(false);
                return;
            }

            let query: any;
            if (canApproveRequests || canViewAllLeaveRequests || isOperationsDavao) {
                query = db.collectionGroup('leaveRequests').limit(200);
            } else {
                query = db
                    .collection('personnel')
                    .doc(user.uid)
                    .collection('leaveRequests')
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
                        const fromDate = data.fromDate ?? data.date ?? null;
                        const toDate = data.toDate ?? data.date ?? null;
                        const hasRange = Boolean(data.fromDate || data.toDate);
                        const rawDayCount = typeof data.dayCount === 'number' ? data.dayCount : null;
                        const resolvedDayCount = rawDayCount ?? (hasRange && fromDate && toDate ? countWeekdaysBetween(fromDate, toDate) : 1);
                        return {
                            id: doc.id,
                            ownerId,
                            type: 'leave',
                            date: data.date ?? null,
                            fromDate,
                            toDate,
                            dayCount: resolvedDayCount,
                            reason: String(data.reason ?? ''),
                            status: data.status === 'approved' || data.status === 'rejected' ? data.status : 'pending',
                            createdAt: parseDate(data.createdAt),
                            requesterName: fallbackName,
                            requesterBranch: fallbackBranch,
                            requesterRole: data.requesterRole ?? null,
                            approvedByName: data.approvedByName ?? null,
                        } as LeaveRequestItem;
                    });
                    const sorted = sortByCreatedAtDesc<LeaveRequestItem>(items);
                    setLeaveRequests(sorted);
                    setIsLeaveRequestsLoading(false);
                    void hydrateMissingRequesters(sorted);
                },
                (err: any) => {
                    console.error('Error fetching leave requests:', err);
                    setIsLeaveRequestsLoading(false);
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
    }, [user?.uid, user?.branch, user?.displayName, user?.email, canApproveRequests, canViewAllLeaveRequests, isOperationsDavao]);

    return {
        leaveRequests,
        isLeaveRequestsLoading,
    };
};
