import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin';
import { requireBearerToken, toUnauthorizedResponseFromVerifyError } from '@/app/api/_shared/auth';
import { parseJsonBodyWithSchema } from '@/app/api/_shared/bodyValidation';
import { enforceRateLimit } from '@/app/api/_shared/rateLimit';
import { forcePasswordResetBodySchema } from './schema';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const auth = requireBearerToken(request, { trim: true });
  if (auth.response) return auth.response;

  const payload = await parseJsonBodyWithSchema(request, forcePasswordResetBodySchema, {
    maxBytes: 4 * 1024,
    invalidMessage: 'Invalid password reset payload.',
    tooLargeMessage: 'Password reset payload is too large.',
  });
  if (payload.response) return payload.response;
  if (!payload.data) {
    return NextResponse.json({ error: 'Invalid password reset payload.' }, { status: 400 });
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

    const rateLimit = await enforceRateLimit(request, {
      id: 'personnel-force-password-reset',
      windowMs: 60_000,
      max: 6,
      subject: requesterUid,
    });
    if (rateLimit) return rateLimit;

    const personnelRef = adminDb.collection('personnel').doc(requesterUid);
    const personnelSnap = await personnelRef.get();
    if (!personnelSnap.exists) {
      return NextResponse.json({ error: 'Personnel record not found.' }, { status: 404 });
    }

    const personnelData = personnelSnap.data() || {};
    if (personnelData.passwordNeedsReset !== true) {
      return NextResponse.json({ error: 'Password reset is not required.' }, { status: 409 });
    }

    await adminAuth.updateUser(requesterUid, { password: payload.data.password });
    await personnelRef.set(
      {
        passwordNeedsReset: false,
        updatedAt: new Date(),
      },
      { merge: true },
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to force-reset password:', error);
    return NextResponse.json({ error: 'Failed to reset password.' }, { status: 500 });
  }
}
