import { describe, it, expect } from 'vitest';
import { formatResultsCount } from './results-count';

describe('formatResultsCount', () => {
  it('returns empty string when query is empty and category is "all"', () => {
    expect(formatResultsCount(10, 10, '', 'all')).toBe('');
  });

  it('treats whitespace-only query as empty', () => {
    expect(formatResultsCount(10, 10, '   ', 'all')).toBe('');
  });

  it('returns count when query has content', () => {
    expect(formatResultsCount(3, 10, 'cypress', 'all')).toBe('3 of 10 playbooks');
  });

  it('returns count when category is filtered', () => {
    expect(formatResultsCount(4, 10, '', 'frontend')).toBe('4 of 10 playbooks');
  });

  it('returns count when both query and category filter are active', () => {
    expect(formatResultsCount(1, 10, 'rtl', 'frontend')).toBe('1 of 10 playbooks');
  });

  it('reports zero matches', () => {
    expect(formatResultsCount(0, 10, 'nonexistent', 'all')).toBe('0 of 10 playbooks');
  });
});
