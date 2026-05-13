export function formatResultsCount(
  visible: number,
  total: number,
  query: string,
  activeCategory: string,
): string {
  if (query.trim() === '' && activeCategory === 'all') return '';
  return `${visible} of ${total} playbooks`;
}
