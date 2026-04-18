import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin';
import { requireBearerToken, toUnauthorizedResponseFromVerifyError } from '@/app/api/_shared/auth';
import { enforceRateLimit } from '@/app/api/_shared/rateLimit';
import { parseJsonBodyWithSchema } from '@/app/api/_shared/bodyValidation';
import { DEFAULT_SSO_CONTINUE_PATH, buildStudyNaviLoginUrl, parseStudyNaviBaseUrl } from './utils';
import { studyNaviSsoBodySchema } from './schema';
import { buildStudyNaviSsoClaims } from './claims';

export const runtime = 'nodejs';

export async function POST(request: Request) {
    const rateLimit = await enforceRateLimit(request, {
        id: 'studynavi-sso',
        windowMs: 60_000,
        max: 30,
        message: 'Too many SSO requests. Please retry later.',
    });
    if (rateLimit) return rateLimit;

    const auth = requireBearerToken(request, { trim: true });
    if (auth.response) {
        return auth.response;
    }
    const idToken = auth.token;

    const studyNaviBaseUrl = parseStudyNaviBaseUrl();
    if (!studyNaviBaseUrl) {
        return NextResponse.json(
            { error: 'StudyNavi URL is not configured. Set STUDYNAVI_URL in environment variables.' },
            { status: 500 }
        );
    }

    const payload = await parseJsonBodyWithSchema(request, studyNaviSsoBodySchema, {
        maxBytes: 8 * 1024,
        invalidMessage: 'Invalid SSO payload.',
        tooLargeMessage: 'SSO request payload is too large.',
        allowEmptyObject: true,
    });
    if (payload.response) {
        return payload.response;
    }
    const continueTo: unknown = payload.data?.continueTo ?? DEFAULT_SSO_CONTINUE_PATH;

    try {
        const adminAuth = getAdminAuth();
        const adminDb = getAdminDb();
        let decoded: Awaited<ReturnType<typeof adminAuth.verifyIdToken>>;
        try {
            decoded = await adminAuth.verifyIdToken(idToken);
        } catch (error) {
            const unauthorized = toUnauthorizedResponseFromVerifyError(error);
            if (unauthorized) return unauthorized;
            throw error;
        }
        let personnelRole: string | null = null;
        try {
            const requesterDoc = await adminDb.collection('personnel').doc(decoded.uid).get();
            if (requesterDoc.exists) {
                const value = requesterDoc.data()?.role;
                personnelRole = typeof value === 'string' ? value : null;
            }
        } catch (error) {
            console.warn('[studynavi-sso] unable to resolve Pathfinder personnel role for SSO claims', error);
        }

        const ssoClaims = buildStudyNaviSsoClaims({
            admin: decoded.admin,
            staff: decoded.staff,
            support: decoded.support,
            personnelRole,
        });
        const customToken = await adminAuth.createCustomToken(decoded.uid, ssoClaims);

        return NextResponse.json({
            ok: true,
            url: buildStudyNaviLoginUrl({
                baseUrl: studyNaviBaseUrl,
                continueTo,
                source: 'pathfinder',
                ssoToken: customToken,
            }),
        });
    } catch (error: any) {
        console.error('Failed to create StudyNavi SSO redirect:', error);
        return NextResponse.json({ error: 'Unable to create StudyNavi login session.' }, { status: 500 });
    }
}
