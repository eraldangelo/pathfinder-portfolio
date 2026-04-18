import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin';
import { requireBearerToken, toUnauthorizedResponseFromVerifyError } from '@/app/api/_shared/auth';
import { enforceRateLimit } from '@/app/api/_shared/rateLimit';
import { resolveLeaveState } from '@/utils/leave';
import { getOffsetResetYear, resolveOffsetState } from '@/utils/offset';

export const runtime = 'nodejs';

const parseApprovedRequestYear = (dateKey: unknown) => {
  if (typeof dateKey !== 'string') return null;
  const match = /^(\d{4})-\d{2}-\d{2}$/.exec(dateKey.trim());
  if (!match) return null;
  const year = Number(match[1]);
  return Number.isFinite(year) ? year : null;
};

const toFiniteNumberOrNull = (value: unknown) => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const computeOffsetBalancesFromApprovedRequests = async ({
  adminDb,
  uid,
  currentYear,
}: {
  adminDb: FirebaseFirestore.Firestore;
  uid: string;
  currentYear: number;
}) => {
  const snapshot = await adminDb
    .collection('personnel')
    .doc(uid)
    .collection('offsetRequests')
    .where('status', '==', 'approved')
    .get();

  let addMinutes = 0;
  let useMinutes = 0;

  snapshot.docs.forEach((doc) => {
    const data = doc.data() || {};
    const requestYear = parseApprovedRequestYear(data.date);
    if (requestYear !== currentYear) return;

    const rawHours = toFiniteNumberOrNull(data.hours);
    if (rawHours === null || rawHours <= 0) return;

    const minutes = Math.round(rawHours * 60);
    if (String(data.mode || '').trim().toLowerCase() === 'use') {
      useMinutes += minutes;
      return;
    }
    addMinutes += minutes;
  });

  return {
    balance: Math.max(0, addMinutes - useMinutes) / 60,
    used: Math.max(0, useMinutes) / 60,
  };
};

export async function POST(request: Request) {
  const rateLimit = await enforceRateLimit(request, {
    id: 'personnel-sync-balances',
    windowMs: 60_000,
    max: 30,
    message: 'Too many balance sync requests. Please retry later.',
  });
  if (rateLimit) return rateLimit;

  const auth = requireBearerToken(request, { trim: true });
  if (auth.response) return auth.response;

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

    const personnelRef = adminDb.collection('personnel').doc(requesterUid);
    const personnelSnap = await personnelRef.get();
    if (!personnelSnap.exists) {
      return NextResponse.json({ error: 'Personnel record not found.' }, { status: 404 });
    }

    const personnelData = personnelSnap.data() || {};
    const currentOffsetYear = getOffsetResetYear();
    const hasFiniteOffsetBalance = toFiniteNumberOrNull(personnelData.offsetBalance) !== null;
    const hasFiniteOffsetUsed = toFiniteNumberOrNull(personnelData.offsetUsed) !== null;
    const needsOffsetBackfill = !hasFiniteOffsetBalance || !hasFiniteOffsetUsed;

    const backfilledOffset = needsOffsetBackfill
      ? await computeOffsetBalancesFromApprovedRequests({
          adminDb,
          uid: requesterUid,
          currentYear: currentOffsetYear,
        })
      : null;

    const leaveState = resolveLeaveState({
      balance: personnelData.leaveBalance,
      used: personnelData.leaveUsed,
      accruedMonthKey: personnelData.leaveAccruedMonth,
    });
    const offsetState = resolveOffsetState({
      balance: backfilledOffset ? backfilledOffset.balance : personnelData.offsetBalance,
      used: backfilledOffset ? backfilledOffset.used : personnelData.offsetUsed,
      resetYear: personnelData.offsetResetYear,
      currentYear: currentOffsetYear,
    });

    const updates: Record<string, unknown> = {};
    if (leaveState.shouldPersist) {
      updates.leaveBalance = leaveState.balance;
      updates.leaveUsed = leaveState.used;
      updates.leaveAccruedMonth = leaveState.accruedMonthKey;
    }
    if (offsetState.shouldPersist || needsOffsetBackfill) {
      updates.offsetBalance = offsetState.balance;
      updates.offsetUsed = offsetState.used;
      updates.offsetResetYear = offsetState.resetYear;
    }

    const shouldPersist = Object.keys(updates).length > 0;
    if (shouldPersist) {
      updates.updatedAt = new Date();
      await personnelRef.set(updates, { merge: true });
    }

    return NextResponse.json({
      ok: true,
      synchronized: shouldPersist,
      values: {
        leaveBalance: leaveState.balance,
        leaveUsed: leaveState.used,
        leaveAccruedMonth: leaveState.accruedMonthKey,
        offsetBalance: offsetState.balance,
        offsetUsed: offsetState.used,
        offsetResetYear: offsetState.resetYear,
      },
    });
  } catch (error: any) {
    console.error('Failed to sync personnel balances:', error);
    return NextResponse.json({ error: 'Failed to sync balances.' }, { status: 500 });
  }
}
