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
  assertExplicitInternalJsonShape,
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

test('critical protected routes return explicit JSON 500 shape for true internal auth failures', async () => {
  await withEnv(
    {
      OPENAI_API_KEY: 'test-openai-key',
      STUDYNAVI_URL: 'https://studynavi.example.com',
    },
    async () => {
      await withMockedAuthDeps('internal', 'Developer', async () => {
        const cases: Array<{ id: string; invoke: () => Promise<Response> }> = [
          {
            id: 'personnel-create',
            invoke: () => personnelCreatePost(buildJsonPostRequest('/api/personnel/create', 'internal-token', {
              firstName: 'Test',
              lastName: 'User',
              preferredName: '',
              email: 'test.user@example.com',
              password: 'password123',
              role: 'Operations',
              branch: 'Manila',
            })),
          },
          { id: 'personnel-delete', invoke: () => personnelDeletePost(buildJsonPostRequest('/api/personnel/delete', 'internal-token', { uid: 'target-1' })) },
          { id: 'force-password-reset', invoke: () => forcePasswordResetPost(buildJsonPostRequest('/api/personnel/force-password-reset', 'internal-token', { password: 'StrongPass123!' })) },
          { id: 'notifications-create', invoke: () => notificationsCreatePost(buildJsonPostRequest('/api/notifications/create', 'internal-token', { notifications: [{ recipientUid: 'recipient-1', message: 'Hello world' }] })) },
          { id: 'geocode-locations', invoke: () => geocodeLocationsPost(buildJsonPostRequest('/api/geocode/locations', 'internal-token', { locations: [{ key: 'loc-1', query: 'Manila' }] })) },
          { id: 'dashboard-ai-report', invoke: () => dashboardAiReportPost(buildJsonPostRequest('/api/dashboard/ai-report', 'internal-token', aiPayload)) },
          { id: 'studynavi-sso', invoke: () => studyNaviSsoPost(buildJsonPostRequest('/api/studynavi/sso', 'internal-token', { continueTo: '/navigation' })) },
          {
            id: 'archive-yearly-rollover',
            invoke: () => archiveYearlyRolloverPost(
              new Request('http://localhost/api/archive/yearly-rollover', {
                method: 'POST',
                headers: { authorization: 'Bearer internal-token' },
              }),
            ),
          },
          { id: 'dashboard-top-staff-referrers', invoke: () => topStaffReferrersGet(buildAuthedGetRequest('/api/dashboard/top-staff-referrers', 'internal-token')) },
        ];

        for (const testCase of cases) {
          const response = await testCase.invoke();
          await assertExplicitInternalJsonShape(response);
        }
      });
    },
  );
});
