import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createBatchWriter,
  resolveApplicationCompletionDate,
  resolveLeadBaseDate,
  toDate,
} from './utils';

test('toDate handles Firestore-like timestamp shapes and invalid input safely', () => {
  const native = new Date('2026-01-01T00:00:00.000Z');
  assert.equal(toDate(native)?.toISOString(), native.toISOString());

  const withToDate = { toDate: () => new Date('2026-02-01T00:00:00.000Z') };
  assert.equal(toDate(withToDate)?.toISOString(), '2026-02-01T00:00:00.000Z');

  const withSeconds = { seconds: 1735689600, nanoseconds: 0 };
  assert.equal(toDate(withSeconds)?.toISOString(), '2025-01-01T00:00:00.000Z');

  assert.equal(toDate('not-a-date'), null);
  assert.equal(toDate(undefined), null);
});

test('resolveApplicationCompletionDate follows current-status then history fallback', () => {
  const fromCurrentStatus = resolveApplicationCompletionDate({
    status: 'Application Ended',
    statusChanged: '2025-12-01T00:00:00.000Z',
    history: [{ status: 'Application Ended', date: '2025-11-01T00:00:00.000Z' }],
  });
  assert.equal(fromCurrentStatus?.toISOString(), '2025-12-01T00:00:00.000Z');

  const fromHistory = resolveApplicationCompletionDate({
    status: 'Visa Processing',
    history: [
      { status: 'Application Ended', date: '2024-03-01T00:00:00.000Z' },
      { status: 'Application Ended', date: '2024-05-01T00:00:00.000Z' },
    ],
  });
  assert.equal(fromHistory?.toISOString(), '2024-05-01T00:00:00.000Z');

  assert.equal(resolveApplicationCompletionDate({ status: 'In Progress', history: [] }), null);
});

test('resolveLeadBaseDate prioritizes submittedAt then createdAt', () => {
  const submitted = resolveLeadBaseDate({
    submittedAt: '2026-01-10T00:00:00.000Z',
    createdAt: '2025-12-10T00:00:00.000Z',
  });
  assert.equal(submitted?.toISOString(), '2026-01-10T00:00:00.000Z');

  const created = resolveLeadBaseDate({
    submittedAt: null,
    createdAt: '2025-12-10T00:00:00.000Z',
  });
  assert.equal(created?.toISOString(), '2025-12-10T00:00:00.000Z');
});

test('createBatchWriter commits at threshold and flushes pending writes', async () => {
  const commits: Array<Array<{ op: 'set' | 'delete'; ref: string; payload?: Record<string, unknown> }>> = [];
  const createBatch = () => {
    const queued: Array<{ op: 'set' | 'delete'; ref: string; payload?: Record<string, unknown> }> = [];
    return {
      set: (ref: string, payload: Record<string, unknown>) => {
        queued.push({ op: 'set', ref, payload });
      },
      delete: (ref: string) => {
        queued.push({ op: 'delete', ref });
      },
      commit: async () => {
        commits.push([...queued]);
      },
    };
  };

  const writer = createBatchWriter({ batch: createBatch }, 2);
  writer.queueSet('doc-1', { a: 1 });
  await writer.commitIfNeeded();
  assert.equal(commits.length, 0);

  writer.queueDelete('doc-2');
  await writer.commitIfNeeded();
  assert.equal(commits.length, 1);
  assert.equal(commits[0].length, 2);
  assert.equal(commits[0][0].op, 'set');
  assert.equal(commits[0][1].op, 'delete');

  writer.queueMerge('doc-3', { c: 3 });
  await writer.flush();
  assert.equal(commits.length, 2);
  assert.equal(commits[1].length, 1);
  assert.equal(commits[1][0].op, 'set');
});
