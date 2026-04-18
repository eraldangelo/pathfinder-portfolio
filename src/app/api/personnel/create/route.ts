import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin';
import { requireBearerToken, toUnauthorizedResponseFromVerifyError } from '@/app/api/_shared/auth';
import { parseJsonBodyWithSchema } from '@/app/api/_shared/bodyValidation';
import { enforceRateLimit } from '@/app/api/_shared/rateLimit';
import { canCreatePersonnelRole } from './authorization';
import { personnelCreateBodySchema } from './schema';

export const runtime = 'nodejs';

const normalizeEmail = (value: string) => value.trim().toLowerCase();
const normalizeValue = (value: string) => value.trim().toLowerCase();

const normalizeApprovalBranchKey = (branch: string) => {
  const normalized = normalizeValue(branch);
  if (!normalized) return '';
  if (normalized.includes('makati') || normalized.includes('manila')) return 'manila';
  if (normalized.includes('davao')) return 'davao';
  if (normalized.includes('cebu')) return 'cebu';
  if (normalized.includes('pampanga')) return 'pampanga';
  return '';
};

const normalizeApprovalRoleKey = (role: string) => {
  const normalized = normalizeValue(role);
  if (!normalized) return '';
  if (normalized === 'operations') return 'operations';
  if (normalized === 'branch manager') return 'branch manager';
  if (normalized === 'developer' || normalized.startsWith('developer (')) return 'developer';
  return '';
};

export async function POST(request: Request) {
  const rateLimit = await enforceRateLimit(request, {
    id: 'personnel-create',
    windowMs: 60_000,
    max: 8,
  });
  if (rateLimit) return rateLimit;

  const auth = requireBearerToken(request);
  if (auth.response) {
    return auth.response;
  }

  const payload = await parseJsonBodyWithSchema(request, personnelCreateBodySchema, {
    maxBytes: 8 * 1024,
    invalidMessage: 'Invalid payload. Missing required personnel fields.',
    tooLargeMessage: 'Personnel create payload is too large.',
  });
  if (payload.response) {
    return payload.response;
  }
  if (!payload.data) {
    return NextResponse.json({ error: 'Invalid payload. Missing required personnel fields.' }, { status: 400 });
  }

  const firstName = payload.data.firstName.trim();
  const lastName = payload.data.lastName.trim();
  const preferredName = payload.data.preferredName.trim();
  const email = normalizeEmail(payload.data.email);
  const role = payload.data.role.trim();
  const branch = payload.data.branch.trim();
  const approvalRoleKey = normalizeApprovalRoleKey(role);
  const approvalBranchKey = normalizeApprovalBranchKey(branch);
  const canApproveBranchChange =
    approvalRoleKey === 'operations'
    || approvalRoleKey === 'branch manager'
    || approvalRoleKey === 'developer';
  const displayName = `${firstName} ${lastName}`.trim();

  const adminAuth = getAdminAuth();
  const adminDb = getAdminDb();

  let requesterRole: string | null = null;
  try {
    const decoded = await adminAuth.verifyIdToken(auth.token);
    const requesterDoc = await adminDb.collection('personnel').doc(decoded.uid).get();
    requesterRole = requesterDoc.exists ? requesterDoc.data()?.role : null;
  } catch (error) {
    const unauthorized = toUnauthorizedResponseFromVerifyError(error);
    if (unauthorized) return unauthorized;
    console.error('Failed to authorize personnel create request:', error);
    return NextResponse.json({ error: 'Failed to authorize personnel create request.' }, { status: 500 });
  }

  if (!canCreatePersonnelRole(requesterRole)) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }

  let createdUid: string | null = null;

  try {
    const createdUser = await adminAuth.createUser({
      email,
      password: payload.data.password,
      displayName,
    });
    createdUid = createdUser.uid;

    await adminDb.collection('personnel').doc(createdUser.uid).set({
      name: displayName,
      firstName,
      lastName,
      preferredName: preferredName || null,
      email,
      branch,
      role,
      approvalRoleKey,
      approvalBranchKey,
      canApproveBranchChange,
      isActive: true,
      dob: null,
      photoURL: null,
      passwordNeedsReset: true,
    });

    return NextResponse.json({ ok: true, uid: createdUser.uid });
  } catch (error: any) {
    if (createdUid) {
      try {
        await adminAuth.deleteUser(createdUid);
      } catch (rollbackError) {
        console.error('Failed to rollback created auth user:', rollbackError);
      }
    }

    const code = String(error?.code || '').trim();
    if (code === 'auth/email-already-exists') {
      return NextResponse.json({ error: 'Email already in use.' }, { status: 409 });
    }
    if (code === 'auth/invalid-password' || code === 'auth/weak-password') {
      return NextResponse.json({ error: 'Password should be at least 8 characters.' }, { status: 400 });
    }
    if (code === 'auth/invalid-email') {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
    }

    console.error('Failed to create personnel:', error);
    return NextResponse.json({ error: 'Failed to create personnel.' }, { status: 500 });
  }
}
