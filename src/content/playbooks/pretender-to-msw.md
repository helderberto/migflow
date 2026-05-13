---
from: "Pretender"
to: "Mock Service Worker"
category: "frontend"
tags: ["testing", "mocking", "msw", "pretender", "api"]
description: "Replace Pretender's in-memory fake server with MSW for network-level request interception."
draft: false
---

# Pretender → Mock Service Worker

## Philosophy shift

Pretender intercepts `XMLHttpRequest` and `fetch` by monkey-patching them in-memory. MSW intercepts at the network level using a Service Worker (in browsers) or Node.js interceptors — no patching, no fake server object to manage. The same handlers work in tests, the browser dev environment, and Storybook.

**Rule:** MSW handlers are stateless by default. Don't reach for `server.use()` overrides unless a specific test needs different behavior — start from default handlers in `handlers.ts` and override per-test.

## Setup

Remove Pretender:
```bash
npm uninstall pretender
```

Install MSW:
```bash
npm install --save-dev msw
```

### Browser (dev/Storybook)

```bash
npx msw init public/ --save
```

This copies `mockServiceWorker.js` to your `public/` directory.

### Node (Jest / Vitest)

No extra binary needed — MSW uses Node's `http` interceptors.

## Core transformations

### Server setup

```ts
// Pretender
import Pretender from 'pretender';

let server: Pretender;

beforeEach(() => { server = new Pretender(); });
afterEach(() => { server.shutdown(); });

// MSW
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Defining handlers

```ts
// Pretender
server.get('/api/users', () => [
  200,
  { 'Content-Type': 'application/json' },
  JSON.stringify([{ id: 1, name: 'Alice' }]),
]);

server.post('/api/users', (request) => {
  const body = JSON.parse(request.requestBody);
  return [201, { 'Content-Type': 'application/json' }, JSON.stringify({ id: 2, ...body })];
});

// MSW
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/users', () =>
    HttpResponse.json([{ id: 1, name: 'Alice' }])
  ),

  http.post('/api/users', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: 2, ...body }, { status: 201 });
  }),
];
```

### Reading request data

```ts
// Pretender
server.post('/api/login', (request) => {
  const { email } = JSON.parse(request.requestBody);
  const params = request.queryParams;
  const token = request.requestHeaders['Authorization'];
  return [200, {}, JSON.stringify({ token: 'abc' })];
});

// MSW
http.post('/api/login', async ({ request }) => {
  const { email } = await request.json();
  const url = new URL(request.url);
  const page = url.searchParams.get('page');
  const token = request.headers.get('Authorization');
  return HttpResponse.json({ token: 'abc' });
}),
```

### Path parameters

```ts
// Pretender
server.get('/api/users/:id', (request) => {
  const id = request.params.id;
  return [200, {}, JSON.stringify({ id, name: 'Alice' })];
});

// MSW
http.get('/api/users/:id', ({ params }) => {
  const { id } = params;
  return HttpResponse.json({ id, name: 'Alice' });
}),
```

### Error responses

```ts
// Pretender
server.get('/api/data', () => [500, {}, 'Internal Server Error']);

// MSW
http.get('/api/data', () =>
  new HttpResponse('Internal Server Error', { status: 500 })
),
```

### Network errors

```ts
// Pretender — no built-in; simulate via status
server.get('/api/data', () => [0, {}, '']);

// MSW
import { http, HttpResponse } from 'msw';
http.get('/api/data', () => HttpResponse.error()),
```

### Per-test overrides

```ts
// Pretender — redefine routes on server
server.get('/api/users', () => [200, {}, JSON.stringify([])]);

// MSW
it('shows empty state', async () => {
  server.use(
    http.get('/api/users', () => HttpResponse.json([]))
  );
  // handler is reset after this test via server.resetHandlers()
});
```

### Passthrough (unhandled requests)

```ts
// Pretender
server.unhandledRequest = (verb, path) => {
  console.warn(`Unhandled: ${verb} ${path}`);
};

// MSW
server.listen({ onUnhandledRequest: 'warn' });
// or 'error' to fail tests on unhandled requests (recommended for CI)
server.listen({ onUnhandledRequest: 'error' });
```

## Shared handlers file

Centralise handlers for reuse across tests, browser dev, and Storybook:

```ts
// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/users', () => HttpResponse.json([])),
];
```

```ts
// src/mocks/browser.ts (for Storybook / dev)
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';
export const worker = setupWorker(...handlers);
```

```ts
// src/mocks/server.ts (for Node tests)
import { setupServer } from 'msw/node';
import { handlers } from './handlers';
export const server = setupServer(...handlers);
```

## When NOT to migrate

- Test stack already mocks at the `fetch`/`XHR` boundary via `nock` or similar and the team is happy with it.
- Embedded environments without Service Worker support.
- Active use of Pretender's `passthrough` for selective real-network calls — supported in MSW but the pattern differs.

## Pitfalls

- **`server.shutdown()` → `server.close()`** — MSW uses `close`, not `shutdown`.
- **Pretender handlers are replaced** when redefined; MSW `server.use()` prepends — the last-registered matching handler wins per request until `resetHandlers()`.
- **`requestBody` → `await request.json()`** — MSW handlers are `async`; always `await` the body.
- **`queryParams` → `new URL(request.url).searchParams`** — no shorthand property on the request object.
- **MSW 2.x uses `HttpResponse`** — `res(ctx.json(...))` syntax is MSW v1. Use `HttpResponse.json(...)` in v2.
- **Service Worker file must be in `public/`** — forgetting `npx msw init public/` breaks browser interception silently.
- **`onUnhandledRequest: 'error'` in CI** — catch missing handlers early. Use `'warn'` in local dev to avoid noise.

## Validation checklist

- [ ] `pretender` removed from `package.json`
- [ ] `msw` installed; `public/mockServiceWorker.js` present (for browser usage)
- [ ] All `server.get/post/...` converted to `http.get/post/...` with `HttpResponse`
- [ ] `server.shutdown()` replaced with `server.close()`
- [ ] `afterEach(() => server.resetHandlers())` registered
- [ ] Shared handlers live in `mocks/handlers.ts`, reused by tests + browser dev
- [ ] CI configured with `onUnhandledRequest: 'error'`

## Codemod references

- No widely-used codemod — handler API is structurally similar; AI-assisted conversion is feasible.
- [MSW's v1→v2 migration docs](https://mswjs.io/docs/migrations/1.x-to-2.x) cover the adjacent migration.

## AI Prompt

```
You are migrating API mocking code from Pretender to Mock Service Worker (MSW) v2.

Rules:
1. Replace `new Pretender()` setup with `setupServer(...handlers)` from msw/node.
2. Replace server.shutdown() with server.close() in afterAll.
3. Add server.resetHandlers() in afterEach.
4. Convert each server.get/post/put/delete route to an http.get/post/put/delete handler using HttpResponse.
5. Replace request.requestBody with `await request.json()` (async).
6. Replace request.queryParams with `new URL(request.url).searchParams`.
7. Replace request.params for path params with destructured `{ params }` from the handler argument.
8. Replace network error simulation with HttpResponse.error().
9. Export handlers to a separate handlers.ts file.

Migrate the following Pretender setup:
```

## References

- [MSW docs](https://mswjs.io/docs/)
- [MSW v2 migration guide](https://mswjs.io/docs/migrations/1.x-to-2.x)
- [MSW with Vitest](https://mswjs.io/docs/integrations/node)
