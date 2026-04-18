import React from 'react';
import type { NotificationRecord } from './notificationUtils';
import {
  BackToWorkIcon,
  LeaveApprovedIcon,
  LeaveRejectedIcon,
  LeaveSubmittedIcon,
  LunchStartIcon,
  NewSubmissionIcon,
  TimeInIcon,
  TimeOutIcon,
} from '../components/NotificationIcons';

export const deriveRequestStatus = (notification: NotificationRecord) => {
  if (notification.requestStatus) return notification.requestStatus;
  const normalized = notification.message.toLowerCase();
  if (normalized.includes('failed')) return 'failed';
  if (normalized.includes('approved')) return 'approved';
  if (normalized.includes('rejected')) return 'rejected';
  return 'pending';
};

export const renderNotificationIcon = (
  eventKey: string | null,
  requestStatus?: string | null,
  sizeClass = 'w-10 h-10'
) => {
  const props = { className: sizeClass };

  if (requestStatus === 'failed') {
    return <LeaveRejectedIcon {...props} />;
  }
  if (eventKey === 'newSubmission' || eventKey === 'leadEndorsed' || eventKey === 'applicationMilestone') {
    return <NewSubmissionIcon {...props} />;
  }
  if (eventKey === 'leaveRequest' || eventKey === 'offsetRequest') {
    if (requestStatus === 'approved') return <LeaveApprovedIcon {...props} />;
    if (requestStatus === 'rejected') return <LeaveRejectedIcon {...props} />;
    return <LeaveSubmittedIcon {...props} />;
  }
  if (eventKey === 'leaveDecision' || eventKey === 'offsetDecision') {
    if (requestStatus === 'approved') return <LeaveApprovedIcon {...props} />;
    if (requestStatus === 'rejected') return <LeaveRejectedIcon {...props} />;
    return <LeaveSubmittedIcon {...props} />;
  }
  if (eventKey === 'lunchStart') return <LunchStartIcon {...props} />;
  if (eventKey === 'lunchEnd') return <BackToWorkIcon {...props} />;
  if (eventKey === 'timeOut') return <TimeOutIcon {...props} />;
  return <TimeInIcon {...props} />;
};
