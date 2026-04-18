import assert from 'node:assert/strict';
import test from 'node:test';
import { POST as archiveYearlyRolloverPost } from '../archive/yearly-rollover/route';
import { POST as personnelDeletePost } from '../personnel/delete/route';
import { POST as personnelCreatePost } from '../personnel/create/route';
import { POST as forcePasswordResetPost } from '../personnel/force-password-reset/route';
import { POST as personnelSyncBalancesPost } from '../personnel/sync-balances/route';
import { POST as notificationsCreatePost } from '../notifications/create/route';
import { POST as dashboardAiReportPost } from '../dashboard/ai-report/route';
import { POST as geocodeLocationsPost } from '../geocode/locations/route';
import { GET as topStaffReferrersGet } from '../dashboard/top-staff-referrers/route';
import { GET as topVisaGrantCounsellorsGet } from '../dashboard/top-visa-grant-counsellors/route';
import { GET as globalVisaApprovalTrendGet } from '../dashboard/global-visa-approval-trend/route';
import { POST as studyNaviSsoPost } from '../studynavi/sso/route';
import { POST as turnstileVerifyPost } from '../turnstile/verify/route';
import { __setRateLimitBypassForTests } from './rateLimit';
import { canRunYearlyArchiveRole } from '../archive/yearly-rollover/authorization';
import { canDeletePersonnelRole } from '../personnel/delete/authorization';
import { canCreatePersonnelRole } from '../personnel/create/authorization';
import { canAccessDashboardAiReportRole } from '../dashboard/ai-report/authorization';
import { canAccessDashboardMetricsRole } from '../dashboard/_shared/authorization';
import { personnelDeleteBodySchema } from '../personnel/delete/schema';
import { personnelCreateBodySchema } from '../personnel/create/schema';
import { forcePasswordResetBodySchema } from '../personnel/force-password-reset/schema';
import { notificationCreateBodySchema } from '../notifications/create/schema';
import { dashboardAiReportBodySchema } from '../dashboard/ai-report/schema';
import { studyNaviSsoBodySchema } from '../studynavi/sso/schema';

const buildPostRequest = (path: string) => new Request(`http://localhost${path}`, { method: 'POST' });
const buildGetRequest = (path: string) => new Request(`http://localhost${path}`, { method: 'GET' });

test('sensitive API routes return 401 when bearer token is missing', async () => {
  const [personnelDeleteResponse, personnelCreateResponse, forcePasswordResetResponse, personnelSyncBalancesResponse, notificationsCreateResponse, archiveResponse, aiReportResponse, geocodeResponse, topStaffResponse, topVisaResponse, globalTrendResponse, ssoResponse] = await Promise.all([
    personnelDeletePost(buildPostRequest('/api/personnel/delete')),
    personnelCreatePost(buildPostRequest('/api/personnel/create')),
    forcePasswordResetPost(buildPostRequest('/api/personnel/force-password-reset')),
    personnelSyncBalancesPost(buildPostRequest('/api/personnel/sync-balances')),
    notificationsCreatePost(buildPostRequest('/api/notifications/create')),
    archiveYearlyRolloverPost(buildPostRequest('/api/archive/yearly-rollover')),
    dashboardAiReportPost(buildPostRequest('/api/dashboard/ai-report')),
    geocodeLocationsPost(buildPostRequest('/api/geocode/locations')),
    topStaffReferrersGet(buildGetRequest('/api/dashboard/top-staff-referrers')),
    topVisaGrantCounsellorsGet(buildGetRequest('/api/dashboard/top-visa-grant-counsellors')),
    globalVisaApprovalTrendGet(buildGetRequest('/api/dashboard/global-visa-approval-trend')),
    studyNaviSsoPost(buildPostRequest('/api/studynavi/sso')),
  ]);

  assert.equal(personnelDeleteResponse.status, 401);
  assert.equal(personnelCreateResponse.status, 401);
  assert.equal(forcePasswordResetResponse.status, 401);
  assert.equal(personnelSyncBalancesResponse.status, 401);
  assert.equal(notificationsCreateResponse.status, 401);
  assert.equal(archiveResponse.status, 401);
  assert.equal(aiReportResponse.status, 401);
  assert.equal(geocodeResponse.status, 401);
  assert.equal(topStaffResponse.status, 401);
  assert.equal(topVisaResponse.status, 401);
  assert.equal(globalTrendResponse.status, 401);
  assert.equal(ssoResponse.status, 401);
});

test('privileged routes reject oversized payloads before expensive work', async () => {
  const aiApiKeyBefore = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = 'test-key';
  try {
    const headers = {
      authorization: 'Bearer smoke-token',
      'content-length': String(999_999),
      'content-type': 'application/json',
    };
    const [personnelDeleteResponse, personnelCreateResponse, forcePasswordResetResponse, notificationsCreateResponse, archiveResponse, aiReportResponse, geocodeResponse] = await Promise.all([
      personnelDeletePost(new Request('http://localhost/api/personnel/delete', { method: 'POST', headers })),
      personnelCreatePost(new Request('http://localhost/api/personnel/create', { method: 'POST', headers })),
      forcePasswordResetPost(new Request('http://localhost/api/personnel/force-password-reset', { method: 'POST', headers })),
      notificationsCreatePost(new Request('http://localhost/api/notifications/create', { method: 'POST', headers })),
      archiveYearlyRolloverPost(new Request('http://localhost/api/archive/yearly-rollover', { method: 'POST', headers })),
      dashboardAiReportPost(new Request('http://localhost/api/dashboard/ai-report', { method: 'POST', headers })),
      geocodeLocationsPost(new Request('http://localhost/api/geocode/locations', { method: 'POST', headers })),
    ]);

    assert.equal(personnelDeleteResponse.status, 413);
    assert.equal(personnelCreateResponse.status, 413);
    assert.equal(forcePasswordResetResponse.status, 413);
    assert.equal(notificationsCreateResponse.status, 413);
    assert.equal(archiveResponse.status, 413);
    assert.equal(aiReportResponse.status, 413);
    assert.equal(geocodeResponse.status, 413);
  } finally {
    process.env.OPENAI_API_KEY = aiApiKeyBefore;
  }
});

test('turnstile verify rejects oversized payloads', async () => {
  const response = await turnstileVerifyPost(
    new Request('http://localhost/api/turnstile/verify', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'content-length': String(999_999),
      },
      body: JSON.stringify({ token: 'x' }),
    }),
  );
  assert.equal(response.status, 413);
});

test('turnstile verify returns 503 for retryable upstream timeout/network failures', async () => {
  const originalFetch = globalThis.fetch;
  const turnstileSecretBefore = process.env.TURNSTILE_SECRET_KEY;
  const fallbackDisableBefore = process.env.SAFE_SERVER_FETCH_DISABLE_FALLBACK;
  process.env.TURNSTILE_SECRET_KEY = 'turnstile-secret';
  process.env.SAFE_SERVER_FETCH_DISABLE_FALLBACK = '1';
  __setRateLimitBypassForTests(true);

  globalThis.fetch = (async () => {
    const error = new TypeError('fetch failed') as TypeError & { cause?: { code?: string } };
    error.cause = { code: 'ETIMEDOUT' };
    throw error;
  }) as typeof fetch;

  try {
    const response = await turnstileVerifyPost(
      new Request('http://localhost/api/turnstile/verify', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ token: 'turnstile-token' }),
      }),
    );
    const body = await response.json() as { ok?: boolean; message?: string };
    assert.equal(response.status, 503);
    assert.equal(body.ok, false);
    assert.match(String(body.message || ''), /temporarily unavailable/i);
    assert.equal(response.headers.get('retry-after'), '5');
  } finally {
    globalThis.fetch = originalFetch;
    process.env.TURNSTILE_SECRET_KEY = turnstileSecretBefore;
    process.env.SAFE_SERVER_FETCH_DISABLE_FALLBACK = fallbackDisableBefore;
    __setRateLimitBypassForTests(false);
  }
});

test('role guard matrix keeps 403 boundaries for sensitive API routes', () => {
  const forbiddenAiReportRoles = [
    null,
    '',
    'Education Consultant',
    'Administrative Staff',
    'Marketing Staff',
  ];
  forbiddenAiReportRoles.forEach((role) => {
    assert.equal(canDeletePersonnelRole(role), false);
    assert.equal(canCreatePersonnelRole(role), false);
    assert.equal(canAccessDashboardAiReportRole(role), false);
    assert.equal(canRunYearlyArchiveRole(role), false);
  });
  const forbiddenDashboardMetricsRoles = [null, '', 'Unknown Role'];
  forbiddenDashboardMetricsRoles.forEach((role) => {
    assert.equal(canAccessDashboardMetricsRole(role), false);
  });

  assert.equal(canDeletePersonnelRole('Developer'), true);
  assert.equal(canDeletePersonnelRole('Operations'), true);
  assert.equal(canDeletePersonnelRole('Branch Manager'), false);
  assert.equal(canCreatePersonnelRole('Developer'), true);
  assert.equal(canCreatePersonnelRole('Operations'), true);
  assert.equal(canCreatePersonnelRole('Branch Manager'), false);

  assert.equal(canAccessDashboardAiReportRole('Developer'), true);
  assert.equal(canAccessDashboardAiReportRole('Operations'), true);
  assert.equal(canAccessDashboardAiReportRole('Branch Manager'), false);
  assert.equal(canAccessDashboardMetricsRole('Developer'), true);
  assert.equal(canAccessDashboardMetricsRole('Operations'), true);
  assert.equal(canAccessDashboardMetricsRole('Branch Manager'), true);
  assert.equal(canAccessDashboardMetricsRole('Marketing Staff'), true);
  assert.equal(canAccessDashboardMetricsRole('Administrative Staff'), true);
  assert.equal(canAccessDashboardMetricsRole('Satellite Office Staff'), true);
  assert.equal(canAccessDashboardMetricsRole('Education Consultant'), true);

  assert.equal(canRunYearlyArchiveRole('Developer'), true);
  assert.equal(canRunYearlyArchiveRole('Operations'), true);
  assert.equal(canRunYearlyArchiveRole('Branch Manager'), true);
  assert.equal(canRunYearlyArchiveRole('marketing'), false);
});

test('payload schemas reject malformed privileged route bodies', () => {
  assert.equal(personnelDeleteBodySchema.safeParse({ uid: '' }).success, false);
  assert.equal(personnelDeleteBodySchema.safeParse({}).success, false);
  assert.equal(forcePasswordResetBodySchema.safeParse({ password: 'short' }).success, false);
  assert.equal(forcePasswordResetBodySchema.safeParse({ password: 'StrongPass123!' }).success, true);
  assert.equal(
    personnelCreateBodySchema.safeParse({
      firstName: 'A',
      lastName: 'B',
      email: 'bad-email',
      password: 'short',
      role: '',
      branch: '',
    }).success,
    false,
  );
  assert.equal(
    personnelCreateBodySchema.safeParse({
      firstName: 'A',
      lastName: 'B',
      email: 'ab@example.com',
      password: 'password123',
      role: 'Operations',
      branch: 'Manila',
      preferredName: '',
    }).success,
    true,
  );
  assert.equal(notificationCreateBodySchema.safeParse({ notifications: [] }).success, false);
  assert.equal(
    notificationCreateBodySchema.safeParse({
      notifications: [{ recipientUid: 'uid-1', message: 'Hello world' }],
    }).success,
    true,
  );

  assert.equal(
    dashboardAiReportBodySchema.safeParse({ snapshot: { funnelData: {} } }).success,
    false,
  );
  assert.equal(
    dashboardAiReportBodySchema.safeParse({ snapshot: { selectedLocation: 'PH' } }).success,
    false,
  );

  assert.equal(studyNaviSsoBodySchema.safeParse({ continueTo: 42 }).success, false);
  assert.equal(studyNaviSsoBodySchema.safeParse({ continueTo: '/dashboard' }).success, true);
});
