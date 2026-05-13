import { describe, it, expect, beforeAll } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import CopyButton from './CopyButton.astro';

async function render(props: { label: string; content: string; variant?: 'default' | 'primary' }) {
  const container = await AstroContainer.create();
  const html = await container.renderToString(CopyButton, { props });
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.querySelector('button.copy-btn') as HTMLButtonElement;
}

describe('CopyButton.astro', () => {
  let defaultBtn: HTMLButtonElement;
  let primaryBtn: HTMLButtonElement;

  beforeAll(async () => {
    defaultBtn = await render({ label: 'Raw markdown', content: 'hello' });
    primaryBtn = await render({
      label: 'Claude Code',
      content: 'prompt body',
      variant: 'primary',
    });
  });

  it('renders the label', () => {
    expect(defaultBtn.querySelector('.btn-label')?.textContent).toBe('Raw markdown');
  });

  it('stores the content in data-content for the runtime script to read', () => {
    expect(defaultBtn.getAttribute('data-content')).toBe('hello');
  });

  it('sets a descriptive aria-label', () => {
    expect(defaultBtn.getAttribute('aria-label')).toBe('Copy playbook for Raw markdown');
  });

  it('defaults to the default variant', () => {
    expect(defaultBtn.getAttribute('data-variant')).toBe('default');
    expect(defaultBtn.className).toContain('bg-white');
  });

  it('applies primary styling when variant=primary', () => {
    expect(primaryBtn.getAttribute('data-variant')).toBe('primary');
    expect(primaryBtn.className).toContain('bg-green-700');
  });

  it('starts with the copy icon visible and the check icon hidden', () => {
    const copyIcon = defaultBtn.querySelector('.copy-icon') as Element;
    const checkIcon = defaultBtn.querySelector('.check-icon') as Element;
    expect(copyIcon.classList.contains('hidden')).toBe(false);
    expect(checkIcon.classList.contains('hidden')).toBe(true);
  });

  it('includes both copy and check svg icons', () => {
    expect(defaultBtn.querySelectorAll('svg').length).toBe(2);
  });

  it('preserves multi-line content verbatim in data-content', async () => {
    const btn = await render({ label: 'x', content: 'line1\nline2\nline3' });
    expect(btn.getAttribute('data-content')).toBe('line1\nline2\nline3');
  });
});
