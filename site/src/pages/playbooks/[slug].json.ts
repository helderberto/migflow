import type { APIRoute } from "astro";
import { getCollection, type CollectionEntry } from "astro:content";

export async function getStaticPaths() {
  const playbooks = await getCollection("playbooks");
  return playbooks
    .filter((p) => !p.data.draft)
    .map((p) => ({ params: { slug: p.slug }, props: { playbook: p } }));
}

type Props = { playbook: CollectionEntry<"playbooks"> };

export const GET: APIRoute = async ({ props }) => {
  const { playbook } = props as Props;
  const { from, to } = playbook.data;

  const claudePrompt = [
    `You are an expert developer performing a code migration from ${from} to ${to}.`,
    `Follow this playbook strictly. Prioritize correctness and idiomatic ${to} patterns.`,
    `Do not leave any ${from} patterns in the migrated code.`,
    "",
    "---",
    "",
    playbook.body,
  ].join("\n");

  const geminiPrompt = [
    `Act as a senior software engineer. Migrate the following code from ${from} to ${to}.`,
    "Follow the playbook below. Validate each change against the pitfalls listed.",
    "",
    "---",
    "",
    playbook.body,
  ].join("\n");

  const payload = {
    slug: playbook.slug,
    url: `/playbooks/${playbook.slug}`,
    ...playbook.data,
    body: playbook.body,
    prompts: {
      claude: claudePrompt,
      gemini: geminiPrompt,
    },
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};
