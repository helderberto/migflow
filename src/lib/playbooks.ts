import type { Category, CategoryStyle } from '@/types';

export const CATEGORIES = [
  'frontend',
  'backend',
  'data',
  'language',
  'infra',
] as const satisfies ReadonlyArray<Category>;

export const categoryMeta: Record<Category, CategoryStyle> = {
  frontend: {
    color: 'border-l-blue-400',
    pill: 'text-blue-700   dark:text-blue-300   bg-blue-50   dark:bg-blue-400/10',
  },
  backend: {
    color: 'border-l-purple-400',
    pill: 'text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-400/10',
  },
  data: {
    color: 'border-l-orange-400',
    pill: 'text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-400/10',
  },
  language: {
    color: 'border-l-cyan-400',
    pill: 'text-cyan-700   dark:text-cyan-300   bg-cyan-50   dark:bg-cyan-400/10',
  },
  infra: {
    color: 'border-l-yellow-400',
    pill: 'text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-400/10',
  },
};
