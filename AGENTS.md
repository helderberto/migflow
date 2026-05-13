# MigFlow — Project Rules

## Module layout

- **`src/types/*`** — types only. No runtime values. Always re-exported through `src/types/index.ts` (barrel) so consumers import from `@/types`, never `@/types/playbooks`.
- **`src/lib/*`** — pure runtime logic. Always re-exported through `src/lib/index.ts` (barrel). External consumers (pages, components, layouts) import from `@/lib`.
- **`src/pages/*` / `src/components/*` / `src/layouts/*`** — Astro surfaces. Keep them thin; push logic into `@/lib`.

## Barrel rules

- Every `src/<folder>/` exports via `index.ts`.
- **Inside a folder**, modules import from siblings with relative paths (`./theme`, not `@/lib`) to avoid circular-barrel resolution.
- **Outside the folder**, consumers always import from the barrel: `@/lib`, `@/types`.

## Imports

- Use the `@/*` alias (configured in `tsconfig.json` + `vitest.config.ts`). No `../../` for cross-folder imports inside `src/`.
- Type-only imports: `import type { ... } from "@/types";`.

## Deep modules (Ousterhout)

Prefer **simple interfaces over large implementations**. A function/module earns its place when its public surface is small relative to the complexity it hides.

- One exported function with a clear contract > five thin wrappers around the same thing.
- If a module's `.d.ts` is bigger than its `.ts`, the abstraction is too shallow — inline it.
- Avoid pass-through layers (`foo()` that just calls `bar()`). Either add value or delete.

## Tests

- Vitest only. No React. No RTL. Astro Container API for `.astro` rendering.
- `src/**/*.test.ts` colocated with the module under test.
- Test pure logic in `@/lib`. Don't snapshot markup.
