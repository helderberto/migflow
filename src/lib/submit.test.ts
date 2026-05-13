import { describe, it, expect } from 'vitest';
import {
  toSlug,
  parseTags,
  validateSubmission,
  buildFrontmatter,
  buildPlaybookFile,
  buildSlug,
  buildGitHubNewFileUrl,
} from './submit';

const valid = {
  from: 'Enzyme',
  to: 'React Testing Library',
  category: 'frontend',
  tagsRaw: 'testing, react',
  description: 'A migration',
  body: '## Body',
};

describe('toSlug', () => {
  it('lowercases', () => {
    expect(toSlug('Enzyme')).toBe('enzyme');
  });

  it('replaces runs of non-alphanumerics with a single hyphen', () => {
    expect(toSlug('React Testing  Library!!')).toBe('react-testing-library');
  });

  it('trims leading and trailing hyphens', () => {
    expect(toSlug('  .React.')).toBe('react');
  });

  it('handles empty input', () => {
    expect(toSlug('')).toBe('');
  });

  it('collapses unicode-adjacent symbols', () => {
    expect(toSlug('Vue 3 → Vue 4')).toBe('vue-3-vue-4');
  });
});

describe('parseTags', () => {
  it('splits on commas and trims', () => {
    expect(parseTags('a, b , c')).toEqual(['a', 'b', 'c']);
  });

  it('drops empty entries', () => {
    expect(parseTags('a,,b, ,c,')).toEqual(['a', 'b', 'c']);
  });

  it('returns [] for an empty string', () => {
    expect(parseTags('')).toEqual([]);
  });
});

describe('validateSubmission', () => {
  it('accepts a complete submission', () => {
    const result = validateSubmission(valid);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.category).toBe('frontend');
      expect(result.value.tags).toEqual(['testing', 'react']);
    }
  });

  it('rejects when required fields are blank', () => {
    const result = validateSubmission({ ...valid, from: '   ' });
    expect(result).toEqual({
      ok: false,
      error: 'Please fill in all required fields.',
    });
  });

  it('rejects an empty body', () => {
    const result = validateSubmission({ ...valid, body: '' });
    expect(result.ok).toBe(false);
  });

  it('rejects an unknown category', () => {
    const result = validateSubmission({ ...valid, category: 'weird' });
    expect(result).toEqual({
      ok: false,
      error: 'Please choose a valid category.',
    });
  });

  it('trims values in the output', () => {
    const result = validateSubmission({
      ...valid,
      from: '  Enzyme  ',
      description: '  A migration  ',
    });
    if (result.ok) {
      expect(result.value.from).toBe('Enzyme');
      expect(result.value.description).toBe('A migration');
    }
  });
});

describe('buildFrontmatter', () => {
  const submission = {
    from: 'Enzyme',
    to: 'RTL',
    category: 'frontend' as const,
    tags: ['testing', 'react'] as ReadonlyArray<string>,
    description: 'desc',
    body: '...',
  };

  it('emits all required keys', () => {
    const fm = buildFrontmatter(submission);
    expect(fm).toContain('from: "Enzyme"');
    expect(fm).toContain('to: "RTL"');
    expect(fm).toContain('category: "frontend"');
    expect(fm).toContain('description: "desc"');
    expect(fm).toContain('draft: false');
  });

  it('quotes each tag', () => {
    expect(buildFrontmatter(submission)).toContain('tags: ["testing", "react"]');
  });

  it('emits an empty tag array when none given', () => {
    expect(buildFrontmatter({ ...submission, tags: [] })).toContain('tags: []');
  });

  it('opens and closes with --- delimiters', () => {
    const fm = buildFrontmatter(submission);
    expect(fm.startsWith('---\n')).toBe(true);
    expect(fm.endsWith('\n---')).toBe(true);
  });
});

describe('buildPlaybookFile', () => {
  it('joins frontmatter and body with a blank line', () => {
    const file = buildPlaybookFile({
      from: 'A',
      to: 'B',
      category: 'data',
      tags: [],
      description: 'd',
      body: '# Body',
    });
    expect(file).toMatch(/---\n\n# Body$/);
  });
});

describe('buildSlug', () => {
  it('concatenates slugged from and to', () => {
    expect(buildSlug('Enzyme', 'React Testing Library')).toBe('enzyme-to-react-testing-library');
  });
});

describe('buildGitHubNewFileUrl', () => {
  const input = {
    repo: 'helderberto/migflow',
    branch: 'main',
    slug: 'enzyme-to-rtl',
    from: 'Enzyme',
    to: 'RTL',
    fileContent: '---\n---\n\nbody',
  };

  it('targets the new-file endpoint on the right branch', () => {
    const url = new URL(buildGitHubNewFileUrl(input));
    expect(url.origin).toBe('https://github.com');
    expect(url.pathname).toBe('/helderberto/migflow/new/main');
  });

  it('sets the filename under content/playbooks', () => {
    const url = new URL(buildGitHubNewFileUrl(input));
    expect(url.searchParams.get('filename')).toBe('src/content/playbooks/enzyme-to-rtl.md');
  });

  it('passes the file content verbatim', () => {
    const url = new URL(buildGitHubNewFileUrl(input));
    expect(url.searchParams.get('value')).toBe('---\n---\n\nbody');
  });

  it('uses a conventional commit message', () => {
    const url = new URL(buildGitHubNewFileUrl(input));
    expect(url.searchParams.get('message')).toBe('feat: add Enzyme → RTL playbook');
  });

  it('percent-encodes special characters in query params', () => {
    const raw = buildGitHubNewFileUrl(input);
    expect(raw).toContain('%E2%86%92');
  });
});
