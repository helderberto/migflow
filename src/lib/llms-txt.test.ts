import { describe, it, expect } from 'vitest';
import { buildLlmsTxt } from './llms-txt';
import type { LlmsPlaybook } from '@/types';

const playbooks: ReadonlyArray<LlmsPlaybook> = [
  {
    slug: 'enzyme-to-rtl',
    category: 'frontend',
    from: 'Enzyme',
    to: 'RTL',
    description: 'frontend test migration',
  },
  {
    slug: 'express-to-fastify',
    category: 'backend',
    from: 'Express',
    to: 'Fastify',
    description: 'backend framework swap',
  },
  {
    slug: 'cra-to-vite',
    category: 'frontend',
    from: 'CRA',
    to: 'Vite',
    description: 'bundler swap',
  },
];

describe('buildLlmsTxt', () => {
  it('starts with the MigFlow header', () => {
    expect(buildLlmsTxt([])).toMatch(/^# MigFlow\n/);
  });

  it('includes the all-playbooks JSON link', () => {
    expect(buildLlmsTxt([])).toContain('[All playbooks (JSON)](/playbooks.json)');
  });

  it('groups playbooks by category', () => {
    const out = buildLlmsTxt(playbooks);
    expect(out).toContain('## frontend');
    expect(out).toContain('## backend');
  });

  it('skips empty categories', () => {
    const out = buildLlmsTxt(playbooks);
    expect(out).not.toContain('## data');
    expect(out).not.toContain('## language');
    expect(out).not.toContain('## infra');
  });

  it("sorts entries inside a category by 'from'", () => {
    const out = buildLlmsTxt(playbooks);
    const idxCra = out.indexOf('CRA → Vite');
    const idxEnzyme = out.indexOf('Enzyme → RTL');
    expect(idxCra).toBeGreaterThan(-1);
    expect(idxEnzyme).toBeGreaterThan(-1);
    expect(idxCra).toBeLessThan(idxEnzyme);
  });

  it('links each entry to its JSON endpoint', () => {
    expect(buildLlmsTxt(playbooks)).toContain(
      '- [Enzyme → RTL](/playbooks/enzyme-to-rtl.json): frontend test migration',
    );
  });

  it('orders categories per CATEGORIES const (frontend before backend)', () => {
    const out = buildLlmsTxt(playbooks);
    expect(out.indexOf('## frontend')).toBeLessThan(out.indexOf('## backend'));
  });

  it('does not mutate the input array', () => {
    const input: ReadonlyArray<LlmsPlaybook> = [...playbooks];
    const snapshot = [...input];
    buildLlmsTxt(input);
    expect(input).toEqual(snapshot);
  });
});
