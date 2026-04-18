import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFirestoreQueryConfig } from './firestoreDataUtils';

class QueryMock {
  path: string;
  ops: Array<{ type: 'where' | 'orderBy'; args: any[] }> = [];

  constructor(path: string) {
    this.path = path;
  }

  where(...args: any[]) {
    this.ops.push({ type: 'where', args });
    return this;
  }

  orderBy(...args: any[]) {
    this.ops.push({ type: 'orderBy', args });
    return this;
  }
}

const createDbMock = () => ({
  collection: (name: string) => new QueryMock(name),
  collectionGroup: (name: string) => new QueryMock(`group:${name}`),
});

const baseUser = {
  uid: 'uid-1',
  email: 'user@test.com',
  displayName: 'Counsellor One',
  firstName: 'Counsellor',
  lastName: 'One',
  preferredName: 'Counsellor',
  dob: null,
  photoURL: null,
  branch: 'Manila',
};

test('consultant config scopes leads by assigned uid and enables application counsellor filter', () => {
  const db = createDbMock();
  const config = buildFirestoreQueryConfig({
    db,
    user: baseUser,
    userRole: 'Education Consultant',
  });

  assert.ok(config);
  assert.equal(config?.shouldFilterApplicationsByCounsellor, true);
  assert.equal(config?.shouldReadApplications, true);
  assert.equal(config?.applicationsBranchClientFilter, null);

  const leadWhere = (config?.leadsQuery as QueryMock).ops.find((op) => op.type === 'where');
  const appWhere = (config?.applicationsQuery as QueryMock).ops.find((op) => op.type === 'where');
  assert.deepEqual(leadWhere?.args, ['assignedCounsellorUid', '==', baseUser.uid]);
  assert.deepEqual(appWhere?.args, ['createdByUid', '==', baseUser.uid]);
});

test('administrative staff config scopes leads/submissions to branch and branch-filters applications client-side', () => {
  const db = createDbMock();
  const config = buildFirestoreQueryConfig({
    db,
    user: { ...baseUser, branch: 'Cebu' },
    userRole: 'Administrative Staff',
  });

  assert.ok(config);
  assert.equal(config?.shouldReadApplications, true);
  assert.equal(config?.applicationsBranchClientFilter, 'Cebu');
  assert.equal(config?.shouldFilterApplicationsByCounsellor, false);

  const leadWhere = (config?.leadsQuery as QueryMock).ops.find((op) => op.type === 'where');
  const submissionWhere = (config?.submissionsQuery as QueryMock).ops.find((op) => op.type === 'where');
  assert.deepEqual(leadWhere?.args, ['branch', 'in', ['Cebu', 'Cebu City']]);
  assert.deepEqual(submissionWhere?.args, ['referredStaffBranch', 'in', ['Cebu', 'Cebu City']]);
});

test('marketing staff config reads global leads/applications in read-only mode', () => {
  const db = createDbMock();
  const config = buildFirestoreQueryConfig({
    db,
    user: baseUser,
    userRole: 'Marketing Staff',
  });
  assert.ok(config);
  assert.equal(config?.shouldReadApplications, true);
  assert.equal(config?.shouldFilterApplicationsByCounsellor, false);
  const leadOrder = (config?.leadsQuery as QueryMock).ops.find((op) => op.type === 'orderBy');
  assert.deepEqual(leadOrder?.args, ['caseId', 'desc']);
});

test('branch-scoped config normalizes Makati branch to Manila application filter and alias queries', () => {
  const db = createDbMock();
  const config = buildFirestoreQueryConfig({
    db,
    user: { ...baseUser, branch: 'Makati' },
    userRole: 'Administrative Staff',
  });

  assert.ok(config);
  assert.equal(config?.applicationsBranchClientFilter, 'Manila');

  const leadWhere = (config?.leadsQuery as QueryMock).ops.find((op) => op.type === 'where');
  const submissionWhere = (config?.submissionsQuery as QueryMock).ops.find((op) => op.type === 'where');
  assert.deepEqual(leadWhere?.args, ['branch', 'in', ['Makati', 'Manila', 'Makati City', 'Manila City', 'Metro Manila', 'Manila Branch']]);
  assert.deepEqual(submissionWhere?.args, ['referredStaffBranch', 'in', ['Makati', 'Manila', 'Makati City', 'Manila City', 'Metro Manila', 'Manila Branch']]);
});
