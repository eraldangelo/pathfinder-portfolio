import assert from 'node:assert/strict';
import test from 'node:test';
import type { AssessmentSubmission } from '../../../../types';
import {
  buildTopDestinationsData,
  parseDestinationOthersBreakdownDetails,
} from './destinationMetrics';

const submission = (partial: Partial<AssessmentSubmission>): AssessmentSubmission => ({
  id: 'lead-1',
  ...partial,
});

test('buildTopDestinationsData groups non-main destinations under Other with breakdown', () => {
  const rows = buildTopDestinationsData([
    submission({
      id: 'lead-1',
      studyDestinations: ['Australia', 'Other'],
      otherStudyDestination: 'Belgium',
    }),
    submission({
      id: 'lead-2',
      studyDestinations: ['Other'],
      otherStudyDestination: 'Spain',
    }),
    submission({
      id: 'lead-3',
      studyDestinations: ['United States of America'],
    }),
    submission({
      id: 'lead-4',
      studyDestinations: ['Other'],
      otherStudyDestination: 'United States',
    }),
    submission({
      id: 'lead-5',
      studyDestinations: ['Germany', 'Other'],
      otherStudyDestination: 'Belgium',
    }),
  ]);

  assert.equal(rows.find((row) => row.name === 'United States of America')?.apps, 2);
  assert.equal(rows.find((row) => row.name === 'Australia')?.apps, 1);
  assert.equal(rows.find((row) => row.name === 'Germany')?.apps, 1);

  const other = rows.find((row) => row.name === 'Other');
  assert.equal(other?.apps, 3);

  const details = parseDestinationOthersBreakdownDetails(other?.details);
  assert.deepEqual(details, [
    { label: 'Belgium', apps: 2, code: 'be' },
    { label: 'Spain', apps: 1, code: 'es' },
  ]);

  assert.equal(rows.at(-1)?.name, 'Other');
});

test('buildTopDestinationsData includes Unspecified when Other is selected without details', () => {
  const rows = buildTopDestinationsData([
    submission({
      id: 'lead-blank-other',
      studyDestinations: ['Other'],
      otherStudyDestination: '',
    }),
  ]);

  const other = rows.find((row) => row.name === 'Other');
  assert.equal(other?.apps, 1);
  assert.deepEqual(parseDestinationOthersBreakdownDetails(other?.details), [
    { label: 'Unspecified', apps: 1, code: undefined },
  ]);
});

test('buildTopDestinationsData normalizes alias inputs like U.S.A., U.K., and Korea', () => {
  const rows = buildTopDestinationsData([
    submission({
      id: 'lead-alias-1',
      studyDestinations: ['Other'],
      otherStudyDestination: 'U.S.A.; U.K.; Korea',
    }),
    submission({
      id: 'lead-alias-2',
      studyDestinations: ['Other'],
      otherStudyDestination: 'United States; UK',
    }),
  ]);

  assert.equal(rows.find((row) => row.name === 'United States of America')?.apps, 2);
  assert.equal(rows.find((row) => row.name === 'United Kingdom')?.apps, 2);

  const other = rows.find((row) => row.name === 'Other');
  assert.equal(other?.apps, 1);
  assert.deepEqual(parseDestinationOthersBreakdownDetails(other?.details), [
    { label: 'South Korea', apps: 1, code: 'kr' },
  ]);
});
