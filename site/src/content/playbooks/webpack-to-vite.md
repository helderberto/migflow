---
from: "Webpack"
to: "Vite"
category: "infra"
tags: ["vite", "webpack", "bundler", "build"]
description: "Replace Webpack with Vite for native ESM dev server and faster builds."
draft: false
---

# Webpack → Vite

## Philosophy shift

Webpack bundles everything before serving — even in dev mode, startup time grows with the codebase. Vite serves source files as native ES modules in dev (no bundling) and uses Rollup for optimized production builds. Cold start is near-instant regardless of project size.

**Rule:** Vite assumes ESM. `require()`, CommonJS-only packages, and `process.env` (without a shim) need explicit handling.

## Setup

Remove Webpack:
```bash
npm uninstall webpack webpack-cli webpack-dev-server \
  babel-loader css-loader style-loader file-loader url-loader \
  html-webpack-plugin mini-css-extract-plugin \
  @babel/core @babel/preset-env @babel/preset-react @babel/preset-typescript
```

Install Vite:
```bash
npm install --save-dev vite
# For React:
npm install --save-dev @vitejs/plugin-react
# For Vue:
npm install --save-dev @vitejs/plugin-vue
```

## Config

`webpack.config.js` → `vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
```

## package.json scripts

```json
// Webpack
{
  "scripts": {
    "start": "webpack serve",
    "build": "webpack --mode production"
  }
}

// Vite
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

## Entry point and HTML

Webpack uses `HtmlWebpackPlugin` to inject scripts. Vite reads `index.html` directly from the project root and requires an explicit `<script type="module">`:

```html
<!-- Webpack (HtmlWebpackPlugin injects scripts) -->
<div id="root"></div>

<!-- Vite (explicit entry required) -->
<div id="root"></div>
<script type="module" src="/src/main.tsx"></script>
```

Move `public/index.html` to the project root.

## Loaders → plugins / built-ins

| Webpack loader | Vite equivalent |
|----------------|-----------------|
| `babel-loader` | built-in (esbuild) |
| `ts-loader` / `awesome-typescript-loader` | built-in (esbuild) |
| `css-loader` + `style-loader` | built-in |
| `sass-loader` | `npm i sass` (no config needed) |
| `file-loader` / `url-loader` | built-in asset handling |
| `svg` as React component | `vite-plugin-svgr` or `?react` suffix |
| `raw-loader` | `?raw` suffix: `import txt from './file.txt?raw'` |
| `json-loader` | built-in |
| `postcss-loader` | `postcss.config.js` (auto-detected) |

## Environment variables

```ts
// Webpack (DefinePlugin or dotenv-webpack)
process.env.REACT_APP_API_URL
process.env.NODE_ENV

// Vite — must be prefixed VITE_
import.meta.env.VITE_API_URL
import.meta.env.MODE      // 'development' | 'production'
import.meta.env.DEV       // boolean
import.meta.env.PROD      // boolean
```

Add TypeScript types in `src/vite-env.d.ts`:
```ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}
```

## Aliases

```ts
// webpack.config.js
resolve: {
  alias: { '@': path.resolve(__dirname, 'src') }
}

// vite.config.ts
resolve: {
  alias: { '@': path.resolve(__dirname, './src') }
}

// tsconfig.json (for TS to resolve the alias)
{
  "compilerOptions": {
    "paths": { "@/*": ["./src/*"] }
  }
}
```

## Code splitting

```ts
// Webpack — dynamic import (works the same in Vite)
const LazyPage = React.lazy(() => import('./pages/LazyPage'));

// Vite — same syntax, no config needed
```

Vite automatically splits vendor chunks. For manual splitting:
```ts
// vite.config.ts
build: {
  rollupOptions: {
    output: {
      manualChunks: { vendor: ['react', 'react-dom'] },
    },
  },
}
```

## Proxying API requests

```ts
// webpack.config.js
devServer: {
  proxy: { '/api': { target: 'http://localhost:8080', changeOrigin: true } }
}

// vite.config.ts
server: {
  proxy: { '/api': { target: 'http://localhost:8080', changeOrigin: true } }
}
```

## When NOT to migrate

- Custom Webpack loaders without Vite plugin equivalents.
- Module Federation in active production use — Vite support is experimental.
- SSR with custom Webpack setup — Vite SSR exists but the architecture differs significantly.

## Pitfalls

- **`process.env` is not defined** — Vite does not polyfill it. Replace with `import.meta.env` or add `define: { 'process.env': {} }` in `vite.config.ts` as a shim.
- **`require()` is not supported** in Vite's dev server — convert to `import` or use `createRequire`.
- **CommonJS-only packages** — some npm packages don't ship ESM. Vite pre-bundles them with esbuild automatically, but complex cases may need `optimizeDeps.include`.
- **Webpack-specific loaders** have no direct equivalent — use Vite plugins or built-in asset URL patterns (`?raw`, `?url`, `?inline`).
- **`HtmlWebpackPlugin` templates** — migrate dynamic HTML generation to Vite's `transformIndexHtml` hook or Rollup plugins.
- **`__webpack_public_path__`** → `import.meta.env.BASE_URL`.
- **`require.context`** (Webpack glob imports) → `import.meta.glob('./dir/*.ts')`.

## Validation checklist

- [ ] `webpack.config.*` removed
- [ ] `vite.config.ts` defines plugins, aliases, server config
- [ ] All `process.env.*` replaced with `import.meta.env.*`
- [ ] `index.html` at project root with explicit module script
- [ ] All loaders mapped to built-ins or Vite plugins
- [ ] `require.context` replaced with `import.meta.glob`
- [ ] Production build outputs verified against the previous Webpack output (bundle analyzer parity check)

## Codemod references

- No mature codemod for config translation — project-specific loader chains make it impractical.
- [vite-plugin-commonjs](https://github.com/originjs/vite-plugins) helps with CJS interop during the transition.

## AI Prompt

```
You are migrating a project's build configuration from Webpack to Vite.

Rules:
1. Replace webpack.config.js with vite.config.ts using defineConfig.
2. Replace process.env.* with import.meta.env.* (rename REACT_APP_ prefixes to VITE_).
3. Replace loader configurations with Vite built-ins or equivalent plugins.
4. Replace resolve.alias in webpack with resolve.alias in vite.config.ts (and add paths to tsconfig.json).
5. Replace HtmlWebpackPlugin with a root-level index.html containing <script type="module" src="/src/main.tsx">.
6. Replace require.context glob imports with import.meta.glob.
7. Do not change application logic — only update build tooling configuration.

Migrate the following webpack config:
```

## References

- [Vite docs](https://vitejs.dev/)
- [Vite from-scratch guide](https://vitejs.dev/guide/)
- [Awesome Vite plugins](https://github.com/vitejs/awesome-vite)
