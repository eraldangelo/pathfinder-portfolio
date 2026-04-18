import { db, ensureFirebaseReady, serverTimestamp } from '../services/firebase';
import { dispatchNotifications } from '../services/notificationsApi';
import { countWeekdaysBetween } from './leave';
import { parseLocalDateKey } from './timesheet';

export type LeaveDecision = 'yes' | 'no';
export type LeaveDecisionStatus = 'approved' | 'rejected' | 'pending' | null;

interface ApplyLeaveDecisionInput {
    requestOwnerId: string;
    requestId: string;
    decision: LeaveDecision;
    requestDate?: string | null;
    requestFromDate?: string | null;
    requestToDate?: string | null;
    requestDayCount?: number | null;
    approverId?: string | null;
    approverName?: string | null;
    approverRole?: string | null;
}

interface ApplyLeaveDecisionResult {
    status: LeaveDecisionStatus;
    updated: boolean;
    requestDate?: string | null;
    requestFromDate?: string | null;
    requestToDate?: string | null;
    requestDayCount?: number | null;
    requestType?: string | null;
}

const formatLeaveDate = (value?: string | null) => {
    if (!value) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const parsed = parseLocalDateKey(value);
        return new Intl.DateTimeFormat('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        })
            .format(parsed)
            .replace(/ /g, '-');
    }
    return value;
};

const buildDecisionMessage = (
    status: 'approved' | 'rejected',
    rangeLabel?: string | null,
    approverName?: string | null
) => {
    const approverSuffix = approverName ? ` by ${approverName}` : '';
    if (rangeLabel) {
        return status === 'approved'
            ? `Your leave request for ${rangeLabel} was approved${approverSuffix}.`
            : `Your leave request for ${rangeLabel} was rejected${approverSuffix}.`;
    }
    return status === 'approved'
        ? `Your leave request was approved${approverSuffix}.`
        : `Your leave request was rejected${approverSuffix}.`;
};

export const applyLeaveDecision = async ({
    requestOwnerId,
    requestId,
    decision,
    requestDate,
    requestFromDate,
    requestToDate,
    requestDayCount,
    approverId,
    approverName,
    approverRole,
}: ApplyLeaveDecisionInput): Promise<ApplyLeaveDecisionResult> => {
    const ready = await ensureFirebaseReady();
    if (!ready || !db) {
        return { status: null, updated: false, requestDate: requestDate ?? null, requestType: null };
    }

    const requestRef = db
        .collection('personnel')
        .doc(requestOwnerId)
        .collection('leaveRequests')
        .doc(requestId);
    const ownerRef = db.collection('personnel').doc(requestOwnerId);

    let resolvedStatus: LeaveDecisionStatus = null;
    let didUpdate = false;
    let resolvedDate = requestDate ?? null;
    let resolvedFromDate = requestFromDate ?? null;
    let resolvedToDate = requestToDate ?? null;
    let resolvedDayCount = typeof requestDayCount === 'number' ? requestDayCount : null;
    let resolvedType: string | null = null;

    try {
        await db.runTransaction(async (transaction: any) => {
            const requestSnapshot = await transaction.get(requestRef);
            if (!requestSnapshot.exists) {
                resolvedStatus = null;
                return;
            }

            const data = requestSnapshot.data() || {};
            const currentStatus = data.status ?? 'pending';
            const requestType = data.type === 'offset' ? 'offset' : 'leave';
            resolvedType = requestType;

            if (!resolvedDate && data.date) {
                resolvedDate = String(data.date);
            }
            if (!resolvedFromDate && data.fromDate) {
                resolvedFromDate = String(data.fromDate);
            }
            if (!resolvedToDate && data.toDate) {
                resolvedToDate = String(data.toDate);
            }
            if (resolvedDayCount === null && typeof data.dayCount === 'number') {
                resolvedDayCount = data.dayCount;
            }
            if (resolvedFromDate || resolvedToDate) {
                resolvedDate = resolvedDate ?? resolvedFromDate ?? resolvedToDate;
            }

            if (currentStatus !== 'pending') {
                resolvedStatus = currentStatus;
                return;
            }

            const nextStatus: LeaveDecisionStatus = decision === 'yes' ? 'approved' : 'rejected';
            resolvedStatus = nextStatus;
            didUpdate = true;

            let nextBalance: number | null = null;
            let nextUsed: number | null = null;

            if (decision === 'yes' && requestType === 'leave') {
                const ownerSnapshot = await transaction.get(ownerRef);
                const ownerData = ownerSnapshot.exists ? ownerSnapshot.data() || {} : {};
                const currentBalance = Number(ownerData.leaveBalance ?? 0);
                const currentUsed = Number(ownerData.leaveUsed ?? 0);
                let daysToDeduct = resolvedDayCount;
                if (daysToDeduct === null) {
                    if ((resolvedFromDate || resolvedToDate) && resolvedFromDate && resolvedToDate) {
                        daysToDeduct = countWeekdaysBetween(resolvedFromDate, resolvedToDate);
                    } else {
                        daysToDeduct = 1;
                    }
                }
                const safeDays = Math.max(0, Number(daysToDeduct) || 0);
                if (resolvedDayCount === null) {
                    resolvedDayCount = safeDays;
                }
                nextBalance = Math.max(0, currentBalance - safeDays);
                nextUsed = currentUsed + safeDays;
            }

            transaction.update(requestRef, {
                status: nextStatus,
                updatedAt: serverTimestamp ? serverTimestamp() : new Date(),
                approvedById: approverId ?? null,
                approvedByName: approverName ?? null,
                approvedByRole: approverRole ?? null,
                approvedAt: serverTimestamp ? serverTimestamp() : new Date(),
            });

            if (nextBalance !== null && nextUsed !== null) {
                transaction.set(
                    ownerRef,
                    { leaveBalance: nextBalance, leaveUsed: nextUsed },
                    { merge: true }
                );
            }
        });
    } catch (error) {
        console.error('Failed to update leave request status:', error);
        return { status: resolvedStatus, updated: false, requestDate: resolvedDate, requestType: resolvedType };
    }

    if (didUpdate && resolvedStatus && resolvedStatus !== 'pending') {
        const rangeLabel = (() => {
            const fromLabel = formatLeaveDate(resolvedFromDate ?? resolvedDate ?? null);
            const toLabel = formatLeaveDate(resolvedToDate ?? resolvedDate ?? null);
            if (fromLabel && toLabel && fromLabel !== toLabel) {
                return `${fromLabel} to ${toLabel}`;
            }
            return fromLabel || toLabel || formatLeaveDate(resolvedDate ?? null) || null;
        })();
        const message = buildDecisionMessage(
            resolvedStatus as 'approved' | 'rejected',
            rangeLabel,
            approverName ?? null
        );
        try {
            await dispatchNotifications([
                {
                    recipientUid: requestOwnerId,
                    message,
                    data: {
                        eventKey: 'leaveDecision',
                        requestId,
                        requestStatus: resolvedStatus,
                        requestType: resolvedType ?? 'leave',
                        requestDate: resolvedDate ?? null,
                        requestFromDate: resolvedFromDate ?? null,
                        requestToDate: resolvedToDate ?? null,
                        requestDayCount: resolvedDayCount ?? null,
                        approverName: approverName ?? null,
                        approverRole: approverRole ?? null,
                    },
                },
            ]);
        } catch (error) {
            console.error('Failed to send leave decision notification:', error);
        }
    }

    return {
        status: resolvedStatus,
        updated: didUpdate,
        requestDate: resolvedDate,
        requestFromDate: resolvedFromDate,
        requestToDate: resolvedToDate,
        requestDayCount: resolvedDayCount,
        requestType: resolvedType,
    };
};
