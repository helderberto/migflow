---
from: "CommonJS"
to: "ESM"
category: "infra"
tags: ["esm", "commonjs", "modules", "node", "javascript"]
description: "Replace require/module.exports with ES module import/export syntax."
draft: false
---

# CommonJS → ESM

## Philosophy shift

CommonJS loads modules synchronously at runtime — `require()` can appear anywhere, even inside conditionals. ESM is statically analyzed: imports are hoisted and resolved before execution, enabling tree-shaking and top-level `await`.

**Rule:** ESM and CJS cannot be freely mixed. A `.mjs` file (or `"type": "module"` package) cannot `require()`. Plan the boundary before migrating.

## Setup

### Option A — per-package (recommended)

Add to `package.json`:
```json
{
  "type": "module"
}
```

All `.js` files in the package are treated as ESM. Rename any files that must stay CJS to `.cjs`.

### Option B — file-by-file

Rename individual files from `.js` to `.mjs`. No `package.json` change needed.

### TypeScript projects

```json
// tsconfig.json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler"
  }
}
```

## Core transformations

### Imports

```ts
// CommonJS
const fs = require('fs');
const { readFile } = require('fs');
const path = require('path');
const config = require('./config.json');

// ESM
import fs from 'fs';
import { readFile } from 'fs';
import path from 'path';
import config from './config.json' assert { type: 'json' };
// Node 22+: import config from './config.json' with { type: 'json' };
```

### Exports

```ts
// CommonJS
module.exports = { foo, bar };
module.exports = MyClass;
module.exports.helper = helper;

// ESM
export { foo, bar };
export default MyClass;
export { helper };
```

### Default vs named exports

```ts
// CommonJS — single object export (treated as default by bundlers)
module.exports = { connect, disconnect };

// ESM — explicit named exports (preferred for tree-shaking)
export { connect, disconnect };

// or if a default shape is needed
export default { connect, disconnect };
```

### Dynamic require → dynamic import

```ts
// CommonJS
const plugin = require(`./plugins/${name}`);

// ESM
const plugin = await import(`./plugins/${name}`);
```

`import()` returns a Promise — use it at the top level (ESM supports top-level `await`) or inside an `async` function.

### __dirname and __filename

```ts
// CommonJS
console.log(__dirname);
console.log(__filename);

// ESM — no built-in equivalents; reconstruct from import.meta.url
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
```

### require.resolve

```ts
// CommonJS
const resolved = require.resolve('./utils');

// ESM
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const resolved = require.resolve('./utils');
// or use import.meta.resolve (Node 18.19+)
const resolved = import.meta.resolve('./utils');
```

### Conditional require

```ts
// CommonJS — lazy load inside a function
function getLogger() {
  return require('./logger');
}

// ESM — top-level import (eagerly loaded)
import logger from './logger';
// or dynamic import if truly lazy
async function getLogger() {
  return (await import('./logger')).default;
}
```

### JSON files

```ts
// CommonJS
const pkg = require('./package.json');

// ESM (Node 22+ stable)
import pkg from './package.json' with { type: 'json' };

// Older Node — use fs.readFileSync or createRequire
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pkg = require('./package.json');
```

## File extension rules

| CJS extension | ESM extension | Notes |
|---------------|---------------|-------|
| `.js` | `.js` | With `"type": "module"` in package.json |
| `.js` | `.mjs` | Without package.json type field |
| `.cjs` | stays `.cjs` | Explicitly CJS regardless of package type |
| `.ts` | `.ts` | TypeScript with ESM target |

In ESM, **relative imports require the full extension**:
```ts
// CJS — extension optional
const utils = require('./utils');

// ESM — extension required
import utils from './utils.js'; // even for .ts files, use .js in the import
```

## When NOT to migrate

- Library publishes to npm with CJS-only consumers (older Node tooling) — dual publish required, often not worth it.
- Project uses `require()` for conditional/lazy loading that doesn't translate to static `import`.
- Build/test tooling (older Jest, certain Babel configs) still requires CJS.

## Pitfalls

- **No `require` in ESM** — `require` is not defined. Use `createRequire` if you need CJS interop.
- **`__dirname` / `__filename` are not defined** — reconstruct from `import.meta.url`.
- **File extensions are mandatory** in Node ESM (not in bundlers like Vite/webpack).
- **CJS default import** — `import foo from 'cjs-package'` imports `module.exports` as the default. Named exports from CJS don't work without interop helpers.
- **Top-level `await` only works in ESM** — wrapping in `async` IIFE is CJS-only workaround.
- **`exports` in package.json** — for published packages, define both `"main"` (CJS) and `"exports"` (ESM) during transition to support both consumers.

## Validation checklist

- [ ] `"type": "module"` in `package.json` (or every file uses `.mjs`)
- [ ] All `require()` calls replaced with `import`
- [ ] All `module.exports` replaced with `export` / `export default`
- [ ] `__dirname` / `__filename` reconstructed from `import.meta.url`
- [ ] All relative imports include the file extension (`.js`, `.mjs`)
- [ ] JSON imports use `with { type: 'json' }` or `createRequire`
- [ ] Test suite passes under the ESM Node runtime

## Codemod references

- [cjstoesm](https://github.com/wessberg/cjstoesm) — supports both Node and bundler-friendly output.
- Edge cases (dynamic `require`, conditional loads) typically need manual conversion.

## AI Prompt

```
You are migrating a Node.js file from CommonJS to ES Modules.

Rules:
1. Replace `const x = require('y')` with `import x from 'y'` or `import { x } from 'y'`.
2. Replace `module.exports = x` with `export default x` or named exports `export { x }`.
3. Replace `module.exports.x = y` with `export { y as x }`.
4. Replace `__dirname` and `__filename` with fileURLToPath/dirname reconstructed from import.meta.url.
5. Replace synchronous conditional `require()` with `await import()` inside an async function.
6. Add `.js` extension to all relative imports.
7. Do not change the runtime logic — only update module syntax.

Migrate the following file:
```

## References

- [Node.js ESM docs](https://nodejs.org/api/esm.html)
- [MDN import](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import)
- [Pure ESM package guide](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c)
