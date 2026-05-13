import { CATEGORIES } from '@/lib/playbooks';
import type { LlmsPlaybook } from '@/types';

const HEADER = [
  '# MigFlow',
  '',
  '> Agent-friendly migration playbooks for legacy → modern stacks. Each playbook is structured for AI execution: philosophy, setup, before/after transformations, pitfalls, validation checklist, and a ready-to-use prompt.',
  '',
  '## Index',
  '',
  '- [All playbooks (JSON)](/playbooks.json): machine-readable list of every playbook.',
  '',
];

export function buildLlmsTxt(playbooks: ReadonlyArray<LlmsPlaybook>): string {
  const lines: string[] = [...HEADER];

  for (const category of CATEGORIES) {
    const inCategory = playbooks
      .filter((p) => p.category === category)
      .slice()
      .sort((a, b) => a.from.localeCompare(b.from));

    if (inCategory.length === 0) continue;

    lines.push(`## ${category}`);
    lines.push('');
    for (const p of inCategory) {
      lines.push(`- [${p.from} → ${p.to}](/playbooks/${p.slug}.json): ${p.description}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
