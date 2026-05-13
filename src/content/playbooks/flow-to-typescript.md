---
from: "Flow"
to: "TypeScript"
category: "language"
tags: ["typescript", "flow", "types"]
description: "Replace Flow type annotations with TypeScript equivalents across a JavaScript codebase."
draft: false
---

# Flow → TypeScript

## Philosophy shift

Flow and TypeScript both add static typing to JavaScript, but their type systems differ in subtle ways. Flow strips types with Babel; TypeScript uses its own compiler (`tsc`). Most type syntax maps 1-to-1, but soundness rules, utility types, and tooling integration differ.

**Rule:** Migrate one file at a time. Remove `// @flow` and the Flow Babel plugin after all files are converted. Never run both type checkers on the same file.

## Setup

Remove Flow:
```bash
npm uninstall flow-bin @babel/preset-flow babel-plugin-transform-flow-strip-types
```

Install TypeScript:
```bash
npm install --save-dev typescript
npx tsc --init
```

Remove `@babel/preset-flow` from `.babelrc` / `babel.config.js`. Add `@babel/preset-typescript` if using Babel:
```bash
npm install --save-dev @babel/preset-typescript
```

## Core transformations

### File headers

```ts
// Flow — required header
// @flow

// TypeScript — no header needed, just rename .js → .ts / .jsx → .tsx
```

### Primitive types

```ts
// Flow
(x: string)
(x: number)
(x: boolean)
(x: null)
(x: void)   // undefined
(x: mixed)  // unknown in TS
(x: any)

// TypeScript
(x: string)
(x: number)
(x: boolean)
(x: null)
(x: undefined)
(x: unknown)
(x: any)    // avoid — use unknown
```

### Maybe types

```ts
// Flow
(x: ?string)  // string | null | undefined

// TypeScript
(x: string | null | undefined)
// or with strictNullChecks:
(x?: string)  // only for optional params
```

### Type aliases

```ts
// Flow
type User = { id: string, name: string };
type ID = string | number;

// TypeScript
type User = { id: string; name: string };
type ID = string | number;
```

Note: Flow uses commas in object types; TypeScript uses semicolons (both work, but semicolons are conventional).

### Interfaces

```ts
// Flow
interface Animal {
  name: string;
  sound(): string;
}

// TypeScript — same syntax
interface Animal {
  name: string;
  sound(): string;
}
```

### Generics

```ts
// Flow
type Container<T> = { value: T };
function identity<T>(x: T): T { return x; }

// TypeScript — same syntax
type Container<T> = { value: T };
function identity<T>(x: T): T { return x; }
```

### Exact object types

```ts
// Flow — exact type (no extra properties allowed)
type Exact = {| id: string, name: string |};

// TypeScript — all object types are exact by default
type Exact = { id: string; name: string };
```

### Opaque types

```ts
// Flow
opaque type UserID = string;

// TypeScript — no direct equivalent; use branded types
type UserID = string & { readonly __brand: 'UserID' };
const userId = 'abc' as UserID;
```

### Utility types

| Flow | TypeScript |
|------|------------|
| `$ReadOnly<T>` | `Readonly<T>` |
| `$ReadOnlyArray<T>` | `ReadonlyArray<T>` |
| `$Keys<T>` | `keyof T` |
| `$Values<T>` | `T[keyof T]` |
| `$Diff<A, B>` | `Omit<A, keyof B>` |
| `$Pick<T, K>` | `Pick<T, K>` |
| `$ObjMap<T, F>` | `{ [K in keyof T]: ReturnType<F> }` |
| `Class<T>` | `new (...args: unknown[]) => T` |
| `$Shape<T>` | `Partial<T>` |
| `$Exact<T>` | `T` (TS is exact by default) |
| `$NonMaybeType<T>` | `NonNullable<T>` |

### React types

```ts
// Flow
import type { Node, Element, ComponentType } from 'react';
(props: {| children: Node |})

// TypeScript
import type { ReactNode, ReactElement, ComponentType } from 'react';
(props: { children: ReactNode })
```

### Type casting

```ts
// Flow
(value: string)  // inline cast

// TypeScript
value as string
// or (less preferred)
<string>value
```

### Variance annotations

```ts
// Flow
type ReadOnly<T> = { +value: T };   // covariant
type WriteOnly<T> = { -value: T };  // contravariant

// TypeScript
type ReadOnly<T> = { readonly value: T };
// Contravariance is inferred by TS; no explicit annotation for write-only
```

## When NOT to migrate

- Codebase depends on Flow-only features without TS equivalents (advanced opaque types, variance patterns) — rare but possible.
- Project uses Babel + Flow-strip without a TS build step — TS adds compile cost.
- Active Flow-based libraries without `@types/*` packages — migration creates a dependency gap.

## Pitfalls

- **`?T` in Flow ≠ `T?` or `T | undefined`** — Flow's maybe type is `T | null | undefined`. TypeScript splits these: optional params (`?`) and explicit `| null`.
- **Flow's structural subtyping allows extra props** by default; exact types (`{| |}`) don't — TypeScript's object types are exact by default.
- **`mixed` → `unknown`, not `any`** — `any` skips type checking; `unknown` forces narrowing.
- **Flow supports `%checks` type guards** — replace with TypeScript's `x is T` predicates.
- **`$FlowFixMe` → `@ts-ignore`** — migrate suppression comments to the TS equivalent and add a comment explaining why.
- **Flow enums** (newer Flow feature) → TypeScript union types or `const` objects.

## Validation checklist

- [ ] No `// @flow` headers remaining
- [ ] All `.js` files with Flow types renamed to `.ts` / `.tsx`
- [ ] `flow-bin` and `@babel/preset-flow` removed
- [ ] `tsc --noEmit` passes
- [ ] Flow utility types replaced (`$Keys` → `keyof`, `$Shape` → `Partial`, etc.)
- [ ] No `$FlowFixMe` left — converted to `@ts-ignore` with justification
- [ ] Opaque types preserved via branded types

## Codemod references

- [flow-to-ts](https://github.com/Khan/flow-to-ts) — Khan Academy's codemod; covers most syntactic mappings (also linked in references).
- Manual review needed for `%checks` predicates, opaque types, and complex variance annotations.

## AI Prompt

```
You are migrating a Flow-typed JavaScript file to TypeScript.

Rules:
1. Remove the `// @flow` header.
2. Rename the file extension: .js → .ts, .jsx → .tsx.
3. Map Flow types to TypeScript equivalents:
   - ?T → T | null | undefined
   - mixed → unknown
   - {| ... |} (exact) → { ... } (TS is exact by default)
   - $ReadOnly<T> → Readonly<T>, $Keys<T> → keyof T, $Shape<T> → Partial<T>
4. Replace inline Flow casts `(value: T)` with `value as T`.
5. Replace $FlowFixMe with @ts-ignore and a comment explaining why.
6. Do not change runtime logic — only update type annotations.

Migrate the following file:
```

## References

- [Flow → TypeScript migration guide](https://medium.com/hackmamba/migrating-from-flow-to-typescript-b4d0d0aced7)
- [TypeScript utility types](https://www.typescriptlang.org/docs/handbook/utility-types.html)
- [flow-to-ts codemod](https://github.com/Khan/flow-to-ts)
