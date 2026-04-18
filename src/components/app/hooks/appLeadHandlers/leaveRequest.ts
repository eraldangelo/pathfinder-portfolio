import { applyLeaveDecision } from '../../../../utils/leaveApproval';
import { countWeekdaysBetween } from '../../../../utils/leave';
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
import { formatLeaveRange } from './utils/requestFormatting';

export interface LeaveRequestFormData {
    fromDate: string;
    toDate: string;
    dayCount: number;
    reason: string;
}

export const resolveLeaveApproverRecipients = (
    params: Parameters<typeof loadRequestApprovers>[0],
    resolveApprovers: typeof loadRequestApprovers = loadRequestApprovers
) => resolveApprovers(params);

export const submitLeaveRequest = async (
    { user, userRole, t, showPopup }: LeadHandlersBaseDeps,
    data: LeaveRequestFormData
) => {
    if (!data?.fromDate || !data?.toDate || !data?.reason) {
        return;
    }

    const computedDays = data.dayCount > 0 ? data.dayCount : countWeekdaysBetween(data.fromDate, data.toDate);
    if (computedDays <= 0) {
        return;
    }

    const currentBalance = Number.isFinite(user?.leaveBalance) ? Math.max(0, Math.floor(user?.leaveBalance ?? 0)) : 0;
    if (computedDays > currentBalance) {
        showPopup(t('leaveBalanceExceeded', { count: currentBalance }));
        return;
    }

    const payload = {
        type: 'leave',
        date: data.fromDate,
        fromDate: data.fromDate,
        toDate: data.toDate,
        dayCount: computedDays,
        reason: data.reason,
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

    const notifyApprovers = async (requestId: string) => {
        if (!db || !user?.uid) return { approverName: null, approverRoleLabel: null };
        const branch = (user.branch || '').trim();
        if (!branch) return { approverName: null, approverRoleLabel: null };

        const { branchKey, targetBranchKey, targetRoles } = getApproverTargets(branch, requiresDavaoApprover);
        if (!branchKey || !targetBranchKey || !targetRoles.length) return { approverName: null, approverRoleLabel: null };

        const requesterName = user.displayName || user.email || 'Staff';
        const rangeLabel = formatLeaveRange(data.fromDate, data.toDate, (key, fallback) => t(key, fallback));
        const dayLabel = `${computedDays} ${computedDays === 1 ? t('day', 'Day') : t('days', 'Days')}`;
        const message = `${requesterName} requested leave from ${rangeLabel} (${dayLabel}).`;

        try {
            const recipients = await resolveLeaveApproverRecipients({
                excludeUid: user.uid,
                db,
                targetBranchKey,
                targetRoles,
            });

            if (!recipients.length) return { approverName: null, approverRoleLabel: getApproverRoleLabel(branchKey) };

            const approverName = pickApproverName(recipients);
            await dispatchNotifications(
                recipients.map((recipient) => ({
                    recipientUid: recipient.id,
                    message,
                    data: {
                        eventKey: 'leaveRequest',
                        requestId,
                        requestOwnerId: user.uid,
                        requestStatus: 'pending',
                        requestType: 'leave',
                        requestDate: data.fromDate,
                        requestFromDate: data.fromDate,
                        requestToDate: data.toDate,
                        requestDayCount: computedDays,
                        requestReason: data.reason,
                        requesterName: user.displayName || user.email || null,
                        requesterBranch: user.branch || null,
                        requesterRole: userRole ?? null,
                    },
                }))
            );
            return { approverName, approverRoleLabel: getApproverRoleLabel(targetBranchKey) };
        } catch (error) {
            console.error('Error sending leave approval notifications:', error);
            return { approverName: null, approverRoleLabel: null };
        }
    };

    const rangeLabel = formatLeaveRange(data.fromDate, data.toDate, (key, fallback) => t(key, fallback));
    const fallbackApproverLabel = getApproverRoleLabel(getBranchKey(user?.branch || '')) || 'Manager';
    let submissionMessage = `Your leave request from ${rangeLabel} has been submitted and is pending for ${makePossessive(fallbackApproverLabel)} approval.`;

    if (user?.uid) {
        const ready = await ensureFirebaseReady();
        if (ready && db) {
            try {
                const requestRef = db.collection('personnel').doc(user.uid).collection('leaveRequests').doc();
                await requestRef.set(payload);
                if (isAutoApprove) {
                    await applyLeaveDecision({
                        requestOwnerId: user.uid,
                        requestId: requestRef.id,
                        decision: 'yes',
                        requestDate: data.fromDate,
                        requestFromDate: data.fromDate,
                        requestToDate: data.toDate,
                        requestDayCount: computedDays,
                        approverId: null,
                        approverName: 'Auto Approve',
                        approverRole: 'System',
                    });
                    submissionMessage = `Your leave request from ${rangeLabel} was approved by Auto Approve.`;
                } else {
                    const { approverName, approverRoleLabel } = await notifyApprovers(requestRef.id);
                    const approverLabel = approverName || approverRoleLabel || fallbackApproverLabel;
                    submissionMessage = `Your leave request from ${rangeLabel} has been submitted and is pending for ${makePossessive(approverLabel)} approval.`;

                    await db.collection('personnel').doc(user.uid).collection('notifications').add({
                        message: submissionMessage,
                        createdAt: serverTimestamp ? serverTimestamp() : new Date(),
                        read: false,
                        eventKey: 'leaveRequest',
                        requestId: requestRef.id,
                        requestOwnerId: user.uid,
                        requestStatus: 'pending',
                        requestType: 'leave',
                        requestDate: data.fromDate,
                        requestFromDate: data.fromDate,
                        requestToDate: data.toDate,
                        requestDayCount: computedDays,
                        requestReason: data.reason,
                        requesterName: user.displayName || user.email || null,
                        requesterBranch: user.branch || null,
                        requesterRole: userRole ?? null,
                        approverName: approverLabel,
                    });
                }
            } catch (err) {
                console.error('Failed to submit leave request:', err);
            }
        }
    }

    showPopup(submissionMessage, { eventKey: 'leaveRequest', persist: false });
};
