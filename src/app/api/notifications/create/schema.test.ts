import assert from 'node:assert/strict';
import test from 'node:test';
import { notificationCreateBodySchema } from './schema';

test('notificationCreateBodySchema accepts valid payloads', () => {
  const parsed = notificationCreateBodySchema.safeParse({
    notifications: [
      {
        recipientUid: 'uid-1',
        message: 'Hello world',
        data: {
          eventKey: 'applicationSubmitted',
          requestHours: 3,
          requestDayCount: 2,
        },
      },
    ],
  });

  assert.equal(parsed.success, true);
});

test('notificationCreateBodySchema rejects too many notifications', () => {
  const notifications = Array.from({ length: 101 }).map((_, index) => ({
    recipientUid: `uid-${index}`,
    message: `Message ${index}`,
  }));

  const parsed = notificationCreateBodySchema.safeParse({ notifications });
  assert.equal(parsed.success, false);
});

test('notificationCreateBodySchema rejects unsupported metadata value types', () => {
  const parsed = notificationCreateBodySchema.safeParse({
    notifications: [
      {
        recipientUid: 'uid-1',
        message: 'Hello world',
        data: {
          invalid: { nested: true },
        },
      },
    ],
  });

  assert.equal(parsed.success, false);
});

test('notificationCreateBodySchema rejects unsupported metadata keys', () => {
  const parsed = notificationCreateBodySchema.safeParse({
    notifications: [
      {
        recipientUid: 'uid-1',
        message: 'Hello world',
        data: {
          unknownKey: 'value',
        },
      },
    ],
  });

  assert.equal(parsed.success, false);
});

test('notificationCreateBodySchema rejects unsupported event keys', () => {
  const parsed = notificationCreateBodySchema.safeParse({
    notifications: [
      {
        recipientUid: 'uid-1',
        message: 'Hello world',
        data: {
          eventKey: 'unknownEvent',
        },
      },
    ],
  });

  assert.equal(parsed.success, false);
});
