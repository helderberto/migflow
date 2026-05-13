import type { Theme } from '@/types';

export const THEMES = ['system', 'light', 'dark'] as const satisfies ReadonlyArray<Theme>;

export const THEME_ICONS: Record<Theme, string> = {
  system: '◐',
  light: '○',
  dark: '●',
};

export function isTheme(value: string | null | undefined): value is Theme {
  return value === 'system' || value === 'light' || value === 'dark';
}

export function readStoredTheme(storage: Pick<Storage, 'getItem'>): Theme {
  const stored = storage.getItem('theme');
  return isTheme(stored) ? stored : 'system';
}

export function nextTheme(current: Theme): Theme {
  const index = THEMES.indexOf(current);
  return THEMES[(index + 1) % THEMES.length];
}

export function resolveDarkMode(theme: Theme, prefersDark: boolean): boolean {
  if (theme === 'dark') return true;
  if (theme === 'light') return false;
  return prefersDark;
}
