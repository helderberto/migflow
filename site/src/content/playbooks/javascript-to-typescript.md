---
from: "JavaScript"
to: "TypeScript"
category: "language"
tags: ["typescript", "javascript", "types"]
description: "Incrementally migrate a JavaScript codebase to TypeScript with strict mode."
draft: false
---

# JavaScript → TypeScript

## Philosophy shift

TypeScript adds a static type layer on top of JavaScript. The goal is correctness at compile time, not at runtime. Start loose (`allowJs`, `noImplicitAny: false`), tighten over time.

## Setup

```bash
npm install --save-dev typescript
npx tsc --init
```

Minimal `tsconfig.json` to start:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": false,
    "allowJs": true,
    "checkJs": false,
    "outDir": "dist",
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

Enable `strict: true` once the codebase is fully converted.

## Migration

**Step 1 — Rename files one at a time**

Rename `.js` → `.ts` (or `.jsx` → `.tsx`). Fix type errors as you go. Don't rename everything at once.

**Step 2 — Add types to function signatures**

```ts
// Before
function add(a, b) {
  return a + b;
}

// After
function add(a: number, b: number): number {
  return a + b;
}
```

**Step 3 — Type objects and arrays**

```ts
// Before
const user = { id: 1, name: "Alice" };

// After
interface User {
  id: number;
  name: string;
}
const user: User = { id: 1, name: "Alice" };
```

**Step 4 — Handle `any` and third-party types**

Install type definitions for untyped packages:

```bash
npm install --save-dev @types/node @types/react
```

Avoid `any`. Prefer `unknown` when the type is genuinely unknown, then narrow it:

```ts
function parse(input: unknown): string {
  if (typeof input !== "string") throw new Error("Expected string");
  return input.toUpperCase();
}
```

## When NOT to migrate

- Codebase has < 50 files and is short-lived (prototype, demo) — overhead may exceed benefit.
- Heavy dynamic property access (`obj[k1][k2]` with dynamic keys) that TS can't type without major refactor.
- Team has no TS experience and no budget for the learning curve.
- Build-time cost is a hard constraint (rare, but valid for some hot paths).

## Common pitfalls

- **Don't add `any` to silence errors** — it defeats the purpose. Use `unknown` + guards instead.
- **`Object` is not `object`** — `object` is the correct type for non-primitive values.
- **`null` and `undefined` are separate** — with `strictNullChecks`, you must handle both explicitly.
- **Enums have runtime overhead** — prefer `const` enums or union types: `type Direction = "up" | "down"`.

## Validation checklist

- [ ] All `.js` / `.jsx` files renamed to `.ts` / `.tsx`
- [ ] `strict: true` enabled — no `any` introduced as a silencer
- [ ] No `// @ts-ignore` without explanatory comment
- [ ] All function signatures typed (params + return)
- [ ] `@types/*` installed for third-party packages
- [ ] `tsc --noEmit` runs clean in CI
- [ ] `allowJs` removed once migration completes

## Codemod references

- [ts-migrate](https://github.com/airbnb/ts-migrate) — Airbnb's tool; adds `any` everywhere as scaffold, requires a follow-up tightening pass.
- [react-javascript-to-typescript-transform](https://github.com/lyft/react-javascript-to-typescript-transform) — Lyft's React-specific codemod (also covers PropTypes).

## AI Prompt

```
You are migrating a JavaScript file to TypeScript.

Rules:
1. Rename .js to .ts (or .jsx to .tsx for React components).
2. Add explicit types to all function parameters and return values.
3. Replace object literals used as types with interfaces or type aliases.
4. Never use `any`. Use `unknown` with type narrowing when the type is unclear.
5. Use union types instead of enums where possible.
6. Do not change runtime logic — only add type annotations.

Migrate the following file:
```
