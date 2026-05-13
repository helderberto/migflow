import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { buildLlmsTxt } from '@/lib';

export const GET: APIRoute = async () => {
  const playbooks = (await getCollection('playbooks'))
    .filter((p) => !p.data.draft)
    .map((p) => ({
      slug: p.slug,
      category: p.data.category,
      from: p.data.from,
      to: p.data.to,
      description: p.data.description,
    }));

  return new Response(buildLlmsTxt(playbooks), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
