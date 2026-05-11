---
from: "Callbacks and Promises"
to: "async/await"
category: "language"
tags: ["javascript", "typescript", "async", "promises"]
description: "Replace callback-based and raw Promise chains with async/await for readable async code."
draft: false
---

# Callbacks and Promises → async/await

## Philosophy shift

Callbacks invert control — you hand execution to the callee. Promise chains flatten nesting but scatter logic across `.then` handlers. `async/await` restores top-down readability: async code reads like synchronous code while remaining non-blocking.

**Rule:** `async/await` is syntax sugar over Promises — never use it when the underlying operation is not a Promise (timers, event listeners, streams stay callback-based at their core).

## Core transformations

### Callbacks → async/await

```ts
// Callback style
function readConfig(callback) {
  fs.readFile('config.json', 'utf-8', (err, data) => {
    if (err) return callback(err);
    callback(null, JSON.parse(data));
  });
}

// async/await (requires promisified fs)
import { readFile } from 'fs/promises';

async function readConfig() {
  const data = await readFile('config.json', 'utf-8');
  return JSON.parse(data);
}
```

### Promise chains → async/await

```ts
// Promise chain
function loadUser(id) {
  return fetchUser(id)
    .then(user => fetchProfile(user.profileId))
    .then(profile => enrichProfile(profile))
    .catch(err => { console.error(err); throw err; });
}

// async/await
async function loadUser(id: string) {
  try {
    const user = await fetchUser(id);
    const profile = await fetchProfile(user.profileId);
    return enrichProfile(profile);
  } catch (err) {
    console.error(err);
    throw err;
  }
}
```

### Parallel operations

```ts
// Promise.all — run concurrently, not sequentially
// Wrong: sequential (each waits for the previous)
const user = await fetchUser(id);
const posts = await fetchPosts(id);

// Correct: parallel
const [user, posts] = await Promise.all([fetchUser(id), fetchPosts(id)]);
```

### Error handling

```ts
// Promise chain
fetchData()
  .then(process)
  .catch(handleError)
  .finally(cleanup);

// async/await
async function run() {
  try {
    const data = await fetchData();
    process(data);
  } catch (err) {
    handleError(err);
  } finally {
    cleanup();
  }
}
```

### Conditional async

```ts
// Promise chain
function maybeRefresh(token) {
  return isExpired(token)
    ? refreshToken(token).then(t => t.value)
    : Promise.resolve(token.value);
}

// async/await
async function maybeRefresh(token: Token) {
  if (isExpired(token)) {
    const t = await refreshToken(token);
    return t.value;
  }
  return token.value;
}
```

### Event-emitter / callback APIs

Node-style callbacks (`(err, result)`) can be promisified:

```ts
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

async function getGitHash() {
  const { stdout } = await execAsync('git rev-parse HEAD');
  return stdout.trim();
}
```

For one-time events, wrap in a `new Promise`:

```ts
// Event-based → awaitable
function waitForEvent(emitter: EventEmitter, event: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    emitter.once(event, resolve);
    emitter.once('error', reject);
  });
}

await waitForEvent(stream, 'finish');
```

### Returning from async functions

```ts
// Promise chain — explicit return
function getData() {
  return fetch('/api/data').then(res => res.json());
}

// async/await — implicit Promise wrapping
async function getData() {
  const res = await fetch('/api/data');
  return res.json(); // automatically wrapped in Promise
}
```

## Patterns to avoid

```ts
// Anti-pattern: unnecessary async wrapper
async function getVal() {
  return await somePromise; // `await` here adds a tick with no benefit
}
// Prefer:
function getVal() {
  return somePromise;
}

// Anti-pattern: async in array callbacks without Promise.all
const results = items.map(async item => await process(item));
// results is Promise[], not resolved values
// Fix:
const results = await Promise.all(items.map(item => process(item)));

// Anti-pattern: swallowing errors
async function run() {
  await riskyOperation(); // unhandled rejection if it throws
}
// Fix: always handle errors at the call site or inside the function
```

## When NOT to migrate

- Hot paths where the microtask overhead of `async/await` is measurable (rare, but possible in tight loops).
- Code that intentionally relies on synchronous callback semantics (e.g., `Array.sort` comparators).
- Pre-ES2017 target environments without transpilation.

## Pitfalls

- **`await` only works inside `async` functions** — or at the top level of ES modules (`await` is valid at module scope in ESM).
- **Sequential `await` in a loop is slow** — accumulate promises and `Promise.all` them.
- **`.catch()` on a rejected `await` won't fire** — use `try/catch` instead.
- **`async` functions always return a Promise** — callers must `await` or handle the returned Promise.
- **Unhandled promise rejections crash Node** (since v15) — always handle errors.
- **`Promise.all` fails fast** — if one promise rejects, the whole call rejects. Use `Promise.allSettled` to collect all results regardless of failure.

## Validation checklist

- [ ] No `.then()` / `.catch()` chains remain in code that should be async/await
- [ ] Node-style callbacks promisified via `util.promisify` or `fs/promises`
- [ ] Independent operations run via `Promise.all`, not sequential `await`
- [ ] `try/catch` replaces `.catch()` where errors need handling
- [ ] All `async` functions are awaited or returned by callers
- [ ] No unhandled promise rejections under `--unhandled-rejections=strict`

## Codemod references

- [promise-to-async-await](https://github.com/sgilroy/promise-to-async-await) jscodeshift transform — partial coverage; review every transform.
- AI-assisted migration is generally more reliable for non-trivial control flow.

## AI Prompt

```
You are migrating asynchronous code from callbacks/Promise chains to async/await.

Rules:
1. Replace `.then(fn).catch(fn)` chains with try/catch and await.
2. Replace Node-style callbacks with promisified versions (util.promisify or fs/promises).
3. Run independent async operations concurrently with Promise.all, not sequentially with multiple awaits.
4. Keep the same error handling semantics — only convert the structure, not the logic.
5. Mark functions that contain await as async.
6. Do not change synchronous code.

Migrate the following file:
```

## References

- [MDN async/await](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous/Promises#async_and_await)
- [Node.js util.promisify](https://nodejs.org/api/util.html#utilpromisifyoriginal)
- [Promise.all vs allSettled](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled)
