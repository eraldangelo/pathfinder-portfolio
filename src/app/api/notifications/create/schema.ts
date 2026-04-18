import { z } from 'zod';

export const allowedNotificationEventKeys = [
  'newSubmission',
  'leadEndorsed',
  'applicationSubmitted',
  'applicationMilestone',
  'leaveRequest',
  'offsetRequest',
  'leaveDecision',
  'offsetDecision',
  'timeIn',
  'lunchStart',
  'lunchEnd',
  'timeOut',
] as const;

const allowedNotificationMetadataKeys = new Set([
  'eventKey',
  'requestId',
  'requestOwnerId',
  'requestStatus',
  'requestType',
  'requestDate',
  'requestFromDate',
  'requestToDate',
  'requestDayCount',
  'requestReason',
  'requestHours',
  'requestMode',
  'requestStartTime',
  'requestEndTime',
  'requesterName',
  'requesterBranch',
  'requesterRole',
  'approverName',
  'approverRole',
  'applicantId',
  'applicantName',
  'applicationId',
  'applicationStatus',
  'createdBy',
  'branch',
  'role',
  'eventTime',
  'actorName',
  'actorRole',
  'actorBranch',
]);

const notificationMetadataValueSchema = z.union([
  z.string().trim().min(1).max(2000),
  z.number().finite(),
  z.boolean(),
  z.null(),
]);

const notificationMetadataSchema = z
  .record(z.string().trim().min(1).max(64), notificationMetadataValueSchema)
  .superRefine((value, ctx) => {
    const keys = Object.keys(value);
    if (keys.length > 40) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Notification metadata has too many fields.',
      });
      return;
    }

    keys.forEach((key) => {
      if (!allowedNotificationMetadataKeys.has(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: 'Unsupported notification metadata key.',
        });
      }
    });

    const eventKeyValue = value.eventKey;
    if (
      typeof eventKeyValue === 'string' &&
      !allowedNotificationEventKeys.includes(eventKeyValue as (typeof allowedNotificationEventKeys)[number])
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['eventKey'],
        message: 'Unsupported notification event key.',
      });
    }
  });

export const notificationCreateBodySchema = z.object({
  notifications: z
    .array(
      z.object({
        recipientUid: z.string().trim().min(1).max(128),
        message: z.string().trim().min(1).max(2000),
        data: notificationMetadataSchema.optional(),
      }),
    )
    .min(1)
    .max(100),
});

export type NotificationCreateBody = z.infer<typeof notificationCreateBodySchema>;
