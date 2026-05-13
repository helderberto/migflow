import type { CategoryFilter, PlaybookSearchFields } from '@/types';

export function matchesPlaybook(
  fields: PlaybookSearchFields,
  query: string,
  category: CategoryFilter,
): boolean {
  const normalizedQuery = query.toLowerCase().trim();
  const haystack = [fields.from, fields.to, fields.tags, fields.description, fields.category]
    .join(' ')
    .toLowerCase();

  const matchesText = normalizedQuery === '' || haystack.includes(normalizedQuery);
  const matchesCategory = category === 'all' || fields.category === category;

  return matchesText && matchesCategory;
}
