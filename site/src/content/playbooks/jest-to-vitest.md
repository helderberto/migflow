---
from: "Jest"
to: "Vitest"
category: "infra"
tags: ["testing", "vitest", "jest", "vite"]
description: "Replace Jest with Vitest for faster test execution in Vite-based projects."
draft: false
---

# Jest → Vitest

## Philosophy shift

Vitest reuses Vite's transform pipeline. No separate Babel config, no separate module resolver — it shares the same config as your app. Tests run faster because the same bundler graph is reused.

**Rule:** If your project already uses Vite, Vitest is a drop-in replacement. If it doesn't, weigh the cost of adding Vite before migrating.

## Setup

Remove Jest:
```bash
npm uninstall jest babel-jest @types/jest ts-jest jest-environment-jsdom
```

Install Vitest:
```bash
npm install --save-dev vitest @vitest/coverage-v8
```

For DOM tests, also install:
```bash
npm install --save-dev @testing-library/jest-dom jsdom
```

## Configure

`vite.config.ts` (or `vitest.config.ts`):
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
    },
  },
});
```

Add to `tsconfig.json`:
```json
{
  "compilerOptions": {
    "types": ["vitest/globals"]
  }
}
```

Update `package.json` scripts:
```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "coverage": "vitest run --coverage"
  }
}
```

## Core transformations

### Imports

```ts
// Jest (no import needed with globals)
describe('...', () => { ... });

// Vitest — explicit import (recommended even with globals: true)
import { describe, it, expect, vi } from 'vitest';
```

### Mocks

```ts
// Jest
jest.fn()
jest.spyOn(obj, 'method')
jest.mock('../module')
jest.clearAllMocks()

// Vitest
vi.fn()
vi.spyOn(obj, 'method')
vi.mock('../module')
vi.clearAllMocks()
```

### Timers

```ts
// Jest
jest.useFakeTimers();
jest.runAllTimers();
jest.useRealTimers();

// Vitest
vi.useFakeTimers();
vi.runAllTimers();
vi.useRealTimers();
```

### Module resets

```ts
// Jest
jest.resetModules();
jest.isolateModules(() => { ... });

// Vitest
vi.resetModules();
// isolateModules has no direct equivalent — use dynamic imports instead
```

### Environment variables

```ts
// Jest
process.env.API_URL = 'http://test';

// Vitest — same syntax works, but prefer importMeta.env for Vite projects
import.meta.env.VITE_API_URL
```

## When NOT to migrate

- Project doesn't use Vite (still on CRA or custom Webpack) — Vitest's main value comes from sharing the Vite pipeline.
- Heavy reliance on Jest-only APIs (`jest.requireActual` interplay, custom transformers) with no clean Vitest equivalent.
- Snapshots require Jest-specific serializers not supported by Vitest.

## Pitfalls

- **`__mocks__` directories work**, but auto-mocking behavior differs slightly. Test with `vi.mock()` explicitly.
- **`jest.config.js` is replaced** by `vitest.config.ts` — don't maintain both.
- **`moduleNameMapper` → `resolve.alias`** in `vite.config.ts`.
- **`testPathPattern` CLI flag** → `vitest --reporter=verbose <pattern>`.
- **`globals: true` requires tsconfig types** — add `"vitest/globals"` to avoid TS errors on `describe`, `it`, etc.
- **`jest.setTimeout` → `vi.setConfig({ testTimeout: N })`** or per-test `{ timeout: N }` option.

## Validation checklist

- [ ] All `jest.*` calls replaced with `vi.*`
- [ ] Explicit imports from `vitest` in every test file (don't rely solely on globals)
- [ ] `jest.config.*` deleted; `vitest.config.ts` defines test setup
- [ ] `moduleNameMapper` migrated to `resolve.alias` in vite config
- [ ] All tests pass under `vitest run`
- [ ] CI scripts call `vitest` (no `jest` binary references remain)

## Codemod references

- [jest-to-vitest codemod](https://github.com/trivikr/jest-to-vitest) — covers most mechanical replacements (`jest.*` → `vi.*`).
- [Vitest migration guide](https://vitest.dev/guide/migration.html) lists what is NOT auto-convertible.

## AI Prompt

```
You are migrating a test file from Jest to Vitest.

Rules:
1. Replace all `jest.*` calls with `vi.*` equivalents (jest.fn → vi.fn, jest.mock → vi.mock, etc.).
2. Add explicit imports: `import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'`.
3. Do not change test logic, assertions, or test descriptions.
4. Replace `jest.setTimeout(n)` with a `{ timeout: n }` option on the test/describe block.
5. Do not add or remove test cases.

Migrate the following file:
```

## References

- [Vitest migration guide](https://vitest.dev/guide/migration.html)
- [Vitest config reference](https://vitest.dev/config/)
- [vi mock API](https://vitest.dev/api/vi.html)
