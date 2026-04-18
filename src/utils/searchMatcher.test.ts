import assert from 'node:assert/strict';
import test from 'node:test';
import { matchesSearchTerm, tokenizeSearchTerm } from './searchMatcher';

test('tokenizeSearchTerm normalizes diacritics and punctuation', () => {
  assert.deepEqual(tokenizeSearchTerm('  J\u00E9an  Dela-Cruz  '), ['jean', 'dela', 'cruz']);
});

test('matchesSearchTerm supports first + last name even with middle name in record', () => {
  const matched = matchesSearchTerm({
    searchTerm: 'christine ballesteros',
    textCandidates: ['Christine Joy Ballesteros'],
  });

  assert.equal(matched, true);
});

test('matchesSearchTerm is token-order independent', () => {
  const matched = matchesSearchTerm({
    searchTerm: 'ballesteros christine',
    textCandidates: ['Christine Joy Ballesteros'],
  });

  assert.equal(matched, true);
});

test('matchesSearchTerm supports numeric queries against formatted phone values', () => {
  const matched = matchesSearchTerm({
    searchTerm: '639171234567',
    textCandidates: ['N/A'],
    numericCandidates: ['+63 917-123-4567'],
  });

  assert.equal(matched, true);
});

test('matchesSearchTerm fails when one query token is not present', () => {
  const matched = matchesSearchTerm({
    searchTerm: 'christine xyz',
    textCandidates: ['Christine Joy Ballesteros'],
  });

  assert.equal(matched, false);
});