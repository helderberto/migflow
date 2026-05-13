import type { PromptInput } from '@/types';

const SEPARATOR = '\n\n---\n\n';

export function buildClaudePrompt({ from, to, body }: PromptInput): string {
  const intro = [
    `You are an expert developer performing a code migration from ${from} to ${to}.`,
    `Follow this playbook strictly. Prioritize correctness and idiomatic ${to} patterns.`,
    `Do not leave any ${from} patterns in the migrated code.`,
  ].join('\n');

  return `${intro}${SEPARATOR}${body}`;
}

export function buildGeminiPrompt({ from, to, body }: PromptInput): string {
  const intro = [
    `Act as a senior software engineer. Migrate the following code from ${from} to ${to}.`,
    'Follow the playbook below. Validate each change against the pitfalls listed.',
  ].join('\n');

  return `${intro}${SEPARATOR}${body}`;
}
