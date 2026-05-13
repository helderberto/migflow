import type { APIRoute } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import { buildClaudePrompt, buildGeminiPrompt } from '@/lib';

export async function getStaticPaths() {
  const playbooks = await getCollection('playbooks');
  return playbooks
    .filter((p) => !p.data.draft)
    .map((p) => ({ params: { slug: p.slug }, props: { playbook: p } }));
}

type Props = { playbook: CollectionEntry<'playbooks'> };

export const GET: APIRoute = async ({ props }) => {
  const { playbook } = props as Props;
  const { from, to } = playbook.data;
  const promptInput = { from, to, body: playbook.body };

  const payload = {
    slug: playbook.slug,
    url: `/playbooks/${playbook.slug}`,
    ...playbook.data,
    body: playbook.body,
    prompts: {
      claude: buildClaudePrompt(promptInput),
      gemini: buildGeminiPrompt(promptInput),
    },
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
