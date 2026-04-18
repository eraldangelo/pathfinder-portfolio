import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin';
import { requireBearerToken, toUnauthorizedResponseFromVerifyError } from '@/app/api/_shared/auth';
import { canDeletePersonnelRole } from './authorization';
import { parseJsonBodyWithSchema } from '@/app/api/_shared/bodyValidation';
import { enforceRateLimit } from '@/app/api/_shared/rateLimit';
import { personnelDeleteBodySchema } from './schema';
import { deletePersonnelIdentity } from './deletePersonnel';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const rateLimit = await enforceRateLimit(request, {
    id: 'personnel-delete',
    windowMs: 60_000,
    max: 8,
  });
  if (rateLimit) return rateLimit;

  const auth = requireBearerToken(request);
  if (auth.response) {
    return auth.response;
  }
  const token = auth.token;

  const payload = await parseJsonBodyWithSchema(request, personnelDeleteBodySchema, {
    maxBytes: 4 * 1024,
    invalidMessage: 'Invalid payload. Missing target uid.',
    tooLargeMessage: 'Personnel delete payload is too large.',
  });
  if (payload.response) {
    return payload.response;
  }
  const targetUid = payload.data?.uid ?? '';

  try {
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();

    let decoded: Awaited<ReturnType<typeof adminAuth.verifyIdToken>>;
    try {
      decoded = await adminAuth.verifyIdToken(token);
    } catch (error) {
      const unauthorized = toUnauthorizedResponseFromVerifyError(error);
      if (unauthorized) return unauthorized;
      throw error;
    }

    const requesterUid = decoded.uid;
    const requesterDoc = await adminDb.collection('personnel').doc(requesterUid).get();
    const requesterRole = requesterDoc.exists ? requesterDoc.data()?.role : null;

    if (!canDeletePersonnelRole(requesterRole)) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const deleteResult = await deletePersonnelIdentity({
      adminAuth,
      adminDb,
      targetUid,
      requestedByUid: requesterUid,
    });

    if (!deleteResult.ok) {
      const reason = 'reason' in deleteResult ? deleteResult.reason : 'unknown';
      const failure = 'error' in deleteResult ? deleteResult.error : null;
      console.error('Failed to delete personnel identity:', reason, failure);
      return NextResponse.json({ error: 'Failed to delete personnel.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Failed to delete personnel:', error);
    return NextResponse.json({ error: 'Failed to delete personnel.' }, { status: 500 });
  }
}
