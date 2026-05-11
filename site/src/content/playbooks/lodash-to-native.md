---
from: "Lodash"
to: "Native JavaScript"
category: "data"
tags: ["lodash", "javascript", "es2020", "native"]
description: "Replace Lodash utility functions with native JavaScript equivalents to reduce bundle size."
draft: false
---

# Lodash → Native JavaScript

## Philosophy shift

Lodash was essential when browser APIs were inconsistent and ES5 was the baseline. Modern JavaScript (ES2020+) natively covers most of what Lodash provided. Removing it eliminates a common source of bundle bloat (~24 kB gzipped for the full build).

**Rule:** Replace Lodash only when the native equivalent has identical semantics. A few Lodash functions (deep clone, deep merge, `debounce`) have no perfect native equivalent — keep or replace them deliberately.

## Setup

```bash
npm uninstall lodash @types/lodash lodash-es
```

Prefer per-function removal: migrate functions one at a time, verify behavior, then remove the import.

## Core transformations

### Arrays

```ts
// _.chunk(array, size)
_.chunk([1, 2, 3, 4, 5], 2) // [[1,2],[3,4],[5]]
Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
  arr.slice(i * size, i * size + size)
);

// _.compact(array) — remove falsy values
_.compact([0, 1, false, 2, '', 3])
[0, 1, false, 2, '', 3].filter(Boolean);

// _.difference(array, values)
_.difference([1, 2, 3], [2])
[1, 2, 3].filter(x => ![2].includes(x));

// _.flatten(array)
_.flatten([[1, 2], [3]])
[[1, 2], [3]].flat();

// _.flattenDeep(array)
_.flattenDeep([1, [2, [3]]])
[1, [2, [3]]].flat(Infinity);

// _.uniq(array)
_.uniq([1, 2, 1, 3])
[...new Set([1, 2, 1, 3])];

// _.uniqBy(array, fn)
_.uniqBy(users, u => u.id)
[...new Map(users.map(u => [u.id, u])).values()];

// _.intersection(a, b)
_.intersection([1, 2, 3], [2, 3, 4])
[1, 2, 3].filter(x => [2, 3, 4].includes(x));

// _.zip(a, b)
_.zip([1, 2], ['a', 'b'])
[1, 2].map((v, i) => [v, ['a', 'b'][i]]);

// _.take(array, n)
_.take([1, 2, 3], 2)
[1, 2, 3].slice(0, 2);

// _.drop(array, n)
_.drop([1, 2, 3], 1)
[1, 2, 3].slice(1);

// _.last(array)
_.last([1, 2, 3])
[1, 2, 3].at(-1);

// _.first(array)
_.first([1, 2, 3])
[1, 2, 3][0];

// _.sortBy(array, key)
_.sortBy(users, u => u.name)
[...users].sort((a, b) => a.name.localeCompare(b.name));

// _.groupBy(array, fn)
_.groupBy(users, u => u.role)
users.reduce((acc, u) => {
  const key = u.role;
  return { ...acc, [key]: [...(acc[key] ?? []), u] };
}, {} as Record<string, typeof users>);

// _.flatten array of results (flatMap)
_.flatMap(users, u => u.tags)
users.flatMap(u => u.tags);
```

### Objects

```ts
// _.pick(obj, keys)
_.pick(user, ['id', 'name'])
const { id, name } = user; ({ id, name });
// or
Object.fromEntries(Object.entries(user).filter(([k]) => ['id', 'name'].includes(k)));

// _.omit(obj, keys)
_.omit(user, ['password'])
const { password, ...rest } = user; rest;

// _.keys(obj), _.values(obj), _.entries(obj)
_.keys(obj)    → Object.keys(obj)
_.values(obj)  → Object.values(obj)
_.entries(obj) → Object.entries(obj)

// _.mapValues(obj, fn)
_.mapValues(obj, v => v * 2)
Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v * 2]));

// _.merge (shallow) → Object.assign / spread
_.assign({}, defaults, overrides)
{ ...defaults, ...overrides }

// _.has(obj, key)
_.has(obj, 'name')
Object.hasOwn(obj, 'name'); // ES2022
```

### Strings

```ts
// _.trim, _.trimStart, _.trimEnd
_.trim('  hello  ')
'  hello  '.trim();

// _.toLower, _.toUpper
_.toLower('HELLO')  → 'HELLO'.toLowerCase()
_.toUpper('hello')  → 'hello'.toUpperCase()

// _.startsWith, _.endsWith
_.startsWith('hello', 'he') → 'hello'.startsWith('he')
_.endsWith('hello', 'lo')   → 'hello'.endsWith('lo')

// _.repeat
_.repeat('ab', 3) → 'ab'.repeat(3)

// _.padStart, _.padEnd
_.padStart('5', 3, '0') → '5'.padStart(3, '0')
```

### Functions

```ts
// _.noop
_.noop → () => {}

// _.identity
_.identity → (x) => x

// _.once(fn)
_.once(fn)
// Native equivalent:
let called = false;
let result: ReturnType<typeof fn>;
const once = (...args: Parameters<typeof fn>) => {
  if (!called) { called = true; result = fn(...args); }
  return result;
};
```

### Functions to keep or replace carefully

```ts
// _.cloneDeep — no native equivalent with same semantics
// Use structuredClone (Node 17+, modern browsers):
const clone = structuredClone(obj);
// Limitation: doesn't clone functions, class instances, or circular-ref-free guarantee

// _.debounce / _.throttle — no native equivalent
// Keep lodash.debounce / lodash.throttle as individual packages:
npm install lodash.debounce lodash.throttle
import debounce from 'lodash.debounce';

// _.isEqual (deep equality) — no native equivalent
// Keep lodash.isequal or use fast-deep-equal:
npm install fast-deep-equal
import equal from 'fast-deep-equal';

// _.get(obj, 'a.b.c', default) — optional chaining covers most cases
_.get(obj, 'a.b.c', 'default')
obj?.a?.b?.c ?? 'default';
```

### Math / number

```ts
// _.sum(array)
_.sum([1, 2, 3])
[1, 2, 3].reduce((a, b) => a + b, 0);

// _.min, _.max
_.min([1, 2, 3]) → Math.min(...[1, 2, 3])
_.max([1, 2, 3]) → Math.max(...[1, 2, 3])

// _.clamp(n, lower, upper)
_.clamp(5, 1, 10)
Math.min(Math.max(5, 1), 10);

// _.random(min, max)
_.random(1, 10)
Math.floor(Math.random() * (10 - 1 + 1)) + 1;
```

## When NOT to migrate

- Heavy use of `_.cloneDeep` / `_.isEqual` / `_.debounce` — no clean native equivalent.
- Target environment is < ES2015 (legacy IE) — native equivalents require modern JS.
- App already uses per-function imports (`lodash/get`) with effective tree-shaking — bundle gain is small.

## Pitfalls

- **`_.merge` does deep merge** — spread `{...a, ...b}` is shallow. For deep merge, use `structuredClone` + manual merge or keep `_.merge`.
- **`_.cloneDeep` vs `structuredClone`** — `structuredClone` doesn't clone `Date` prototype methods, `Map`, `Set`, or class instances correctly in all cases. Test before swapping.
- **`_.get` with array paths** — optional chaining covers dot paths but not array-path syntax `_.get(obj, ['a', 0, 'b'])`. Replace with direct access.
- **`_.sortBy` is stable; `Array.sort` is stable in ES2019+** — safe to replace in modern environments.
- **`_.isEqual` on complex objects** — Object comparison with `===` is reference equality. Don't remove `_.isEqual` without replacing with a deep-equal alternative.
- **Tree-shaking** — if you can't remove Lodash immediately, switch to `import debounce from 'lodash/debounce'` (per-function import) to reduce bundle size while migrating.

## Validation checklist

- [ ] No whole-library `import _ from 'lodash'`
- [ ] Remaining lodash usage is per-function (`lodash.debounce` as separate packages)
- [ ] `structuredClone` (or alternative) reviewed semantically vs `_.cloneDeep` edge cases
- [ ] Bundle analyzer confirms size reduction
- [ ] All tests pass — including reference-equality assertions that may differ
- [ ] Type errors checked — lodash sometimes returns wider types than native equivalents

## Codemod references

- [eslint-plugin-you-dont-need-lodash-underscore](https://github.com/you-dont-need/You-Dont-Need-Lodash-Underscore#eslint-plugin) — flags occurrences for incremental replacement.
- [eslint-plugin-lodash](https://github.com/wix/eslint-plugin-lodash) `prefer-native` rules for guided migration.

## AI Prompt

```
You are replacing Lodash utility calls with native JavaScript equivalents.

Rules:
1. Replace array utilities: compact→filter(Boolean), uniq→Set, flatten→flat(), flatMap→flatMap, sortBy→sort with comparator.
2. Replace object utilities: pick/omit→destructuring, mapValues→Object.fromEntries+map, assign→spread.
3. Replace string utilities with the equivalent String prototype method.
4. Replace _.get(obj, 'a.b.c', default) with optional chaining: obj?.a?.b?.c ?? default.
5. Keep _.cloneDeep if structuredClone is not available or the value contains class instances.
6. Keep _.isEqual — replace only if adding fast-deep-equal.
7. Keep _.debounce / _.throttle or replace with individual packages (lodash.debounce).
8. Do not change surrounding logic — only replace Lodash calls.

Migrate the following file:
```

## References

- [You Don't Need Lodash/Underscore](https://github.com/you-dont-need/You-Dont-Need-Lodash-Underscore)
- [structuredClone MDN](https://developer.mozilla.org/en-US/docs/Web/API/structuredClone)
- [Array.prototype.at MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/at)
