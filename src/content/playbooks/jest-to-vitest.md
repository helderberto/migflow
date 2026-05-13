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

Remove Jest and its ecosystem:
```bash
npm uninstall jest babel-jest @types/jest ts-jest jest-environment-jsdom \
  jest-axe jest-dom jest-canvas-mock
```

Install Vitest:
```bash
npm install --save-dev vitest @vitest/coverage-v8
```

For DOM tests, also install:
```bash
npm install --save-dev jsdom vitest-dom vitest-axe vitest-canvas-mock
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

## Config-to-config mapping

| Jest key (`jest.config.js`)      | Vitest equivalent (`vitest.config.ts`)               |
| -------------------------------- | ---------------------------------------------------- |
| `testEnvironment`                | `test.environment`                                   |
| `testMatch` / `testRegex`        | `test.include` (glob array)                          |
| `testPathIgnorePatterns`         | `test.exclude`                                       |
| `moduleNameMapper`               | `resolve.alias` (at root, not under `test`)          |
| `setupFiles`                     | `test.setupFiles`                                    |
| `setupFilesAfterEach`            | `test.setupFiles` (Vitest doesn't split phases)      |
| `globalSetup` / `globalTeardown` | `test.globalSetup`                                   |
| `coverageThreshold`              | `test.coverage.thresholds`                           |
| `collectCoverageFrom`            | `test.coverage.include`                              |
| `coveragePathIgnorePatterns`     | `test.coverage.exclude`                              |
| `transform`                      | Vite plugins (`@vitejs/plugin-react`, etc.) — delete |
| `transformIgnorePatterns`        | `server.deps.inline` (rarely needed)                 |
| `testTimeout`                    | `test.testTimeout`                                   |

Concrete example:

```js
// jest.config.js (before)
module.exports = {
  testEnvironment: 'jsdom',
  setupFiles: ['./jest.setup.ts'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  coverageThreshold: { global: { lines: 80 } },
};
```

```ts
// vitest.config.ts (after)
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./jest.setup.ts'],
    coverage: { thresholds: { lines: 80 } },
  },
});
```

### Per-file environment override

```ts
// Jest — JSDoc pragma at top of file
/** @jest-environment jsdom */

// Vitest — line comment at top of file
// @vitest-environment jsdom
```

Use to override the default `environment` for a single test file (e.g., a node-only test in a jsdom-default project).

## Automated codemods

Run these one-liners from the repo root. They use only `find` + `sed` — no extra tools needed.

```bash
# jest.<method>() → vi.<method>()
find . -name '*.test.*' -not -path '*/node_modules/*' \
  | xargs sed -i '' 's/\bjest\.\([a-zA-Z]\)/vi.\1/g'

# jest.requireActual → await vi.importActual  (adds await — callers need to be async)
find . -name '*.test.*' -not -path '*/node_modules/*' \
  | xargs sed -i '' 's/jest\.requireActual(/await vi.importActual(/g'

# jest.Mock type → Mock  (then add `import { Mock } from "vitest"` manually)
find . -name '*.test.*' -not -path '*/node_modules/*' \
  | xargs sed -i '' 's/jest\.Mock\b/Mock/g'

# jest.MockedFunction<...> → MockedFunction<...> (import from 'vitest')
find . -name '*.test.*' -not -path '*/node_modules/*' \
  | xargs sed -i '' 's/jest\.MockedFunction\b/MockedFunction/g'

# Per-file environment pragma: JSDoc → line comment
find . -name '*.test.*' -not -path '*/node_modules/*' \
  | xargs sed -i '' 's|/\*\* @jest-environment \([a-z]*\) \*/|// @vitest-environment \1|g'

# Package name strings in source / config
find . -name '*.ts' -o -name '*.tsx' -o -name '*.mjs' | grep -v node_modules \
  | xargs sed -i '' \
      -e 's/jest-canvas-mock/vitest-canvas-mock/g' \
      -e "s/'jest-dom'/'vitest-dom'/g" \
      -e 's/"jest-dom"/"vitest-dom"/g'
```

After running, do a final pass to catch stragglers:

```bash
grep -r 'jest\.' src/ --include='*.ts' --include='*.tsx'
```

## Core transformations

### Imports

```ts
// Jest (no import needed with globals)
describe('...', () => { ... });

// Vitest — explicit import (recommended even with globals: true)
import { describe, it, expect, vi } from 'vitest';

// jest.Mock type annotation → named import
// Before
const handler: jest.Mock = jest.fn();
// After
import { Mock } from 'vitest';
const handler: Mock = vi.fn();
```

### Mocks

```ts
// Jest
jest.fn()
jest.spyOn(obj, 'method')
jest.mock('../module')
jest.unmock('../module')
jest.doMock('../module')   // non-hoisted variant
jest.clearAllMocks()

// Vitest
vi.fn()
vi.spyOn(obj, 'method')
vi.mock('../module')
vi.unmock('../module')
vi.doMock('../module')
vi.clearAllMocks()
```

### Typing mocks (`vi.mocked`)

```ts
// Jest
import { fetchUser } from './api';
jest.mock('./api');
const mockedFetchUser = fetchUser as jest.MockedFunction<typeof fetchUser>;
mockedFetchUser.mockResolvedValue({ id: 1 });

// Vitest — vi.mocked() does the cast inline
import { vi } from 'vitest';
import { fetchUser } from './api';
vi.mock('./api');
vi.mocked(fetchUser).mockResolvedValue({ id: 1 });

// For deep mocks (whole module objects):
vi.mocked(apiModule, { deep: true }).user.fetch.mockResolvedValue(...);
```

### Hoisted mock factories (`vi.hoisted`)

`vi.mock()` is hoisted to the top of the file (same as `jest.mock`), so factory callbacks **cannot reference** module-scope variables — they don't exist yet at hoist time.

```ts
// Breaks — mockApi is undefined when the factory runs
const mockApi = vi.fn();
vi.mock('./api', () => ({ fetchUser: mockApi }));

// Works — vi.hoisted() lifts the value alongside the mock
const { mockApi } = vi.hoisted(() => ({ mockApi: vi.fn() }));
vi.mock('./api', () => ({ fetchUser: mockApi }));
```

In Jest, the same restriction was bypassed by prefixing variables with `mock` (e.g., `mockFn`), which the Jest babel plugin special-cased. Vitest has **no such convention** — use `vi.hoisted()` explicitly.

### Dynamic module import

```ts
// Jest — synchronous
const mod = jest.requireActual('../module');

// Vitest — async (must await)
const mod = await vi.importActual('../module');
```

This is the most common subtle breakage. `jest.requireActual` is synchronous; `vi.importActual` returns a Promise.

### Timers

```ts
// Jest
jest.useFakeTimers();
jest.advanceTimersByTime(1000);
jest.runAllTimers();
jest.useRealTimers();

// Vitest
vi.useFakeTimers();
vi.advanceTimersByTime(1000);
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

## Setup file (DOM matchers + axe)

Replace `@testing-library/jest-dom` and `jest-axe` setup with vitest equivalents:

```ts
// setupTests.ts — before
import '@testing-library/jest-dom';
import { toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

// setupTests.ts — after
import { expect } from 'vitest';
import { toHaveNoViolations } from 'vitest-axe/matchers';
import * as matchers from 'vitest-dom/matchers';

expect.extend(matchers);
expect.extend({ toHaveNoViolations });
```

## `package.json` scripts

Replace Jest scripts with Vitest equivalents:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ci": "vitest run",
    "coverage": "vitest run --coverage"
  }
}
```

## Pitfalls

- **`__mocks__` directories work**, but auto-mocking behavior differs slightly. Test with `vi.mock()` explicitly.
- **`jest.config.js` is replaced** by `vitest.config.ts` — don't maintain both.
- **`moduleNameMapper` → `resolve.alias`** in `vite.config.ts`.
- **`testPathPattern` CLI flag** → `vitest --reporter=verbose <pattern>`.
- **`globals: true` requires tsconfig types** — add `"vitest/globals"` to avoid TS errors on `describe`, `it`, etc.
- **`jest.setTimeout` → `vi.setConfig({ testTimeout: N })`** or per-test `{ timeout: N }` option.
- **`jest.requireActual` is synchronous; `vi.importActual` is not** — every call site must be `await`-ed inside an async function.

## When NOT to migrate

- Project doesn't use Vite (still on CRA or custom Webpack) — Vitest's main value comes from sharing the Vite pipeline.
- Heavy reliance on `jest.requireActual` inside synchronous factory callbacks (hard to make async).
- Snapshots require Jest-specific serializers not supported by Vitest.

## Validation checklist

- [ ] All `jest.*` calls replaced with `vi.*`
- [ ] All `jest.requireActual` → `await vi.importActual` (and callers are async)
- [ ] All `jest.Mock` / `jest.MockedFunction` types → imported from `'vitest'`
- [ ] `jest.MockedFunction<typeof fn>` casts simplified to `vi.mocked(fn)`
- [ ] Factory closures referencing outer vars use `vi.hoisted()`
- [ ] `/** @jest-environment X */` pragmas → `// @vitest-environment X`
- [ ] Explicit `vitest` imports in every test file
- [ ] `jest-axe` → `vitest-axe`, `jest-dom` → `vitest-dom`, `jest-canvas-mock` → `vitest-canvas-mock`
- [ ] `setupTests.ts` uses `vitest-dom/matchers` and `vitest-axe/matchers`
- [ ] `jest.config.*` deleted; `vitest.config.ts` in place
- [ ] `moduleNameMapper` migrated to `resolve.alias` in vite config
- [ ] `transform` / `ts-jest` / `babel-jest` removed; relying on Vite plugins
- [ ] CI script calls `vitest run`
- [ ] No `jest` binary references remain (`grep -r '"jest"' package.json`)
- [ ] All tests pass under `vitest run`

## Codemod references

- [jscodeshift jest-to-vitest](https://github.com/trivikr/jest-to-vitest) — covers most mechanical replacements (`jest.*` → `vi.*`).
- [Vitest migration guide](https://vitest.dev/guide/migration.html) lists what is NOT auto-convertible.

## AI Prompt

```
You are migrating a test file from Jest to Vitest.

Rules:
1. Replace all `jest.*` calls with `vi.*` equivalents (jest.fn → vi.fn, jest.mock → vi.mock, etc.).
2. Replace `jest.requireActual(m)` with `await vi.importActual(m)` — mark the containing function async.
3. Replace `jest.Mock` and `jest.MockedFunction` types with `Mock` / `MockedFunction` imported from 'vitest'.
4. Simplify `fn as jest.MockedFunction<typeof fn>` casts to `vi.mocked(fn)`.
5. If a `vi.mock()` factory references a module-scope variable, wrap that variable in `vi.hoisted(() => ...)`.
6. Convert `/** @jest-environment X */` JSDoc pragmas to `// @vitest-environment X` line comments.
7. Add explicit imports: `import { describe, it, expect, vi, Mock, beforeEach, afterEach } from 'vitest'`.
8. Replace `jest.setTimeout(n)` with a `{ timeout: n }` option on the test/describe block.
9. Do not change test logic, assertions, or test descriptions. Do not add or remove test cases.

Migrate the following file:
```

## References

- [Vitest migration guide](https://vitest.dev/guide/migration.html)
- [Vitest config reference](https://vitest.dev/config/)
- [vi mock API](https://vitest.dev/api/vi.html)
