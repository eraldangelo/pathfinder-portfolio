import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin';
import { requireBearerToken, toUnauthorizedResponseFromVerifyError } from '@/app/api/_shared/auth';
import { enforceRateLimit } from '@/app/api/_shared/rateLimit';
import { isExcludedTopStaffReferrerName } from '@/components/dashboard/utils/topStaffReferrersConfig';
import { canAccessDashboardMetricsRole } from '../_shared/authorization';

export const runtime = 'nodejs';
const CACHE_TTL_MS = 60_000;
let cachedResponse:
  | { expiresAtMs: number; data: Array<{ name: string; referrals: number }> }
  | null = null;

const normalize = (value?: string | null) => String(value ?? '').trim().toLowerCase();
const normalizeDisplay = (value?: string | null) => String(value ?? '').trim();

export async function GET(request: Request) {
  const rateLimit = await enforceRateLimit(request, {
    id: 'dashboard-top-staff-referrers',
    windowMs: 60_000,
    max: 60,
    message: 'Too many dashboard ranking requests. Please retry later.',
  });
  if (rateLimit) return rateLimit;

  const auth = requireBearerToken(request);
  if (auth.response) {
    return auth.response;
  }
  const token = auth.token;

  try {
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();
    let decoded: Awaited<ReturnType<typeof adminAuth.verifyIdToken>>;
    try {
      decoded = await adminAuth.verifyIdToken(token);
    } catch (error) {
      const unauthorized = toUnauthorizedResponseFromVerifyError(error);
      if (unauthorized) {
        return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
      }
      throw error;
    }
    const requesterDoc = await adminDb.collection('personnel').doc(decoded.uid).get();
    const requesterRole = requesterDoc.exists ? requesterDoc.data()?.role : null;
    if (!canAccessDashboardMetricsRole(requesterRole) && decoded.admin !== true) {
      return NextResponse.json({ ok: false, error: 'Forbidden.' }, { status: 403 });
    }

    const now = Date.now();
    if (cachedResponse && cachedResponse.expiresAtMs > now) {
      return NextResponse.json({ ok: true, data: cachedResponse.data });
    }

    const snapshot = await adminDb
      .collection('leads')
      .select('referredByStaff', 'referredStaffName', 'referredStaffId', 'isArchived')
      .get();

    const countsByReferrer = new Map<string, { name: string; referrals: number }>();

    snapshot.docs.forEach((doc) => {
      const data = doc.data() || {};
      if (data.isArchived === true) return;

      const referredByStaff = Boolean(data.referredByStaff);
      const referredStaffName = normalizeDisplay(
        typeof data.referredStaffName === 'string' ? data.referredStaffName : ''
      );
      const referredStaffId = normalizeDisplay(
        typeof data.referredStaffId === 'string' ? data.referredStaffId : ''
      );

      if (!referredByStaff && !referredStaffName && !referredStaffId) {
        return;
      }

      const displayName =
        referredStaffName || (referredStaffId ? `Staff ${referredStaffId.slice(0, 6)}` : '');
      if (!displayName) return;
      if (isExcludedTopStaffReferrerName(displayName)) return;

      const key = normalize(displayName);
      const existing = countsByReferrer.get(key);
      if (existing) {
        existing.referrals += 1;
      } else {
        countsByReferrer.set(key, { name: displayName, referrals: 1 });
      }
    });

    const data = [...countsByReferrer.values()].sort((a, b) => {
      if (b.referrals !== a.referrals) return b.referrals - a.referrals;
      return a.name.localeCompare(b.name);
    });

    cachedResponse = {
      data,
      expiresAtMs: now + CACHE_TTL_MS,
    };

    return NextResponse.json({ ok: true, data });
  } catch (error: any) {
    console.error('Failed to build top staff referrers:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to load top staff referrers.' },
      { status: 500 }
    );
  }
}
