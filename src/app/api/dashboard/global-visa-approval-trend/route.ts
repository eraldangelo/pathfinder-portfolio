import { NextResponse } from 'next/server';
import { requireBearerToken, toUnauthorizedResponseFromVerifyError } from '@/app/api/_shared/auth';
import { enforceRateLimit } from '@/app/api/_shared/rateLimit';
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin';
import type { ApplicationInfo } from '@/data/applications';
import { buildTrendData } from '@/components/dashboard/hooks/metrics/trendMetrics';
import { canAccessDashboardMetricsRole } from '../_shared/authorization';

export const runtime = 'nodejs';
const CACHE_TTL_MS = 60_000;
let cachedResponse:
  | { expiresAtMs: number; data: ReturnType<typeof buildTrendData> }
  | null = null;

const getTimestampMillis = (value: unknown) => {
  if (!value) return 0;
  if (typeof (value as { toMillis?: () => number }).toMillis === 'function') {
    return (value as { toMillis: () => number }).toMillis();
  }
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
  }
  if (typeof (value as { toDate?: () => Date }).toDate === 'function') {
    const parsed = (value as { toDate: () => Date }).toDate();
    return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
  }
  return 0;
};

const isLeadOrArchiveApplicationPath = (path: string) =>
  path.startsWith('leads/') || path.startsWith('archives/');
const APPLICATION_TREND_FIELDS = [
  'studentId',
  'status',
  'statusChanged',
  'history',
  'isArchived',
  'branch',
  'country',
  'destinationCountry',
  'schoolCourses',
  'citizenship',
] as const;

export async function GET(request: Request) {
  const rateLimit = await enforceRateLimit(request, {
    id: 'dashboard-global-visa-approval-trend',
    windowMs: 60_000,
    max: 60,
    message: 'Too many dashboard trend requests. Please retry later.',
  });
  if (rateLimit) return rateLimit;

  const auth = requireBearerToken(request);
  if (auth.response) {
    return auth.response;
  }

  try {
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();
    let decoded: Awaited<ReturnType<typeof adminAuth.verifyIdToken>>;
    try {
      decoded = await adminAuth.verifyIdToken(auth.token);
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

    const snapshot = await adminDb.collectionGroup('applications').select(...APPLICATION_TREND_FIELDS).get();

    const dedupedByKey = new Map<string, any>();
    snapshot.docs.forEach((doc) => {
      const path = String(doc.ref?.path ?? '');
      if (!isLeadOrArchiveApplicationPath(path)) return;

      const data = doc.data?.() || {};
      if (data?.isArchived === true) return;

      const key = `${String(data.studentId || '').trim()}::${String(doc.id || '').trim()}`;
      const existing = dedupedByKey.get(key);
      if (!existing) {
        dedupedByKey.set(key, doc);
        return;
      }

      const incomingPath = String(doc.ref?.path ?? '').trim();
      const existingPath = String(existing.ref?.path ?? '').trim();
      const incomingIsArchive = incomingPath.startsWith('archives/');
      const existingIsArchive = existingPath.startsWith('archives/');

      if (incomingIsArchive && !existingIsArchive) {
        dedupedByKey.set(key, doc);
        return;
      }

      if (incomingIsArchive === existingIsArchive) {
        const existingData = existing.data?.() || {};
        const incomingLatestMillis =
          getTimestampMillis(data.statusChanged)
          || getTimestampMillis(Array.isArray(data.history) ? data.history[0]?.date : null);
        const existingLatestMillis =
          getTimestampMillis(existingData.statusChanged)
          || getTimestampMillis(Array.isArray(existingData.history) ? existingData.history[0]?.date : null);
        if (incomingLatestMillis > existingLatestMillis) {
          dedupedByKey.set(key, doc);
        }
      }
    });

    const applications = Array.from(dedupedByKey.values()).map((doc) => {
      const data = (doc.data?.() || {}) as Partial<ApplicationInfo> & { history?: ApplicationInfo['history'] };
      const normalizedHistory = Array.isArray(data.history)
        ? [...data.history].sort((a, b) => getTimestampMillis(b?.date) - getTimestampMillis(a?.date))
        : [];
      const latestHistoryEntry = normalizedHistory[0];
      const status = String(data.status || latestHistoryEntry?.status || 'Submitted Application').trim();
      const statusChanged = data.statusChanged || latestHistoryEntry?.date || null;

      return {
        ...data,
        id: doc.id,
        status: status as ApplicationInfo['status'],
        statusChanged: statusChanged as ApplicationInfo['statusChanged'],
        history: normalizedHistory,
      } as ApplicationInfo;
    });

    const data = buildTrendData(applications);
    cachedResponse = {
      data,
      expiresAtMs: now + CACHE_TTL_MS,
    };

    return NextResponse.json({ ok: true, data });
  } catch (error: any) {
    console.error('Failed to build global visa approval trend:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to load global visa approval trend.' },
      { status: 500 },
    );
  }
}
