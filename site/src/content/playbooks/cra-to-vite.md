---
from: "Create React App"
to: "Vite"
category: "frontend"
tags: ["vite", "cra", "react", "bundler"]
description: "Migrate a Create React App project to Vite for faster dev server startup and builds."
draft: false
---

# Create React App → Vite

## Philosophy shift

CRA wraps Webpack behind react-scripts with zero configuration. Vite uses native ES modules in dev (no bundle step) and Rollup for production. The result is significantly faster cold starts and HMR.

**Rule:** Vite does not support `process.env` by default — all env vars must use `import.meta.env`.

## Setup

Remove CRA:
```bash
npm uninstall react-scripts
```

Install Vite:
```bash
npm install --save-dev vite @vitejs/plugin-react
```

Create `vite.config.ts` at the project root:
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
```

Update `package.json` scripts:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

## File structure changes

### index.html

Move `public/index.html` to the project root (`index.html`). Add a script tag pointing to the entry point:

```html
<!-- Before (CRA injects automatically) -->
<div id="root"></div>

<!-- After (Vite requires explicit entry) -->
<div id="root"></div>
<script type="module" src="/src/index.tsx"></script>
```

Remove CRA template variables like `%PUBLIC_URL%` — Vite resolves public assets from the root automatically.

### Entry point

```ts
// src/index.tsx — no change needed
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

## Environment variables

```ts
// CRA
process.env.REACT_APP_API_URL
process.env.NODE_ENV

// Vite
import.meta.env.VITE_API_URL
import.meta.env.MODE  // 'development' | 'production'
import.meta.env.DEV   // boolean
import.meta.env.PROD  // boolean
```

Rename all `.env` variables: `REACT_APP_*` → `VITE_*`.

For TypeScript autocompletion, add to `src/vite-env.d.ts`:
```ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

## TypeScript config

Replace CRA's `tsconfig.json` with:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

## Absolute imports / path aliases

```ts
// CRA (via jsconfig paths — no extra config)
import Button from 'components/Button';

// Vite — configure in vite.config.ts and tsconfig.json
// vite.config.ts
import path from 'path';
export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});

// tsconfig.json
{
  "compilerOptions": {
    "paths": { "@/*": ["./src/*"] }
  }
}
```

## Testing

Vite recommends Vitest. See the **Jest → Vitest** playbook for the test migration.

If you need to keep Jest temporarily, add `babel-jest` and configure it to handle `import.meta.env`:
```ts
// jest.config.ts
moduleNameMapper: {
  '^import\\.meta\\.env$': '<rootDir>/src/__mocks__/importMeta.ts',
}
```

## When NOT to migrate

- Heavy use of CRA-specific features (automatic Service Worker registration, `jsconfig` magic).
- App uses ejected CRA Webpack with significant custom config.
- Short-lived project (<6 months) — migration cost may exceed CRA's deprecation risk.

## Pitfalls

- **`process.env` is not defined** in Vite — `import.meta.env` only. A global polyfill can be added but defeats the purpose.
- **`%PUBLIC_URL%`** in `index.html` must be removed — Vite resolves the public directory automatically.
- **CRA rewrites imports** for some assets (SVG as React components). Vite requires `?react` suffix: `import { ReactComponent as Logo } from './logo.svg?react'`.
- **`src` in `<img>` and CSS `url()`** — Vite handles these correctly, but `require()` is not supported. Use ES `import` or string paths.
- **Jest `globals` in test files** — Vite doesn't polyfill Jest globals. Migrate tests to Vitest or add explicit globals shim.
- **`homepage` in package.json** — CRA used this for base path. Set `base` in `vite.config.ts` instead.

## Validation checklist

- [ ] `react-scripts` removed from `package.json`
- [ ] `vite` and `@vitejs/plugin-react` installed and configured
- [ ] All `process.env.REACT_APP_*` replaced with `import.meta.env.VITE_*`
- [ ] `index.html` moved to project root with explicit `<script type="module">` entry
- [ ] All `%PUBLIC_URL%` references removed from HTML/JS
- [ ] `npm run build` produces working output
- [ ] `npm run dev` starts with HMR working

## Codemod references

- No mature codemod — community attempts exist but coverage is partial; expect manual edits.
- AI-assisted migration is the recommended approach.

## AI Prompt

```
You are migrating a Create React App project to Vite.

Rules:
1. Replace all `process.env.REACT_APP_*` with `import.meta.env.VITE_*`.
2. Replace `process.env.NODE_ENV` with `import.meta.env.MODE`.
3. Replace `require()` calls for assets with ES `import` statements.
4. Replace SVG `ReactComponent` imports with the `?react` suffix pattern.
5. Do not change component logic or JSX — only update build-system-specific code.

Migrate the following file:
```

## References

- [Vite migration guide](https://vitejs.dev/guide/migration.html)
- [Vite env variables](https://vitejs.dev/guide/env-and-mode.html)
- [vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react)
