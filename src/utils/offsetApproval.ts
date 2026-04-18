import { db, ensureFirebaseReady, serverTimestamp } from '../services/firebase';
import { dispatchNotifications } from '../services/notificationsApi';
import { getOffsetUseUsageHours } from './offsetUse';
import { parseLocalDateKey } from './timesheet';

export type OffsetDecision = 'yes' | 'no';
export type OffsetDecisionStatus = 'approved' | 'rejected' | 'pending' | null;

interface ApplyOffsetDecisionInput {
    requestOwnerId: string;
    requestId: string;
    decision: OffsetDecision;
    requestDate?: string | null;
    requestHours?: number | null;
    requestStartTime?: string | null;
    requestEndTime?: string | null;
    approverId?: string | null;
    approverName?: string | null;
    approverRole?: string | null;
}

interface ApplyOffsetDecisionResult {
    status: OffsetDecisionStatus;
    updated: boolean;
    requestDate?: string | null;
    requestHours?: number | null;
    requestStartTime?: string | null;
    requestEndTime?: string | null;
}

const formatOffsetDate = (value?: string | null) => {
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

const formatOffsetHours = (value?: number | null) => {
    if (typeof value !== 'number' || !Number.isFinite(value)) return '';
    const amount = Number.isInteger(value) ? value.toFixed(0) : String(value);
    return `${amount} ${value === 1 ? 'hour' : 'hours'}`;
};

const formatOffsetTimeRange = (startTime?: string | null, endTime?: string | null) => {
    const hasStart = typeof startTime === 'string' && startTime.trim() !== '';
    const hasEnd = typeof endTime === 'string' && endTime.trim() !== '';
    if (!hasStart || !hasEnd) return '';
    return `${startTime}-${endTime}`;
};

const buildDecisionMessage = (
    status: 'approved' | 'rejected',
    dateLabel?: string | null,
    hoursLabel?: string | null,
    timeRangeLabel?: string | null,
    approverName?: string | null
) => {
    const details = [hoursLabel, dateLabel ? `on ${dateLabel}` : null, timeRangeLabel ? `(${timeRangeLabel})` : null]
        .filter(Boolean)
        .join(' ');
    const subject = details ? `Your offset request for ${details}` : 'Your offset request';
    const approverSuffix = approverName ? ` by ${approverName}` : '';
    return status === 'approved'
        ? `${subject} was approved${approverSuffix}.`
        : `${subject} was rejected${approverSuffix}.`;
};

export const applyOffsetDecision = async ({
    requestOwnerId,
    requestId,
    decision,
    requestDate,
    requestHours,
    requestStartTime,
    requestEndTime,
    approverId,
    approverName,
    approverRole,
}: ApplyOffsetDecisionInput): Promise<ApplyOffsetDecisionResult> => {
    const ready = await ensureFirebaseReady();
    if (!ready || !db) {
        return {
            status: null,
            updated: false,
            requestDate: requestDate ?? null,
            requestHours: requestHours ?? null,
            requestStartTime: requestStartTime ?? null,
            requestEndTime: requestEndTime ?? null,
        };
    }

    const requestRef = db
        .collection('personnel')
        .doc(requestOwnerId)
        .collection('offsetRequests')
        .doc(requestId);
    const ownerRef = db.collection('personnel').doc(requestOwnerId);

    let resolvedStatus: OffsetDecisionStatus = null;
    let didUpdate = false;
    let resolvedDate = requestDate ?? null;
    let resolvedHours = typeof requestHours === 'number' ? requestHours : null;
    let resolvedStartTime = requestStartTime ?? null;
    let resolvedEndTime = requestEndTime ?? null;
    let resolvedMode: 'add' | 'use' | null = null;

    try {
        await db.runTransaction(async (transaction: any) => {
            const requestSnapshot = await transaction.get(requestRef);
            if (!requestSnapshot.exists) {
                resolvedStatus = null;
                return;
            }

            const data = requestSnapshot.data() || {};
            const currentStatus = data.status ?? 'pending';
            if (!resolvedDate && data.date) {
                resolvedDate = String(data.date);
            }
            if (resolvedHours === null && typeof data.hours === 'number') {
                resolvedHours = data.hours;
            }
            if (!resolvedStartTime && data.startTime) {
                resolvedStartTime = String(data.startTime);
            }
            if (!resolvedEndTime && data.endTime) {
                resolvedEndTime = String(data.endTime);
            }
            resolvedMode = data.mode === 'use' ? 'use' : 'add';

            if (currentStatus !== 'pending') {
                resolvedStatus = currentStatus;
                return;
            }

            const nextStatus: OffsetDecisionStatus = decision === 'yes' ? 'approved' : 'rejected';
            resolvedStatus = nextStatus;
            didUpdate = true;

            let nextBalance: number | null = null;
            let nextUsed: number | null = null;

            if (decision === 'yes' && typeof resolvedHours === 'number' && Number.isFinite(resolvedHours)) {
                const ownerSnapshot = await transaction.get(ownerRef);
                const ownerData = ownerSnapshot.exists ? ownerSnapshot.data() || {} : {};
                const currentBalance = Number(ownerData.offsetBalance ?? 0);
                const currentUsed = Number(ownerData.offsetUsed ?? 0);
                const computedUseHours = resolvedMode === 'use'
                    ? getOffsetUseUsageHours(resolvedStartTime, resolvedEndTime)
                    : null;
                const safeHours = Math.max(
                    0,
                    typeof computedUseHours === 'number' && Number.isFinite(computedUseHours)
                        ? computedUseHours
                        : resolvedHours
                );
                if (resolvedMode === 'use') {
                    resolvedHours = safeHours;
                }
                if (resolvedMode === 'use') {
                    nextBalance = Math.max(0, currentBalance - safeHours);
                    nextUsed = currentUsed + safeHours;
                } else {
                    nextBalance = currentBalance + safeHours;
                    nextUsed = currentUsed;
                }
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
                    { offsetBalance: nextBalance, offsetUsed: nextUsed },
                    { merge: true }
                );
            }
        });
    } catch (error) {
        console.error('Failed to update offset request status:', error);
        return {
            status: resolvedStatus,
            updated: false,
            requestDate: resolvedDate,
            requestHours: resolvedHours,
            requestStartTime: resolvedStartTime,
            requestEndTime: resolvedEndTime,
        };
    }

    if (didUpdate && resolvedStatus && resolvedStatus !== 'pending') {
        const dateLabel = formatOffsetDate(resolvedDate ?? null);
        const hoursLabel = formatOffsetHours(resolvedHours);
        const timeRangeLabel = formatOffsetTimeRange(resolvedStartTime, resolvedEndTime);
        const message = buildDecisionMessage(
            resolvedStatus as 'approved' | 'rejected',
            dateLabel || null,
            hoursLabel || null,
            timeRangeLabel || null,
            approverName ?? null
        );
        try {
            await dispatchNotifications([
                {
                    recipientUid: requestOwnerId,
                    message,
                    data: {
                        eventKey: 'offsetDecision',
                        requestId,
                        requestStatus: resolvedStatus,
                        requestType: 'offset',
                        requestDate: resolvedDate ?? null,
                        requestHours: resolvedHours ?? null,
                        requestStartTime: resolvedStartTime ?? null,
                        requestEndTime: resolvedEndTime ?? null,
                        approverName: approverName ?? null,
                        approverRole: approverRole ?? null,
                    },
                },
            ]);
        } catch (error) {
            console.error('Failed to send offset decision notification:', error);
        }
    }

    return {
        status: resolvedStatus,
        updated: didUpdate,
        requestDate: resolvedDate,
        requestHours: resolvedHours,
        requestStartTime: resolvedStartTime,
        requestEndTime: resolvedEndTime,
    };
};
