---
from: "Express"
to: "Fastify"
category: "backend"
tags: ["node", "express", "fastify", "api"]
description: "Migrate an Express HTTP server to Fastify for built-in validation, schema-first design, and higher throughput."
draft: false
---

# Express → Fastify

## Philosophy shift

Express is middleware-first: routing, validation, serialization all go through `req`/`res` middleware chains. Fastify is schema-first: routes declare JSON Schema for inputs and outputs, enabling automatic validation and fast serialization. Hooks replace middleware.

**Rule:** Fastify's `reply` is not Express's `res`. Never assign `return res.json()` — use `return reply.send()` and always `return` it to signal route completion.

## Setup

Remove Express (keep it during migration if running in parallel):
```bash
npm uninstall express @types/express
```

Install Fastify:
```bash
npm install fastify
npm install --save-dev @types/node
```

## Bootstrap

```ts
// Express
import express from 'express';
const app = express();
app.use(express.json());

app.listen(3000, () => console.log('listening'));

// Fastify
import Fastify from 'fastify';
const app = Fastify({ logger: true });

await app.listen({ port: 3000, host: '0.0.0.0' });
```

## Core transformations

### Routes

```ts
// Express
app.get('/users/:id', (req, res) => {
  const { id } = req.params;
  res.status(200).json({ id });
});

// Fastify
app.get<{ Params: { id: string } }>('/users/:id', async (request, reply) => {
  const { id } = request.params;
  return reply.status(200).send({ id });
});
```

### Middleware → Hooks

```ts
// Express middleware
app.use((req, res, next) => {
  req.requestId = uuid();
  next();
});

// Fastify hook
app.addHook('onRequest', async (request, reply) => {
  request.requestId = uuid();
});
```

Hook lifecycle order: `onRequest` → `preParsing` → `preValidation` → `preHandler` → handler → `preSerialization` → `onSend` → `onResponse`.

### Error handling

```ts
// Express
app.use((err, req, res, next) => {
  res.status(err.status ?? 500).json({ error: err.message });
});

// Fastify
app.setErrorHandler(async (error, request, reply) => {
  return reply.status(error.statusCode ?? 500).send({ error: error.message });
});
```

### Route validation (Fastify-native)

```ts
// Fastify — JSON Schema on the route
app.post('/users', {
  schema: {
    body: {
      type: 'object',
      required: ['name', 'email'],
      properties: {
        name: { type: 'string' },
        email: { type: 'string', format: 'email' },
      },
    },
    response: {
      201: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      },
    },
  },
}, async (request, reply) => {
  const { name, email } = request.body;
  const user = await createUser({ name, email });
  return reply.status(201).send(user);
});
```

### Static files

```ts
// Express
app.use(express.static('public'));

// Fastify
import fastifyStatic from '@fastify/static';
import path from 'path';
app.register(fastifyStatic, { root: path.join(__dirname, 'public') });
```

### CORS

```ts
// Express
import cors from 'cors';
app.use(cors({ origin: 'https://example.com' }));

// Fastify
import fastifyCors from '@fastify/cors';
app.register(fastifyCors, { origin: 'https://example.com' });
```

### Common Express middleware equivalents

| Express | Fastify plugin |
|---------|---------------|
| `express.json()` | built-in (default) |
| `express.static` | `@fastify/static` |
| `cors` | `@fastify/cors` |
| `helmet` | `@fastify/helmet` |
| `express-rate-limit` | `@fastify/rate-limit` |
| `multer` | `@fastify/multipart` |
| `cookie-parser` | `@fastify/cookie` |
| `express-session` | `@fastify/session` |
| `compression` | `@fastify/compress` |

### Plugin system

Fastify uses `fastify-plugin` for shared scope. Group routes with `register`:

```ts
// Routes plugin
import fp from 'fastify-plugin';

const userRoutes = fp(async (app) => {
  app.get('/users', async (request, reply) => { ... });
  app.post('/users', async (request, reply) => { ... });
});

app.register(userRoutes, { prefix: '/api/v1' });
```

## When NOT to migrate

- Heavy dependence on Express middleware ecosystem with no Fastify plugin equivalent.
- Custom routing patterns that touch Express internals (`app._router.stack`).
- Team has no budget to learn Fastify hooks and schema validation.
- Small API with stable traffic — Fastify's performance edge may not justify churn.

## Pitfalls

- **Never call `reply.send()` without `return`** — the handler continues executing, leading to double-send errors.
- **Async handlers must `return` or `await`** — unhandled promise rejections in sync callbacks won't be caught by Fastify's error handler.
- **Express `req.body` is always parsed** — Fastify only parses JSON content-type by default. Send `Content-Type: application/json` from clients.
- **`res.locals`** has no equivalent — use `request.` decorator or pass context as route-level state.
- **Middleware order matters in Express** — Fastify hooks have a defined lifecycle. Understand the hook order before porting complex middleware chains.
- **Route params types** — Fastify generics (`app.get<{ Params: ... }>`) are opt-in. Without them, params are `unknown`.

## Validation checklist

- [ ] No `express` calls remaining (`app.use(express.json())`, `express.Router()`, etc.)
- [ ] All route handlers `return` their `reply.send()` calls (no double-send risk)
- [ ] Middleware migrated to the appropriate hook (`onRequest`, `preHandler`, etc.)
- [ ] Error handler registered via `setErrorHandler`
- [ ] CORS / static / cookies use `@fastify/*` plugins
- [ ] Route handlers are `async` functions
- [ ] Schema validation added for public-facing endpoints

## Codemod references

- No general-purpose codemod — semantics differ enough that AI-assisted migration is more reliable.
- [Fastify's migration guide](https://fastify.dev/docs/latest/Guides/Migration-Guide-V4/) documents the conceptual mappings.

## AI Prompt

```
You are migrating an Express route handler to Fastify.

Rules:
1. Replace `(req, res) =>` with `async (request, reply) =>`.
2. Replace `res.json(data)` with `return reply.send(data)`.
3. Replace `res.status(n).json(data)` with `return reply.status(n).send(data)`.
4. Replace Express middleware (`app.use(fn)`) with Fastify hooks (`app.addHook`).
5. Add JSON Schema `schema` objects for request body and response where inputs are validated.
6. Always `return` the `reply.send()` call.

Migrate the following route file:
```

## References

- [Fastify docs](https://fastify.dev/docs/latest/)
- [Fastify migration from Express](https://fastify.dev/docs/latest/Guides/Migration-Guide-V4/)
- [Fastify ecosystem plugins](https://fastify.dev/ecosystem/)
