import assert from 'node:assert/strict';
import test from 'node:test';
import { POST as archiveYearlyRolloverPost } from '../archive/yearly-rollover/route';
import { POST as personnelDeletePost } from '../personnel/delete/route';
import { POST as personnelCreatePost } from '../personnel/create/route';
import { POST as forcePasswordResetPost } from '../personnel/force-password-reset/route';
import { POST as notificationsCreatePost } from '../notifications/create/route';
import { POST as dashboardAiReportPost } from '../dashboard/ai-report/route';
import { POST as geocodeLocationsPost } from '../geocode/locations/route';
import { GET as topStaffReferrersGet } from '../dashboard/top-staff-referrers/route';
import { POST as studyNaviSsoPost } from '../studynavi/sso/route';
import {
  buildAuthedGetRequest,
  buildJsonPostRequest,
  withEnv,
  withMockedAuthDeps,
} from './routeAuthRegressionHelpers';

const aiPayload = {
  snapshot: {
    userName: 'Tester',
    reportDate: '2026-04-08',
    selectedFunnelLocation: 'all',
    selectedFunnelMonth: 'all',
    selectedFunnelYear: 'all',
    selectedLocation: 'all',
    funnelData: {},
    targetVsActual: [],
    topDestinations: [],
    preferredCourses: [],
    topLeadSources: [],
    topVisaGrantCounsellors: [],
    topStaffReferrers: [],
    trendData: [],
  },
};

test('protected routes return 401 for invalid tokens across critical endpoints', async () => {
  await withEnv(
    {
      OPENAI_API_KEY: 'test-openai-key',
      STUDYNAVI_URL: 'https://studynavi.example.com',
    },
    async () => {
      await withMockedAuthDeps('invalid', 'Developer', async () => {
        const cases: Array<{ id: string; invoke: () => Promise<Response> }> = [
          {
            id: 'personnel-create',
            invoke: () => personnelCreatePost(buildJsonPostRequest('/api/personnel/create', 'bad-token', {
              firstName: 'Test',
              lastName: 'User',
              preferredName: '',
              email: 'test.user@example.com',
              password: 'password123',
              role: 'Operations',
              branch: 'Manila',
            })),
          },
          { id: 'personnel-delete', invoke: () => personnelDeletePost(buildJsonPostRequest('/api/personnel/delete', 'bad-token', { uid: 'target-1' })) },
          { id: 'force-password-reset', invoke: () => forcePasswordResetPost(buildJsonPostRequest('/api/personnel/force-password-reset', 'bad-token', { password: 'StrongPass123!' })) },
          { id: 'notifications-create', invoke: () => notificationsCreatePost(buildJsonPostRequest('/api/notifications/create', 'bad-token', { notifications: [{ recipientUid: 'recipient-1', message: 'Hello world' }] })) },
          { id: 'geocode-locations', invoke: () => geocodeLocationsPost(buildJsonPostRequest('/api/geocode/locations', 'bad-token', { locations: [{ key: 'loc-1', query: 'Manila' }] })) },
          { id: 'dashboard-ai-report', invoke: () => dashboardAiReportPost(buildJsonPostRequest('/api/dashboard/ai-report', 'bad-token', aiPayload)) },
          { id: 'studynavi-sso', invoke: () => studyNaviSsoPost(buildJsonPostRequest('/api/studynavi/sso', 'bad-token', { continueTo: '/navigation' })) },
          {
            id: 'archive-yearly-rollover',
            invoke: () => archiveYearlyRolloverPost(
              new Request('http://localhost/api/archive/yearly-rollover', {
                method: 'POST',
                headers: { authorization: 'Bearer bad-token' },
              }),
            ),
          },
          { id: 'dashboard-top-staff-referrers', invoke: () => topStaffReferrersGet(buildAuthedGetRequest('/api/dashboard/top-staff-referrers', 'bad-token')) },
        ];

        for (const testCase of cases) {
          const response = await testCase.invoke();
          assert.equal(response.status, 401, `${testCase.id} should return 401 for invalid token`);
        }
      });
    },
  );
});

test('protected routes preserve 403 for forbidden roles on role-gated endpoints', async () => {
  await withEnv(
    {
      OPENAI_API_KEY: 'test-openai-key',
      STUDYNAVI_URL: 'https://studynavi.example.com',
    },
    async () => {
      const forbiddenCases: Array<{ id: string; role: string; invoke: () => Promise<Response> }> = [
        {
          id: 'personnel-create',
          role: 'Branch Manager',
          invoke: () => personnelCreatePost(buildJsonPostRequest('/api/personnel/create', 'valid-token', {
            firstName: 'Test',
            lastName: 'User',
            preferredName: '',
            email: 'test.user@example.com',
            password: 'password123',
            role: 'Operations',
            branch: 'Manila',
          })),
        },
        { id: 'personnel-delete', role: 'Branch Manager', invoke: () => personnelDeletePost(buildJsonPostRequest('/api/personnel/delete', 'valid-token', { uid: 'target-1' })) },
        { id: 'notifications-create', role: 'Unknown Role', invoke: () => notificationsCreatePost(buildJsonPostRequest('/api/notifications/create', 'valid-token', { notifications: [{ recipientUid: 'recipient-1', message: 'Hello world' }] })) },
        { id: 'dashboard-ai-report', role: 'Branch Manager', invoke: () => dashboardAiReportPost(buildJsonPostRequest('/api/dashboard/ai-report', 'valid-token', aiPayload)) },
        {
          id: 'archive-yearly-rollover',
          role: 'Marketing Staff',
          invoke: () => archiveYearlyRolloverPost(
            new Request('http://localhost/api/archive/yearly-rollover', {
              method: 'POST',
              headers: { authorization: 'Bearer valid-token' },
            }),
          ),
        },
        { id: 'dashboard-top-staff-referrers', role: 'Unknown Role', invoke: () => topStaffReferrersGet(buildAuthedGetRequest('/api/dashboard/top-staff-referrers', 'valid-token')) },
      ];

      for (const testCase of forbiddenCases) {
        await withMockedAuthDeps('valid', testCase.role, async () => {
          const response = await testCase.invoke();
          assert.equal(response.status, 403, `${testCase.id} should return 403 for forbidden role`);
        });
      }
    },
  );
});
