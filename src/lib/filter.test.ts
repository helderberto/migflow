import { describe, it, expect } from 'vitest';
import { matchesPlaybook } from './filter';

const enzyme = {
  from: 'Enzyme',
  to: 'React Testing Library',
  tags: 'testing react',
  description: 'Replace shallow rendering',
  category: 'frontend',
};

describe('matchesPlaybook', () => {
  it('matches everything for empty query + all category', () => {
    expect(matchesPlaybook(enzyme, '', 'all')).toBe(true);
  });

  it('matches against from field', () => {
    expect(matchesPlaybook(enzyme, 'enzyme', 'all')).toBe(true);
  });

  it('matches against to field', () => {
    expect(matchesPlaybook(enzyme, 'testing library', 'all')).toBe(true);
  });

  it('matches against tags', () => {
    expect(matchesPlaybook(enzyme, 'react', 'all')).toBe(true);
  });

  it('matches against description', () => {
    expect(matchesPlaybook(enzyme, 'shallow', 'all')).toBe(true);
  });

  it('matches against category text', () => {
    expect(matchesPlaybook(enzyme, 'frontend', 'all')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(matchesPlaybook(enzyme, 'ENZYME', 'all')).toBe(true);
  });

  it('trims whitespace in the query', () => {
    expect(matchesPlaybook(enzyme, '   enzyme   ', 'all')).toBe(true);
  });

  it('rejects unrelated queries', () => {
    expect(matchesPlaybook(enzyme, 'vue', 'all')).toBe(false);
  });

  it('rejects mismatched category', () => {
    expect(matchesPlaybook(enzyme, '', 'backend')).toBe(false);
  });

  it('accepts matching category', () => {
    expect(matchesPlaybook(enzyme, '', 'frontend')).toBe(true);
  });

  it('requires both text and category to match', () => {
    expect(matchesPlaybook(enzyme, 'enzyme', 'backend')).toBe(false);
    expect(matchesPlaybook(enzyme, 'vue', 'frontend')).toBe(false);
  });
});
