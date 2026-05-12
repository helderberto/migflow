# MigFlow

> Agent-friendly and engineer-friendly playbooks for migrating legacy stacks to modern ones.

**Live:** <https://migflow.dev>

---

## What it is

A site and toolkit that helps AI agents (Claude, Cursor, Windsurf, Gemini, etc.) and engineers execute reliable, repeatable code migrations.

Each migration is a **playbook**: structured instructions, explicit constraints, real before/after examples, and a ready-to-use AI prompt — all designed to reduce ambiguity and enable deterministic AI-assisted migrations.

---

## How to use it

### As an engineer

Browse the site, find your migration, copy the playbook for your AI tool of choice (one-click).

### As an AI agent

Three programmatic channels — all returning the same content:

| Channel | Endpoint | Use case |
|---|---|---|
| **MCP** | `/api/mcp` | Native integration for Claude Code, Claude Desktop, Cursor, Windsurf, and any MCP-compatible client |
| **JSON API** | `/playbooks.json`, `/playbooks/<slug>.json` | Scripts, CI, non-MCP automation |
| **llms.txt** | `/llms.txt` | RAG indexers, ChatGPT context loaders, llmstxt.org-aware tools |

See <https://migflow.dev/agents> for connection snippets and the MCP tool catalog.

---

## Playbook anatomy

Every playbook follows the same 9-section structure so AI agents can parse them deterministically:

1. **Philosophy shift** — the conceptual mental model change
2. **Setup** — install/uninstall commands
3. **Core transformations** — before/after code examples
4. **When NOT to migrate** — explicit anti-cases
5. **Pitfalls** — known gotchas
6. **Validation checklist** — yes/no verification questions
7. **Codemod references** — automated tools where they exist
8. **AI Prompt** — ready-to-use prompt for executing the migration
9. **References** — authoritative documentation

---

## Categories

| Category | Examples |
|----------|---------|
| `frontend` | Enzyme → RTL, CRA → Vite, Cypress → Playwright, Class → Functional, Redux → RTK, Pretender → MSW |
| `backend` | Express → Fastify |
| `data` | Moment.js → date-fns, Lodash → native |
| `language` | JavaScript → TypeScript, Flow → TypeScript, PropTypes → TypeScript, Callbacks → async/await |
| `infra` | Webpack → Vite, Jest → Vitest, CommonJS → ESM |

---

## Repository structure

```
.
├── site/                          # Astro site (deployed)
│   └── src/
│       ├── content/
│       │   └── playbooks/         # all playbooks as flat .md files
│       ├── pages/
│       │   ├── index.astro        # listing + search
│       │   ├── agents.astro       # MCP / JSON / llms.txt docs
│       │   ├── submit.astro       # contribute via GitHub PR
│       │   ├── playbooks/[slug].astro       # detail page
│       │   ├── playbooks/[slug].json.ts     # JSON endpoint
│       │   ├── playbooks.json.ts            # list endpoint
│       │   ├── llms.txt.ts                  # llms.txt endpoint
│       │   └── api/[transport].ts           # MCP server
│       └── ...
├── .github/                       # issue / PR templates, CI workflow
├── AGENTS.md                      # project conventions (loaded by AI tools)
├── CLAUDE.md                      # → AGENTS.md
└── README.md
```

---

## Design principles

- Deterministic over clever
- Explicit over implicit
- Structured over verbose
- Real examples over abstractions

---

## What this is NOT

- Not a prompt collection
- Not human-only documentation
- Not theoretical guides

This is a machine-oriented migration system.

---

## Contributing

The fastest path is the [**Submit** page](https://migflow.dev/submit): it scaffolds a GitHub PR with the correct file structure.

### Manual contribution

1. Create `site/src/content/playbooks/<from>-to-<to>.md`
2. Add frontmatter (see existing playbooks)
3. Follow the 9-section structure
4. Place under the correct `category` (`frontend`, `backend`, `data`, `language`, `infra`)
5. Open a PR

### PR checklist

- [ ] Clear migration (X → Y)
- [ ] Correct category
- [ ] All 9 sections present
- [ ] Real before/after examples
- [ ] Validation checklist with concrete items
- [ ] AI Prompt that runs end-to-end

---

## Local development

```bash
cd site
npm install
npm run dev          # http://localhost:4321
npm run build        # build for production
```

The site uses Astro 5 with the Vercel adapter. All pages are prerendered as static HTML except `/api/*`, which runs as a serverless function (the MCP server).

---

## License

[MIT](LICENSE) — Helder Burato Berto
