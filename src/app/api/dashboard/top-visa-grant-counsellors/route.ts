import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin';
import { requireBearerToken, toUnauthorizedResponseFromVerifyError } from '@/app/api/_shared/auth';
import { enforceRateLimit } from '@/app/api/_shared/rateLimit';
import { canAccessDashboardMetricsRole } from '../_shared/authorization';

export const runtime = 'nodejs';
const CACHE_TTL_MS = 60_000;
let cachedResponse:
  | { expiresAtMs: number; data: Array<{ name: string; grants: number }> }
  | null = null;

const normalize = (value?: string | null) => String(value ?? '').trim().toLowerCase();
const normalizeDisplay = (value?: string | null) => String(value ?? '').trim();
const isLeadOrArchiveApplicationPath = (path: string) =>
  path.startsWith('leads/') || path.startsWith('archives/');
const isLeadOrArchiveLeadPath = (path: string) =>
  path.startsWith('leads/') || path.startsWith('archives/');
const APPLICATION_GRANT_FIELDS = [
  'status',
  'history',
  'assignedCounsellor',
  'assignedCounsellorUid',
  'studentId',
] as const;

const hasGrantedStatus = (application: Record<string, unknown>) => {
  const status = normalize(String(application.status ?? ''));
  if (status.includes('visa granted')) return true;

  const history = Array.isArray(application.history) ? application.history : [];
  return history.some((entry) => {
    const candidate =
      entry && typeof entry === 'object'
        ? normalize(String((entry as { status?: unknown }).status ?? ''))
        : '';
    return candidate.includes('visa granted');
  });
};

export async function GET(request: Request) {
  const rateLimit = await enforceRateLimit(request, {
    id: 'dashboard-top-visa-grant-counsellors',
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

    const [personnelSnapshot, leadSnapshot, applicationsSnapshot] = await Promise.all([
      adminDb.collection('personnel').select('name').get(),
      adminDb.collectionGroup('leads').select('assignedCounsellor', 'assignedCounsellorUid').get(),
      adminDb.collectionGroup('applications').select(...APPLICATION_GRANT_FIELDS).get(),
    ]);

    const personnelNameByUid = new Map<string, string>();
    personnelSnapshot.docs.forEach((doc) => {
      const data = doc.data() || {};
      const uid = normalizeDisplay(doc.id);
      const name = normalizeDisplay(typeof data.name === 'string' ? data.name : '');
      if (uid && name) {
        personnelNameByUid.set(uid, name);
      }
    });

    const leadAssignmentById = new Map<string, { uid: string; name: string }>();
    leadSnapshot.docs.forEach((doc) => {
      const path = String(doc.ref.path ?? '');
      if (!isLeadOrArchiveLeadPath(path)) return;

      const data = doc.data() || {};
      const leadId = normalizeDisplay(doc.id);
      if (!leadId) return;

      const assignedUid = normalizeDisplay(
        typeof data.assignedCounsellorUid === 'string' ? data.assignedCounsellorUid : ''
      );
      const assignedName = normalizeDisplay(
        typeof data.assignedCounsellor === 'string' ? data.assignedCounsellor : ''
      );
      if (!assignedUid && !assignedName) return;
      const existing = leadAssignmentById.get(leadId);
      if (!existing) {
        leadAssignmentById.set(leadId, { uid: assignedUid, name: assignedName });
        return;
      }
      const shouldReplace =
        (!existing.uid && !!assignedUid)
        || (!existing.name && !!assignedName)
        || (path.startsWith('archives/') && !String(existing.uid || existing.name).trim());
      if (shouldReplace) {
        leadAssignmentById.set(leadId, { uid: assignedUid, name: assignedName });
      }
    });

    const countsByCounsellor = new Map<string, { name: string; grants: number }>();

    applicationsSnapshot.docs.forEach((doc) => {
      const path = String(doc.ref.path ?? '');
      if (!isLeadOrArchiveApplicationPath(path)) return;
      const data = (doc.data() || {}) as Record<string, unknown>;
      if (!hasGrantedStatus(data)) return;

      const appAssignedCounsellor = normalizeDisplay(
        typeof data.assignedCounsellor === 'string' ? data.assignedCounsellor : ''
      );
      const appAssignedCounsellorUid = normalizeDisplay(
        typeof data.assignedCounsellorUid === 'string' ? data.assignedCounsellorUid : ''
      );
      const studentId = normalizeDisplay(typeof data.studentId === 'string' ? data.studentId : '');
      const linkedLeadAssignment = studentId ? leadAssignmentById.get(studentId) : undefined;

      const resolvedUid = appAssignedCounsellorUid || linkedLeadAssignment?.uid || '';
      const resolvedName =
        appAssignedCounsellor
        || linkedLeadAssignment?.name
        || (resolvedUid ? personnelNameByUid.get(resolvedUid) ?? '' : '');

      const counsellorName = resolvedName;
      if (!counsellorName) return;

      const key = normalize(counsellorName);
      const existing = countsByCounsellor.get(key);
      if (existing) {
        existing.grants += 1;
      } else {
        countsByCounsellor.set(key, { name: counsellorName, grants: 1 });
      }
    });

    const data = [...countsByCounsellor.values()].sort((a, b) => {
      if (b.grants !== a.grants) return b.grants - a.grants;
      return a.name.localeCompare(b.name);
    });

    cachedResponse = {
      data,
      expiresAtMs: now + CACHE_TTL_MS,
    };

    return NextResponse.json({ ok: true, data });
  } catch (error: any) {
    console.error('Failed to build top visa grant counsellors:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to load top visa grant counsellors.' },
      { status: 500 }
    );
  }
}
