import test from 'node:test';
import assert from 'node:assert/strict';
import type { ApplicationInfo } from '../../../../data/applications';
import type { AssessmentSubmission } from '../../../../types';
import { buildManagerFunnelData } from './funnelMetrics';
import { app, submission, toNumber } from './funnelMetrics.test.helpers';

test('manager funnel counts visa grant/refuse in the decision year for rollover cases', () => {
  const applications: ApplicationInfo[] = [
    app({
      id: 'app-rollover-granted',
      status: 'Visa Granted',
      statusChanged: new Date('2026-01-12') as any,
      history: [
        { status: 'Visa Granted', date: new Date('2026-01-12') as any },
        { status: 'Visa Lodged', date: new Date('2025-12-22') as any },
        { status: 'Submitted Application', date: new Date('2025-11-20') as any },
      ],
    }),
    app({
      id: 'app-rollover-refused',
      studentId: 'lead-2',
      status: 'Visa Refused',
      statusChanged: new Date('2027-02-09') as any,
      history: [
        { status: 'Visa Refused', date: new Date('2027-02-09') as any },
        { status: 'Visa Lodged', date: new Date('2026-12-14') as any },
        { status: 'Submitted Application', date: new Date('2026-11-28') as any },
      ],
    }),
  ];

  const submissions: AssessmentSubmission[] = [
    submission({ id: 'lead-1', createdAt: new Date('2025-11-20') as any }),
    submission({ id: 'lead-2', createdAt: new Date('2026-11-28') as any }),
  ];

  const genuineIds = new Set<string>(['lead-1', 'lead-2']);

  const result2025 = buildManagerFunnelData(applications, submissions, genuineIds, 'all', '2025');
  const manila2025 = result2025['Manila'];
  assert.equal(toNumber(manila2025.granted), 0);
  assert.equal(toNumber(manila2025.refused), 0);

  const result2026 = buildManagerFunnelData(applications, submissions, genuineIds, 'all', '2026');
  const manila2026 = result2026['Manila'];
  assert.equal(toNumber(manila2026.granted), 1);
  assert.equal(toNumber(manila2026.refused), 0);

  const result2027 = buildManagerFunnelData(applications, submissions, genuineIds, 'all', '2027');
  const manila2027 = result2027['Manila'];
  assert.equal(toNumber(manila2027.granted), 0);
  assert.equal(toNumber(manila2027.refused), 1);
});

test('manager funnel counts offer/coe/lodged by milestone year even when application was submitted in the prior year', () => {
  const applications: ApplicationInfo[] = [
    app({
      id: 'app-rollover-offer-flow',
      status: 'Visa Lodged',
      statusChanged: new Date('2026-03-01') as any,
      history: [
        { status: 'Visa Lodged', date: new Date('2026-03-01') as any },
        { status: 'CoE/LoA Received', date: new Date('2026-02-10') as any },
        { status: 'Unconditional Offer', date: new Date('2026-01-08') as any },
        { status: 'Submitted Application', date: new Date('2025-11-20') as any },
      ],
    }),
  ];

  const submissions: AssessmentSubmission[] = [
    submission({ id: 'lead-1', createdAt: new Date('2025-11-20') as any }),
  ];

  const genuineIds = new Set<string>(['lead-1']);

  const result2025 = buildManagerFunnelData(applications, submissions, genuineIds, 'all', '2025');
  const manila2025 = result2025['Manila'];
  assert.equal(toNumber(manila2025.applications), 1);
  assert.equal(toNumber(manila2025.offers), 0);
  assert.equal(toNumber(manila2025.coe), 0);
  assert.equal(toNumber(manila2025.lodged), 0);
  assert.equal(toNumber(manila2025.granted), 0);
  assert.equal(toNumber(manila2025.refused), 0);

  const result2026 = buildManagerFunnelData(applications, submissions, genuineIds, 'all', '2026');
  const manila2026 = result2026['Manila'];
  assert.equal(toNumber(manila2026.applications), 0);
  assert.equal(toNumber(manila2026.offers), 1);
  assert.equal(toNumber(manila2026.coe), 1);
  assert.equal(toNumber(manila2026.lodged), 1);
  assert.equal(toNumber(manila2026.granted), 0);
  assert.equal(toNumber(manila2026.refused), 0);
});
