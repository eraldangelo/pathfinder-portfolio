import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin';
import { requireBearerToken, toUnauthorizedResponseFromVerifyError } from '@/app/api/_shared/auth';
import { parseJsonBodyWithSchema } from '@/app/api/_shared/bodyValidation';
import { enforceRateLimit } from '@/app/api/_shared/rateLimit';
import { canCreateCrossUserNotificationsRole } from './authorization';
import { allowedNotificationEventKeys, notificationCreateBodySchema, type NotificationCreateBody } from './schema';

export const runtime = 'nodejs';

const isAdminPhReadonlyEmail = (value?: string | null) =>
  String(value || '').trim().toLowerCase() === 'admin_ph@example.com';

const isReservedKey = (key: string) =>
  key === 'message' || key === 'read' || key === 'createdAt' || key === 'createdByUid';

type NotificationWrite = {
  recipientUid: string;
  message: string;
  data: Record<string, string | number | boolean | null>;
};

type RequesterContext = {
  uid: string;
  name: string | null;
  role: string | null;
  branch: string | null;
};

const sanitizeNotificationData = (data?: Record<string, string | number | boolean | null>) => {
  if (!data) return {};
  const cleaned: Record<string, string | number | boolean | null> = {};
  Object.entries(data).forEach(([rawKey, value]) => {
    const key = rawKey.trim();
    if (!key || isReservedKey(key)) return;
    cleaned[key] = value;
  });
  return cleaned;
};

const mapPayloads = (payload: NotificationCreateBody) => {
  return payload.notifications.map((entry) => ({
    recipientUid: entry.recipientUid.trim(),
    message: entry.message.trim(),
    data: sanitizeNotificationData(entry.data),
  }));
};

const deduplicateWrites = (writes: NotificationWrite[]) => {
  const seen = new Set<string>();
  const deduped: NotificationWrite[] = [];
  writes.forEach((entry) => {
    const signature = `${entry.recipientUid}|${entry.message}|${JSON.stringify(entry.data)}`;
    if (seen.has(signature)) return;
    seen.add(signature);
    deduped.push(entry);
  });
  return deduped;
};

const canonicalizeData = (
  data: Record<string, string | number | boolean | null>,
  requester: RequesterContext,
) => {
  const canonical = { ...data };
  const eventKey = typeof canonical.eventKey === 'string' ? canonical.eventKey.trim() : '';
  if (eventKey && !allowedNotificationEventKeys.includes(eventKey as (typeof allowedNotificationEventKeys)[number])) {
    return null;
  }

  canonical.createdBy = requester.uid;
  canonical.createdByUid = requester.uid;

  if (requester.name) {
    if (Object.prototype.hasOwnProperty.call(canonical, 'requesterName')) canonical.requesterName = requester.name;
    if (Object.prototype.hasOwnProperty.call(canonical, 'actorName')) canonical.actorName = requester.name;
    if (Object.prototype.hasOwnProperty.call(canonical, 'approverName')) canonical.approverName = requester.name;
  }
  if (requester.role) {
    if (Object.prototype.hasOwnProperty.call(canonical, 'requesterRole')) canonical.requesterRole = requester.role;
    if (Object.prototype.hasOwnProperty.call(canonical, 'actorRole')) canonical.actorRole = requester.role;
    if (Object.prototype.hasOwnProperty.call(canonical, 'approverRole')) canonical.approverRole = requester.role;
    if (Object.prototype.hasOwnProperty.call(canonical, 'role')) canonical.role = requester.role;
  }
  if (requester.branch) {
    if (Object.prototype.hasOwnProperty.call(canonical, 'requesterBranch')) canonical.requesterBranch = requester.branch;
    if (Object.prototype.hasOwnProperty.call(canonical, 'actorBranch')) canonical.actorBranch = requester.branch;
    if (Object.prototype.hasOwnProperty.call(canonical, 'branch')) canonical.branch = requester.branch;
  }

  return canonical;
};

const canonicalizeWrites = (writes: NotificationWrite[], requester: RequesterContext): NotificationWrite[] => {
  const canonicalized: NotificationWrite[] = [];
  writes.forEach((entry) => {
    const canonicalData = canonicalizeData(entry.data, requester);
    if (!canonicalData) return;
    canonicalized.push({
      ...entry,
      data: canonicalData,
    });
  });
  return canonicalized;
};

const filterExistingRecipients = async (
  adminDb: FirebaseFirestore.Firestore,
  writes: NotificationWrite[],
) => {
  const uniqueRecipientUids = Array.from(new Set(writes.map((entry) => entry.recipientUid)));
  if (!uniqueRecipientUids.length) return [] as typeof writes;

  const recipientRefs = uniqueRecipientUids.map((uid) => adminDb.collection('personnel').doc(uid));
  const recipientSnaps = await adminDb.getAll(...recipientRefs);
  const existingRecipients = new Set(recipientSnaps.filter((snap) => snap.exists).map((snap) => snap.id));
  return writes.filter((entry) => existingRecipients.has(entry.recipientUid));
};

export async function POST(request: Request) {
  const rateLimit = await enforceRateLimit(request, {
    id: 'notifications-create',
    windowMs: 60_000,
    max: 60,
    message: 'Too many notification requests. Please retry later.',
  });
  if (rateLimit) return rateLimit;

  const auth = requireBearerToken(request, { trim: true });
  if (auth.response) return auth.response;

  const payload = await parseJsonBodyWithSchema(request, notificationCreateBodySchema, {
    maxBytes: 64 * 1024,
    invalidMessage: 'Invalid notification payload.',
    tooLargeMessage: 'Notification payload is too large.',
  });
  if (payload.response) return payload.response;
  if (!payload.data) {
    return NextResponse.json({ error: 'Invalid notification payload.' }, { status: 400 });
  }

  try {
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();
    let decoded: Awaited<ReturnType<typeof adminAuth.verifyIdToken>>;
    try {
      decoded = await adminAuth.verifyIdToken(auth.token);
    } catch (error) {
      const unauthorized = toUnauthorizedResponseFromVerifyError(error);
      if (unauthorized) return unauthorized;
      throw error;
    }
    const requesterUid = String(decoded.uid || '').trim();
    if (!requesterUid) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    if (isAdminPhReadonlyEmail(decoded.email || null)) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const requesterDoc = await adminDb.collection('personnel').doc(requesterUid).get();
    if (!requesterDoc.exists && decoded.admin !== true) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }
    const requesterRole = requesterDoc.exists ? requesterDoc.data()?.role : null;
    const hasAdminClaim = decoded.admin === true;
    if (!hasAdminClaim && !canCreateCrossUserNotificationsRole(requesterRole)) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }
    const requesterName = requesterDoc.exists
      ? String(requesterDoc.data()?.name || '').trim() || null
      : String(decoded.name || decoded.email || '').trim() || null;
    const requesterBranch = requesterDoc.exists
      ? String(requesterDoc.data()?.branch || '').trim() || null
      : null;
    const requesterRoleNormalized = requesterRole ? String(requesterRole).trim() : null;
    const requesterContext: RequesterContext = {
      uid: requesterUid,
      name: requesterName,
      role: requesterRoleNormalized,
      branch: requesterBranch,
    };

    const notifications = mapPayloads(payload.data);
    const candidateWrites = canonicalizeWrites(
      deduplicateWrites(
      notifications.filter((entry) => entry.recipientUid && entry.message),
      ),
      requesterContext,
    );
    if (!candidateWrites.length) {
      return NextResponse.json({ error: 'Invalid notification payload.' }, { status: 400 });
    }

    const writes = await filterExistingRecipients(adminDb, candidateWrites);
    if (!writes.length) {
      return NextResponse.json({ error: 'No valid recipients found.' }, { status: 400 });
    }

    const batch = adminDb.batch();
    const now = new Date();
    writes.forEach((entry) => {
      const docRef = adminDb.collection('personnel').doc(entry.recipientUid).collection('notifications').doc();
      batch.set(docRef, {
        message: entry.message,
        createdAt: now,
        read: false,
        ...entry.data,
      });
    });

    await batch.commit();
    return NextResponse.json({
      ok: true,
      sent: writes.length,
      skippedRecipients: candidateWrites.length - writes.length,
    });
  } catch (error) {
    console.error('Failed to create notifications:', error);
    return NextResponse.json({ error: 'Failed to create notifications.' }, { status: 500 });
  }
}
