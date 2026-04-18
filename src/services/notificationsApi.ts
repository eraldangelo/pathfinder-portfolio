import { auth, ensureFirebaseReady } from './firebase';

export type NotificationDataValue = string | number | boolean | null;

export interface NotificationDispatchPayload {
  recipientUid: string;
  message: string;
  data?: Record<string, NotificationDataValue>;
}

const MAX_NOTIFICATIONS_PER_REQUEST = 100;

const chunk = <T>(values: T[], size: number) => {
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
};

const normalizePayload = (payload: NotificationDispatchPayload) => {
  return {
    recipientUid: String(payload.recipientUid || '').trim(),
    message: String(payload.message || '').trim(),
    data: payload.data || undefined,
  };
};

export const dispatchNotifications = async (payloads: NotificationDispatchPayload[]) => {
  if (!Array.isArray(payloads) || payloads.length === 0) {
    return { ok: true, sent: 0 };
  }

  const cleaned = payloads
    .map(normalizePayload)
    .filter((item) => item.recipientUid && item.message);

  if (!cleaned.length) {
    return { ok: true, sent: 0 };
  }

  const ready = await ensureFirebaseReady();
  if (!ready || !auth?.currentUser) {
    throw new Error('Firebase auth is not ready for notification dispatch.');
  }

  const token = await auth.currentUser.getIdToken();
  let sent = 0;
  const groups = chunk(cleaned, MAX_NOTIFICATIONS_PER_REQUEST);
  for (const notifications of groups) {
    const response = await fetch('/api/notifications/create', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ notifications }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const reason = typeof body?.error === 'string' ? body.error : 'Failed to create notifications.';
      throw new Error(reason);
    }

    const result = await response.json().catch(() => ({}));
    const chunkSent = typeof result?.sent === 'number' && Number.isFinite(result.sent) ? result.sent : notifications.length;
    sent += chunkSent;
  }

  return { ok: true, sent };
};

