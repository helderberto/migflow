import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

export const GET: APIRoute = async () => {
  const playbooks = await getCollection("playbooks");

  const items = playbooks
    .filter((p) => !p.data.draft)
    .sort((a, b) => a.data.from.localeCompare(b.data.from))
    .map((p) => ({
      slug: p.slug,
      url: `/playbooks/${p.slug}`,
      json: `/playbooks/${p.slug}.json`,
      from: p.data.from,
      to: p.data.to,
      category: p.data.category,
      tags: p.data.tags,
      description: p.data.description,
    }));

  return new Response(JSON.stringify({ count: items.length, playbooks: items }, null, 2), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};
