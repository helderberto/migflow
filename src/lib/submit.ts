import { CATEGORIES } from '@/lib/playbooks';
import type {
  Category,
  GitHubUrlInput,
  SubmissionFields,
  ValidSubmission,
  ValidationResult,
} from '@/types';

export function toSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function parseTags(raw: string): ReadonlyArray<string> {
  return raw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

function isCategory(value: string): value is Category {
  return (CATEGORIES as ReadonlyArray<string>).includes(value);
}

export function validateSubmission(fields: SubmissionFields): ValidationResult {
  const from = fields.from.trim();
  const to = fields.to.trim();
  const description = fields.description.trim();
  const body = fields.body.trim();
  const { category } = fields;

  if (!from || !to || !category || !description || !body) {
    return { ok: false, error: 'Please fill in all required fields.' };
  }

  if (!isCategory(category)) {
    return { ok: false, error: 'Please choose a valid category.' };
  }

  return {
    ok: true,
    value: {
      from,
      to,
      category,
      tags: parseTags(fields.tagsRaw),
      description,
      body,
    },
  };
}

export function buildFrontmatter(submission: ValidSubmission): string {
  const tagList = submission.tags.map((t) => `"${t}"`).join(', ');
  return [
    '---',
    `from: "${submission.from}"`,
    `to: "${submission.to}"`,
    `category: "${submission.category}"`,
    `tags: [${tagList}]`,
    `description: "${submission.description}"`,
    'draft: false',
    '---',
  ].join('\n');
}

export function buildPlaybookFile(submission: ValidSubmission): string {
  return `${buildFrontmatter(submission)}\n\n${submission.body}`;
}

export function buildSlug(from: string, to: string): string {
  return `${toSlug(from)}-to-${toSlug(to)}`;
}

export function buildGitHubNewFileUrl(input: GitHubUrlInput): string {
  const url = new URL(`https://github.com/${input.repo}/new/${input.branch}`);
  url.searchParams.set('filename', `src/content/playbooks/${input.slug}.md`);
  url.searchParams.set('value', input.fileContent);
  url.searchParams.set('message', `feat: add ${input.from} → ${input.to} playbook`);
  return url.toString();
}
