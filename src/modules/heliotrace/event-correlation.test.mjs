
import test from 'node:test';
import assert from 'node:assert/strict';

import { correlateSolarEvents } from './event-correlation.ts';

test('matches a flare to a CME using the flare link', () => {
  const flares = [
    {
      flrID: 'FLR-1',
      linkedEvents: [{ activityID: 'CME-1' }]
    }
  ];

  const cmes = [{ activityID: 'CME-1' }];

  const result = correlateSolarEvents(flares, cmes);

  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0].flare.flrID, 'FLR-1');
  assert.equal(result.matches[0].cme.activityID, 'CME-1');
  assert.deepEqual(result.unmatchedFlareIds, []);
  assert.deepEqual(result.unmatchedCmeIds, []);
});

test('matches a flare to a CME using the reverse CME link', () => {
  const flares = [{ flrID: 'FLR-1' }];

  const cmes = [
    {
      activityID: 'CME-1',
      linkedEvents: [{ activityID: 'FLR-1' }]
    }
  ];

  const result = correlateSolarEvents(flares, cmes);

  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0].matched_by, 'NASA linkedEvents');
});

test('does not return duplicate flare-CME pairs', () => {
  const flares = [
    {
      flrID: 'FLR-1',
      linkedEvents: [
        { activityID: 'CME-1' },
        { activityID: 'CME-1' }
      ]
    }
  ];

  const cmes = [
    {
      activityID: 'CME-1',
      linkedEvents: [{ activityID: 'FLR-1' }]
    }
  ];

  const result = correlateSolarEvents(flares, cmes);

  assert.equal(result.matches.length, 1);
});

test('reports unmatched flares and CMEs', () => {
  const flares = [
    { flrID: 'FLR-1' },
    { flrID: 'FLR-2' }
  ];

  const cmes = [
    { activityID: 'CME-1' },
    { activityID: 'CME-2' }
  ];

  const result = correlateSolarEvents(flares, cmes);

  assert.deepEqual(result.unmatchedFlareIds, ['FLR-1', 'FLR-2']);
  assert.deepEqual(result.unmatchedCmeIds, ['CME-1', 'CME-2']);
});

test('handles records with missing IDs without crashing', () => {
  const flares = [
    { linkedEvents: [{ activityID: 'CME-1' }] }
  ];

  const cmes = [
    { activityID: 'CME-1' }
  ];

  const result = correlateSolarEvents(flares, cmes);

  assert.equal(result.matches.length, 0);
  assert.deepEqual(result.unmatchedFlareIds, []);
  assert.deepEqual(result.unmatchedCmeIds, ['CME-1']);
});

test('handles empty event lists', () => {
  const result = correlateSolarEvents([], []);

  assert.deepEqual(result.matches, []);
  assert.deepEqual(result.unmatchedFlareIds, []);
  assert.deepEqual(result.unmatchedCmeIds, []);
});
