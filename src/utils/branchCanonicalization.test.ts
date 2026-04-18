import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildBranchQueryCandidates,
  normalizeCanonicalBranchKey,
  resolveSubmissionBranch,
  toCanonicalBranch,
} from './branchCanonicalization';

test('toCanonicalBranch maps common aliases to canonical branch labels', () => {
  assert.equal(toCanonicalBranch('Makati'), 'Manila');
  assert.equal(toCanonicalBranch('Metro Manila'), 'Manila');
  assert.equal(toCanonicalBranch('Baguio City'), 'Pampanga');
  assert.equal(toCanonicalBranch('Cagayan de Oro'), 'Davao');
  assert.equal(toCanonicalBranch('Cebu City'), 'Cebu');
});

test('buildBranchQueryCandidates returns unique candidates with alias coverage', () => {
  const manilaCandidates = buildBranchQueryCandidates('Makati');
  assert.ok(manilaCandidates.includes('Makati'));
  assert.ok(manilaCandidates.includes('Manila'));
  assert.ok(manilaCandidates.includes('Metro Manila'));
  assert.ok(manilaCandidates.includes('Manila Branch'));
});

test('resolveSubmissionBranch uses fallback order branch -> referred -> preferred -> currentLocation', () => {
  assert.equal(
    resolveSubmissionBranch({
      branch: '',
      referredStaffBranch: '',
      preferredBranch: 'Cebu',
      currentLocation: 'Davao',
    }),
    'Cebu'
  );
  assert.equal(
    resolveSubmissionBranch({
      branch: '',
      referredStaffBranch: '',
      preferredBranch: '',
      currentLocation: 'Manila',
    }),
    'Manila'
  );
  assert.equal(normalizeCanonicalBranchKey('Makati'), 'manila');
});
