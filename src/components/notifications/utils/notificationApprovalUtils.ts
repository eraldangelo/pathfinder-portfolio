import { applyLeaveDecision } from '../../../utils/leaveApproval';
import { applyOffsetDecision } from '../../../utils/offsetApproval';
import { db, ensureFirebaseReady } from '../../../services/firebase';
import { isBranchManagerRole, isDeveloperRole, isOperationsRole } from '../../../utils/roles';
import type { User } from '../../../types';
import type { NotificationRecord } from './notificationUtils';

const normalizeValue = (value?: string | null) => (value ?? '').trim().toLowerCase();

export const getBranchKey = (branch?: string | null) => {
  const normalized = normalizeValue(branch);
  return normalized.includes('manila')
    ? 'manila'
    : normalized.includes('davao')
    ? 'davao'
    : normalized.includes('cebu')
    ? 'cebu'
    : normalized.includes('pampanga')
    ? 'pampanga'
    : '';
};

export const canUserApproveNotifications = (user: User, userRole: string) => {
  const isAdminPhReadonly = (user?.email || '').toLowerCase() === 'admin_ph@example.com';
  return (isDeveloperRole(userRole) || isOperationsRole(userRole) || isBranchManagerRole(userRole)) && !isAdminPhReadonly;
};

export const canApproveSpecificNotificationRequest = (
  notification: NotificationRecord,
  {
    userRole,
    userBranch,
    canApproveRequests,
  }: {
    userRole: string;
    userBranch?: string | null;
    canApproveRequests: boolean;
  }
) => {
  if (!canApproveRequests) return false;
  if (isDeveloperRole(userRole)) return true;

  const currentBranchKey = getBranchKey(userBranch);
  const isOperationsDavao = isOperationsRole(userRole) && currentBranchKey === 'davao';
  const requesterBranchKey = getBranchKey(notification.requesterBranch);
  const requesterRole = normalizeValue(notification.requesterRole);
  const isRequesterOperationsManila = requesterRole === 'operations' && requesterBranchKey === 'manila';
  const isRequesterBranchManagerCebu = requesterRole === 'branch manager' && requesterBranchKey === 'cebu';
  const isRequesterBranchManagerPampanga = requesterRole === 'branch manager' && requesterBranchKey === 'pampanga';
  const isRequesterDavao = requesterBranchKey === 'davao';
  const isRequesterManila = requesterBranchKey === 'manila';
  const isRequesterCebu = requesterBranchKey === 'cebu';
  const isRequesterPampanga = requesterBranchKey === 'pampanga';
  const isOpsDavaoAllowedRequest =
    isRequesterDavao || isRequesterOperationsManila || isRequesterBranchManagerCebu || isRequesterBranchManagerPampanga;

  if (isOperationsDavao) return isOpsDavaoAllowedRequest;
  if (isOperationsRole(userRole) && currentBranchKey === 'manila') return isRequesterManila;
  if (isBranchManagerRole(userRole) && currentBranchKey === 'cebu') return isRequesterCebu;
  if (isBranchManagerRole(userRole) && currentBranchKey === 'pampanga') return isRequesterPampanga;
  if (currentBranchKey) return requesterBranchKey === currentBranchKey;
  return false;
};

export const applyNotificationRequestDecision = async ({
  notification,
  decision,
  user,
  userRole,
  canApproveRequests,
  canApproveSpecificRequest,
}: {
  notification: NotificationRecord;
  decision: 'yes' | 'no';
  user: User;
  userRole: string;
  canApproveRequests: boolean;
  canApproveSpecificRequest: (notification: NotificationRecord) => boolean;
}) => {
  if (!canApproveRequests) return;
  if (!canApproveSpecificRequest(notification)) return;
  if (!notification.requestId || !notification.requestOwnerId) return;

  const requestType =
    notification.requestType === 'offset' ||
    notification.eventKey === 'offsetRequest' ||
    notification.eventKey === 'offsetDecision'
      ? 'offset'
      : 'leave';

  const result =
    requestType === 'offset'
      ? await applyOffsetDecision({
          requestOwnerId: notification.requestOwnerId,
          requestId: notification.requestId,
          decision,
          requestDate: notification.requestDate ?? null,
          requestHours: typeof notification.requestHours === 'number' ? notification.requestHours : null,
          requestStartTime: notification.requestStartTime ?? null,
          requestEndTime: notification.requestEndTime ?? null,
          approverId: user.uid,
          approverName: user.displayName ?? user.email ?? null,
          approverRole: userRole ?? null,
        })
      : await applyLeaveDecision({
          requestOwnerId: notification.requestOwnerId,
          requestId: notification.requestId,
          decision,
          requestDate: notification.requestDate ?? null,
          requestFromDate: notification.requestFromDate ?? null,
          requestToDate: notification.requestToDate ?? null,
          requestDayCount: typeof notification.requestDayCount === 'number' ? notification.requestDayCount : null,
          approverId: user.uid,
          approverName: user.displayName ?? user.email ?? null,
          approverRole: userRole ?? null,
        });

  if (!result.status) return;

  const ready = await ensureFirebaseReady();
  if (!ready || !db) return;

  try {
    await db
      .collection('personnel')
      .doc(user.uid)
      .collection('notifications')
      .doc(notification.id)
      .set({ requestStatus: result.status, read: true }, { merge: true });
  } catch (err) {
    console.error('Failed to update request approval notification:', err);
  }
};
