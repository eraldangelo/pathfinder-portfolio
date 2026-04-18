import { applyOffsetDecision } from '../../../../utils/offsetApproval';
import { isValidOffsetUseHours } from '../../../../utils/offset';
import { getOffsetUseEndTime } from '../../../../utils/offsetUse';
import { isBranchManagerRole, isOperationsRole } from '../../../../utils/roles';
import { db, ensureFirebaseReady, serverTimestamp } from '../../../../services/firebase';
import { dispatchNotifications } from '../../../../services/notificationsApi';
import type { LeadHandlersBaseDeps } from './types';
import { loadRequestApprovers } from '../requestApprovers';
import {
    getApproverRoleLabel,
    getApproverTargets,
    getBranchKey,
    makePossessive,
    pickApproverName,
} from './utils/approvalRouting';
import { formatLocalDate, formatOffsetHours } from './utils/requestFormatting';

export interface OffsetRequestFormData {
    date: string;
    hours: number;
    reason: string;
    mode?: 'add' | 'use';
    startTime?: string;
    endTime?: string;
}

export const resolveOffsetApproverRecipients = (
    params: Parameters<typeof loadRequestApprovers>[0],
    resolveApprovers: typeof loadRequestApprovers = loadRequestApprovers
) => resolveApprovers(params);

export const submitOffsetRequest = async (
    { user, userRole, t, showPopup }: LeadHandlersBaseDeps,
    data: OffsetRequestFormData
) => {
    if (!data?.date || !data?.reason || !data?.hours || data.hours <= 0) {
        return;
    }

    const normalizedHours = Number(data.hours);
    const reason = data.reason.trim();
    if (!Number.isFinite(normalizedHours) || normalizedHours <= 0 || reason.length < 20) {
        return;
    }
    const requestMode = data.mode === 'use' ? 'use' : 'add';
    const normalizedStartTime = typeof data.startTime === 'string' ? data.startTime.trim() : '';
    const expectedEndTime = requestMode === 'use' ? getOffsetUseEndTime(normalizedStartTime, normalizedHours) : null;
    const startTime = requestMode === 'use' ? normalizedStartTime : null;
    const endTime = requestMode === 'use' ? expectedEndTime : null;

    if (requestMode === 'use') {
        if (!isValidOffsetUseHours(normalizedHours)) {
            showPopup(t('offsetUseHoursInvalid', 'Offset use must be between 1 and 7 whole hours.'));
            return;
        }
        if (!startTime || !endTime) {
            showPopup(t('offsetUseTimeSlotInvalid', 'Please select a valid start time for the requested offset hours.'));
            return;
        }
    }

    if (requestMode === 'use' && user?.uid) {
        const ready = await ensureFirebaseReady();
        if (ready && db) {
            try {
                const existingRequestSnapshot = await db
                    .collection('personnel')
                    .doc(user.uid)
                    .collection('offsetRequests')
                    .where('date', '==', data.date)
                    .limit(50)
                    .get();
                const hasPendingOrApprovedUseRequest = existingRequestSnapshot.docs.some((doc: any) => {
                    const requestData = doc.data() || {};
                    const status = String(requestData.status ?? '').toLowerCase();
                    return requestData.mode === 'use' && (status === 'pending' || status === 'approved');
                });
                if (hasPendingOrApprovedUseRequest) {
                    showPopup(t('offsetUseDateAlreadyRequested', 'You already have a pending or approved offset use request for this date.'));
                    return;
                }

                const ownerSnapshot = await db.collection('personnel').doc(user.uid).get();
                const ownerData = ownerSnapshot.exists ? ownerSnapshot.data() || {} : {};
                const remainingHours = Number(ownerData.offsetBalance ?? 0);
                if (normalizedHours > remainingHours + 1e-9) {
                    const formattedRemaining = Number.isInteger(remainingHours) ? remainingHours : Number(remainingHours.toFixed(1));
                    showPopup(t('offsetBalanceExceeded', { count: formattedRemaining }));
                    return;
                }
            } catch (error) {
                console.error('Failed to validate remaining offset hours:', error);
            }
        }
    }

    const payload = {
        type: 'offset',
        date: data.date,
        hours: normalizedHours,
        mode: requestMode,
        startTime,
        endTime,
        reason,
        status: 'pending',
        requesterId: user?.uid ?? null,
        requesterName: user?.displayName ?? null,
        requesterBranch: user?.branch ?? null,
        requesterRole: userRole ?? null,
        createdAt: serverTimestamp ? serverTimestamp() : new Date(),
        updatedAt: serverTimestamp ? serverTimestamp() : new Date(),
    };

    const requesterBranchKey = getBranchKey(user?.branch || '');
    const isRequesterOperations = isOperationsRole(userRole);
    const isRequesterBranchManager = isBranchManagerRole(userRole);
    const isAutoApprove = isRequesterOperations && requesterBranchKey === 'davao';
    const requiresDavaoApprover =
        (isRequesterOperations && requesterBranchKey === 'manila') ||
        (isRequesterBranchManager && (requesterBranchKey === 'cebu' || requesterBranchKey === 'pampanga'));

    const dateLabel = formatLocalDate(data.date);
    const hoursLabel = formatOffsetHours(normalizedHours);
    const actionLabel = requestMode === 'use' ? 'use' : 'add';
    const timeSlotLabel = requestMode === 'use' && startTime && endTime ? ` (${startTime}-${endTime})` : '';

    const notifyApprovers = async (requestId: string) => {
        if (!db || !user?.uid) return { approverName: null, approverRoleLabel: null };
        const branch = (user.branch || '').trim();
        if (!branch) return { approverName: null, approverRoleLabel: null };

        const { targetBranchKey, targetRoles } = getApproverTargets(branch, requiresDavaoApprover);
        if (!targetBranchKey || !targetRoles.length) return { approverName: null, approverRoleLabel: null };

        const requesterName = user.displayName || user.email || 'Staff';
        const message = `${requesterName} requested to ${actionLabel} ${hoursLabel} of offset on ${dateLabel}${timeSlotLabel}.`;

        try {
            const recipients = await resolveOffsetApproverRecipients({
                excludeUid: user.uid,
                db,
                targetBranchKey,
                targetRoles,
            });

            if (!recipients.length) {
                return { approverName: null, approverRoleLabel: getApproverRoleLabel(targetBranchKey) };
            }

            const approverName = pickApproverName(recipients);
            await dispatchNotifications(
                recipients.map((recipient) => ({
                    recipientUid: recipient.id,
                    message,
                    data: {
                        eventKey: 'offsetRequest',
                        requestId,
                        requestOwnerId: user.uid,
                        requestStatus: 'pending',
                        requestType: 'offset',
                        requestDate: data.date,
                        requestReason: reason,
                        requestHours: normalizedHours,
                        requestMode,
                        requestStartTime: startTime,
                        requestEndTime: endTime,
                        requesterName: user.displayName || user.email || null,
                        requesterBranch: user.branch || null,
                        requesterRole: userRole ?? null,
                    },
                }))
            );
            return { approverName, approverRoleLabel: getApproverRoleLabel(targetBranchKey) };
        } catch (error) {
            console.error('Error sending offset approval notifications:', error);
            return { approverName: null, approverRoleLabel: null };
        }
    };

    const fallbackApproverLabel = getApproverRoleLabel(getBranchKey(user?.branch || '')) || 'Manager';
    let submissionMessage = `Your offset request to ${actionLabel} ${hoursLabel} on ${dateLabel}${timeSlotLabel} has been submitted and is pending for ${makePossessive(fallbackApproverLabel)} approval.`;

    if (user?.uid) {
        const ready = await ensureFirebaseReady();
        if (ready && db) {
            try {
                const requestRef = db.collection('personnel').doc(user.uid).collection('offsetRequests').doc();
                await requestRef.set(payload);
                if (isAutoApprove) {
                    await applyOffsetDecision({
                        requestOwnerId: user.uid,
                        requestId: requestRef.id,
                        decision: 'yes',
                        requestDate: data.date,
                        requestHours: normalizedHours,
                        requestStartTime: startTime,
                        requestEndTime: endTime,
                        approverId: null,
                        approverName: 'Auto Approve',
                        approverRole: 'System',
                    });
                    submissionMessage = `Your offset request to ${actionLabel} ${hoursLabel} on ${dateLabel}${timeSlotLabel} was approved by Auto Approve.`;
                } else {
                    const { approverName, approverRoleLabel } = await notifyApprovers(requestRef.id);
                    const approverLabel = approverName || approverRoleLabel || fallbackApproverLabel;
                    submissionMessage = `Your offset request to ${actionLabel} ${hoursLabel} on ${dateLabel}${timeSlotLabel} has been submitted and is pending for ${makePossessive(approverLabel)} approval.`;

                    await db.collection('personnel').doc(user.uid).collection('notifications').add({
                        message: submissionMessage,
                        createdAt: serverTimestamp ? serverTimestamp() : new Date(),
                        read: false,
                        eventKey: 'offsetRequest',
                        requestId: requestRef.id,
                        requestOwnerId: user.uid,
                        requestStatus: 'pending',
                        requestType: 'offset',
                        requestDate: data.date,
                        requestReason: reason,
                        requestHours: normalizedHours,
                        requestMode,
                        requestStartTime: startTime,
                        requestEndTime: endTime,
                        requesterName: user.displayName || user.email || null,
                        requesterBranch: user.branch || null,
                        requesterRole: userRole ?? null,
                        approverName: approverLabel,
                    });
                }
            } catch (err) {
                console.error('Failed to submit offset request:', err);
            }
        }
    }

    showPopup(submissionMessage, { eventKey: 'offsetRequest', persist: false });
};
