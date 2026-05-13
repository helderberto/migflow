import { describe, it, expect } from 'vitest';
import { buildClaudePrompt, buildGeminiPrompt } from './prompts';

const fixture = { from: 'Enzyme', to: 'RTL', body: '# Body\n\nstep one' };

describe('buildClaudePrompt', () => {
  it('includes the from→to in the role line', () => {
    const out = buildClaudePrompt(fixture);
    expect(out).toContain('migration from Enzyme to RTL');
  });

  it('warns against leftover source patterns', () => {
    const out = buildClaudePrompt(fixture);
    expect(out).toContain('Do not leave any Enzyme patterns');
  });

  it('requests idiomatic target patterns', () => {
    const out = buildClaudePrompt(fixture);
    expect(out).toContain('idiomatic RTL patterns');
  });

  it('separates intro from body with --- block', () => {
    const out = buildClaudePrompt(fixture);
    expect(out).toMatch(/\n\n---\n\n# Body/);
  });

  it('appends the body verbatim', () => {
    const out = buildClaudePrompt(fixture);
    expect(out.endsWith(fixture.body)).toBe(true);
  });

  it('handles empty body', () => {
    const out = buildClaudePrompt({ ...fixture, body: '' });
    expect(out.endsWith('---\n\n')).toBe(true);
  });

  it('preserves names with special characters', () => {
    const out = buildClaudePrompt({ from: 'React 16', to: 'React 18', body: '' });
    expect(out).toContain('React 16 to React 18');
  });
});

describe('buildGeminiPrompt', () => {
  it('uses the senior-engineer framing', () => {
    const out = buildGeminiPrompt(fixture);
    expect(out).toMatch(/^Act as a senior software engineer\./);
  });

  it('mentions the pitfalls validation step', () => {
    const out = buildGeminiPrompt(fixture);
    expect(out).toContain('Validate each change against the pitfalls listed');
  });

  it('includes the from→to in the directive', () => {
    const out = buildGeminiPrompt(fixture);
    expect(out).toContain('from Enzyme to RTL');
  });

  it('separates intro from body with --- block', () => {
    const out = buildGeminiPrompt(fixture);
    expect(out).toMatch(/\n\n---\n\n# Body/);
  });

  it('appends the body verbatim', () => {
    const out = buildGeminiPrompt(fixture);
    expect(out.endsWith(fixture.body)).toBe(true);
  });
});
