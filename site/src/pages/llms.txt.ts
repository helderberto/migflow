import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { CATEGORIES } from "../lib/playbooks";

export const GET: APIRoute = async () => {
  const playbooks = (await getCollection("playbooks")).filter((p) => !p.data.draft);

  const lines: string[] = [
    "# MigFlow",
    "",
    "> Agent-friendly migration playbooks for legacy → modern stacks. Each playbook is structured for AI execution: philosophy, setup, before/after transformations, pitfalls, validation checklist, and a ready-to-use prompt.",
    "",
    "## Index",
    "",
    `- [All playbooks (JSON)](/playbooks.json): machine-readable list of every playbook.`,
    "",
  ];

  for (const category of CATEGORIES) {
    const inCategory = playbooks
      .filter((p) => p.data.category === category)
      .sort((a, b) => a.data.from.localeCompare(b.data.from));

    if (inCategory.length === 0) continue;

    lines.push(`## ${category}`);
    lines.push("");
    for (const p of inCategory) {
      lines.push(
        `- [${p.data.from} → ${p.data.to}](/playbooks/${p.slug}.json): ${p.data.description}`,
      );
    }
    lines.push("");
  }

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
