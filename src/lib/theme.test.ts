import { describe, it, expect } from 'vitest';
import { THEMES, THEME_ICONS, isTheme, nextTheme, readStoredTheme, resolveDarkMode } from './theme';

describe('THEMES', () => {
  it('orders the cycle as system → light → dark', () => {
    expect(THEMES).toEqual(['system', 'light', 'dark']);
  });
});

describe('THEME_ICONS', () => {
  it('has a glyph for every theme', () => {
    for (const t of THEMES) {
      expect(THEME_ICONS[t]).toBeTruthy();
    }
  });
});

describe('isTheme', () => {
  it.each(['system', 'light', 'dark'])('accepts %s', (t) => {
    expect(isTheme(t)).toBe(true);
  });

  it.each(['', 'auto', null, undefined])('rejects %s', (t) => {
    expect(isTheme(t)).toBe(false);
  });
});

describe('readStoredTheme', () => {
  it('returns the stored theme when valid', () => {
    expect(readStoredTheme({ getItem: () => 'dark' })).toBe('dark');
  });

  it('falls back to system when storage is empty', () => {
    expect(readStoredTheme({ getItem: () => null })).toBe('system');
  });

  it('falls back to system on garbage values', () => {
    expect(readStoredTheme({ getItem: () => 'auto' })).toBe('system');
  });
});

describe('nextTheme', () => {
  it('cycles system → light → dark → system', () => {
    expect(nextTheme('system')).toBe('light');
    expect(nextTheme('light')).toBe('dark');
    expect(nextTheme('dark')).toBe('system');
  });
});

describe('resolveDarkMode', () => {
  it('forces dark when theme=dark regardless of OS preference', () => {
    expect(resolveDarkMode('dark', false)).toBe(true);
    expect(resolveDarkMode('dark', true)).toBe(true);
  });

  it('forces light when theme=light regardless of OS preference', () => {
    expect(resolveDarkMode('light', false)).toBe(false);
    expect(resolveDarkMode('light', true)).toBe(false);
  });

  it('follows OS preference when theme=system', () => {
    expect(resolveDarkMode('system', true)).toBe(true);
    expect(resolveDarkMode('system', false)).toBe(false);
  });
});
