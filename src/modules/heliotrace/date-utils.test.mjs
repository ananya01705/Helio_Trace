import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isValidDate } from './date-utils.ts';

describe('isValidDate', () => {
  it('accepts a valid date', () => {
    assert.equal(isValidDate('2026-10-17'), true);
  });

  it('accepts a valid leap-year date', () => {
    assert.equal(isValidDate('2024-02-29'), true);
  });

  it('rejects an impossible calendar date', () => {
    assert.equal(isValidDate('2026-02-30'), false);
  });

  it('rejects an invalid leap-year date', () => {
    assert.equal(isValidDate('2025-02-29'), false);
  });

  it('rejects an incorrect date format', () => {
    assert.equal(isValidDate('17-10-2026'), false);
  });

  it('rejects an incomplete date', () => {
    assert.equal(isValidDate('2026-10'), false);
  });
});