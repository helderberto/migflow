import { describe, it, expect, beforeAll } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import PlaybookCard from './PlaybookCard.astro';
import type { Category } from '@/types';

async function render(props: {
  slug: string;
  from: string;
  to: string;
  tags: string[];
  description: string;
  category: Category;
}) {
  const container = await AstroContainer.create();
  const html = await container.renderToString(PlaybookCard, { props });
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.querySelector('li.playbook-item') as HTMLLIElement;
}

describe('PlaybookCard.astro', () => {
  let card: HTMLLIElement;

  beforeAll(async () => {
    card = await render({
      slug: 'enzyme-to-rtl',
      from: 'Enzyme',
      to: 'React Testing Library',
      tags: ['React', 'Testing'],
      description: 'Migrate Enzyme tests to RTL.',
      category: 'frontend',
    });
  });

  it('renders an <li> with role=listitem', () => {
    expect(card.getAttribute('role')).toBe('listitem');
  });

  it('writes lowercase data attributes for filtering', () => {
    expect(card.dataset.from).toBe('enzyme');
    expect(card.dataset.to).toBe('react testing library');
    expect(card.dataset.tags).toBe('react testing');
    expect(card.dataset.description).toBe('migrate enzyme tests to rtl.');
  });

  it('passes category through verbatim (not lowercased)', () => {
    expect(card.dataset.category).toBe('frontend');
  });

  it('links to the playbook detail page', () => {
    const link = card.querySelector('a') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/playbooks/enzyme-to-rtl');
  });

  it('renders the from → to label', () => {
    const heading = card.querySelector('p.font-semibold');
    expect(heading?.textContent).toContain('Enzyme');
    expect(heading?.textContent).toContain('→');
    expect(heading?.textContent).toContain('React Testing Library');
  });

  it('renders the description', () => {
    const desc = card.querySelector('p.truncate');
    expect(desc?.textContent?.trim()).toBe('Migrate Enzyme tests to RTL.');
  });

  it('renders the category pill with the category name', () => {
    const pill = card.querySelector('span.rounded-full');
    expect(pill?.textContent?.trim()).toBe('frontend');
  });

  it('applies the category color to the left border', async () => {
    const backendCard = await render({
      slug: 'x',
      from: 'A',
      to: 'B',
      tags: [],
      description: 'x',
      category: 'backend',
    });
    const link = backendCard.querySelector('a') as HTMLAnchorElement;
    expect(link.className).toContain('border-l-purple-400');
  });

  it('joins tags with spaces in data-tags', async () => {
    const card = await render({
      slug: 'x',
      from: 'A',
      to: 'B',
      tags: ['One', 'Two', 'Three'],
      description: 'x',
      category: 'frontend',
    });
    expect(card.dataset.tags).toBe('one two three');
  });

  it('handles empty tags array', async () => {
    const card = await render({
      slug: 'x',
      from: 'A',
      to: 'B',
      tags: [],
      description: 'x',
      category: 'frontend',
    });
    expect(card.dataset.tags).toBe('');
  });
});
