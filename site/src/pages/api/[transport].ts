import type { APIRoute } from "astro";
import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { getCollection, getEntry } from "astro:content";
import { CATEGORIES } from "../../lib/playbooks";

export const prerender = false;

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      "list_playbooks",
      {
        title: "List playbooks",
        description:
          "List all migration playbooks. Optionally filter by category or tag. Returns slug, from, to, category, tags, and description for each.",
        inputSchema: {
          category: z.enum(CATEGORIES).optional(),
          tag: z.string().optional(),
        },
      },
      async ({ category, tag }) => {
        const all = await getCollection("playbooks");
        const matches = all
          .filter((p) => !p.data.draft)
          .filter((p) => !category || p.data.category === category)
          .filter((p) => !tag || p.data.tags.includes(tag))
          .map((p) => ({
            slug: p.slug,
            from: p.data.from,
            to: p.data.to,
            category: p.data.category,
            tags: p.data.tags,
            description: p.data.description,
          }));

        return {
          content: [
            { type: "text", text: JSON.stringify({ count: matches.length, playbooks: matches }, null, 2) },
          ],
        };
      },
    );

    server.registerTool(
      "get_playbook",
      {
        title: "Get playbook",
        description:
          "Fetch a single playbook by slug. Returns full markdown body and metadata. Use list_playbooks first to discover slugs.",
        inputSchema: {
          slug: z.string().describe("Playbook slug, e.g. 'enzyme-to-rtl'"),
        },
      },
      async ({ slug }) => {
        const playbook = await getEntry("playbooks", slug);
        if (!playbook || playbook.data.draft) {
          return {
            content: [{ type: "text", text: `Playbook not found: ${slug}` }],
            isError: true,
          };
        }
        const { from, to, category, tags, description } = playbook.data;
        const header = [
          `# ${from} → ${to}`,
          "",
          `**Category:** ${category}  `,
          `**Tags:** ${tags.join(", ")}  `,
          `**Description:** ${description}`,
          "",
          "---",
          "",
        ].join("\n");
        return {
          content: [{ type: "text", text: header + playbook.body }],
        };
      },
    );

    server.registerTool(
      "search_playbooks",
      {
        title: "Search playbooks",
        description:
          "Free-text search across playbook titles, descriptions, tags, and full markdown bodies. Returns matching slugs with snippet.",
        inputSchema: {
          query: z.string().min(1).describe("Search query, e.g. 'redux toolkit'"),
        },
      },
      async ({ query }) => {
        const q = query.toLowerCase();
        const all = await getCollection("playbooks");
        const matches = all
          .filter((p) => !p.data.draft)
          .filter((p) => {
            const haystack = [
              p.data.from,
              p.data.to,
              p.data.description,
              p.data.tags.join(" "),
              p.body,
            ]
              .join(" ")
              .toLowerCase();
            return haystack.includes(q);
          })
          .map((p) => ({
            slug: p.slug,
            from: p.data.from,
            to: p.data.to,
            description: p.data.description,
          }));

        if (matches.length === 0) {
          return {
            content: [{ type: "text", text: `No playbooks match "${query}".` }],
          };
        }

        const lines = matches.map(
          (m) => `- ${m.slug}: ${m.from} → ${m.to} — ${m.description}`,
        );
        return {
          content: [
            {
              type: "text",
              text: `Found ${matches.length} playbook(s) matching "${query}":\n\n${lines.join("\n")}`,
            },
          ],
        };
      },
    );
  },
  {
    serverInfo: {
      name: "migflow",
      version: "0.1.0",
    },
  },
  {
    basePath: "/api",
    disableSse: true,
    verboseLogs: false,
  },
);

export const GET: APIRoute = ({ request }) => handler(request);
export const POST: APIRoute = ({ request }) => handler(request);
export const DELETE: APIRoute = ({ request }) => handler(request);
