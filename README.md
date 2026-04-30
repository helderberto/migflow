# migflow

> Agent-friendly and engineer-friendly playbooks for migrating legacy stacks to modern ones.

---

## Purpose

Designed to be consumed by AI systems (Claude, Gemini, GPT, agents) and engineers to execute reliable, repeatable code migrations.

Instead of generic prompts, it provides:

- Structured migration instructions
- Explicit constraints and rules
- Real before/after examples
- Known pitfalls and edge cases

The goal is to reduce ambiguity and enable deterministic AI-assisted migrations.

---

## Core idea

Each migration is a playbook an AI can follow.

A playbook is not documentation — it is:

- A set of instructions
- A set of constraints
- A transformation strategy

---

## Categories

| Category | Examples |
|----------|---------|
| `frontend` | Enzyme → RTL, Cypress → Playwright, CRA → Vite |
| `backend` | Express → Fastify, REST → tRPC |
| `data` | Moment.js → date-fns, Lodash → native |
| `language` | JavaScript → TypeScript, Flow → TypeScript |
| `infra` | Webpack → Vite, Jest → Vitest |

---

## Playbook structure

```
/playbooks/
  /frontend/
    /enzyme-to-react-testing-library/
      ├── playbook.md        # structured instructions for AI
      ├── prompts.md         # reusable prompts
      ├── before/            # input examples
      ├── after/             # expected output
      ├── pitfalls.md        # edge cases and known issues
      ├── skills.md          # concepts required for correct migration
      └── references.md      # contextual documentation
```

---

## How AIs should use this

1. Read `playbook.md` for rules and constraints
2. Use `prompts.md` as a base for execution
3. Validate transformations against `after/` examples
4. Check `pitfalls.md` to avoid common mistakes
5. Use `skills.md` to understand intent (not just syntax)

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

Contributions must follow the structure strictly to remain useful for AI systems.

### Requirements

- Clear migration (X → Y)
- Deterministic transformation rules
- Real before/after examples
- Explicit constraints
- Documented pitfalls

### PR checklist

- [ ] Placed in the correct category folder (`frontend/`, `backend/`, `data/`, `language/`, `infra/`)
- [ ] Includes `playbook.md` with clear rules
- [ ] Includes before/after examples
- [ ] Includes prompts
- [ ] Documents pitfalls
- [ ] Follows folder structure

---

## Vision

As AI becomes part of development workflows, migrations should become faster, safer, and repeatable. migflow standardizes that process.

---

## License

[MIT](LICENSE) - Helder Burato Berto
