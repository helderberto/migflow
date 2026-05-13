---
from: "Moment.js"
to: "date-fns"
category: "data"
tags: ["dates", "moment", "date-fns"]
description: "Replace Moment.js with date-fns for tree-shakeable, immutable date utilities."
draft: false
---

# Moment.js → date-fns

## Philosophy shift

Moment.js mutates dates and ships as a single large bundle (~67 kB gzipped). date-fns is a collection of pure functions — tree-shakeable, immutable, and composable. You import only what you use.

**Rule:** Native `Date` objects stay as-is. date-fns functions accept and return `Date` — no wrapper type.

## Setup

Remove Moment:
```bash
npm uninstall moment
```

Install date-fns:
```bash
npm install date-fns
```

## Core transformations

### Parsing

```ts
// Moment
moment('2024-01-15');
moment('15/01/2024', 'DD/MM/YYYY');

// date-fns
import { parseISO, parse } from 'date-fns';
parseISO('2024-01-15');
parse('15/01/2024', 'dd/MM/yyyy', new Date());
```

### Formatting

```ts
// Moment
moment().format('YYYY-MM-DD');
moment().format('DD/MM/YYYY HH:mm');

// date-fns
import { format } from 'date-fns';
format(new Date(), 'yyyy-MM-dd');
format(new Date(), 'dd/MM/yyyy HH:mm');
```

### Relative time

```ts
// Moment
moment('2023-01-01').fromNow();

// date-fns
import { formatDistanceToNow } from 'date-fns';
formatDistanceToNow(parseISO('2023-01-01'), { addSuffix: true });
```

### Arithmetic

```ts
// Moment (mutates!)
moment().add(7, 'days');
moment().subtract(1, 'month');

// date-fns (returns new Date)
import { addDays, subMonths } from 'date-fns';
addDays(new Date(), 7);
subMonths(new Date(), 1);
```

### Comparison

```ts
// Moment
moment('2024-01-15').isBefore(moment('2024-06-01'));
moment('2024-01-15').isAfter(moment('2024-06-01'));
moment('2024-01-15').isSame(moment('2024-01-15'), 'day');

// date-fns
import { isBefore, isAfter, isSameDay } from 'date-fns';
isBefore(parseISO('2024-01-15'), parseISO('2024-06-01'));
isAfter(parseISO('2024-01-15'), parseISO('2024-06-01'));
isSameDay(parseISO('2024-01-15'), parseISO('2024-01-15'));
```

### Difference between dates

```ts
// Moment
moment('2024-06-01').diff(moment('2024-01-01'), 'days');

// date-fns
import { differenceInDays } from 'date-fns';
differenceInDays(parseISO('2024-06-01'), parseISO('2024-01-01'));
```

### Start/end of period

```ts
// Moment
moment().startOf('month');
moment().endOf('week');

// date-fns
import { startOfMonth, endOfWeek } from 'date-fns';
startOfMonth(new Date());
endOfWeek(new Date());
```

### Locales

```ts
// Moment (global side-effect)
import 'moment/locale/pt-br';
moment.locale('pt-BR');

// date-fns (explicit per call, no global state)
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
format(new Date(), "d 'de' MMMM", { locale: ptBR });
```

## Format token differences

| Moment | date-fns | Meaning |
|--------|----------|---------|
| `YYYY` | `yyyy` | 4-digit year |
| `DD` | `dd` | 2-digit day |
| `Do` | `do` | Ordinal day |
| `HH` | `HH` | 24-hour hour |
| `hh` | `hh` | 12-hour hour |
| `A` | `a` | AM/PM |
| `d` | `i` | Day of week (ISO) |
| `DDD` | `D` | Day of year |

## When NOT to migrate

- Heavy use of Moment's timezone features — `date-fns-tz` exists but the API differs; effort may exceed benefit.
- App in maintenance mode (no active development) — bundle-size win doesn't justify churn.
- Domain requires Hijri/Buddhist/lunar calendars — Moment has built-in support; date-fns doesn't.

## Pitfalls

- **Moment tokens ≠ date-fns tokens** — `YYYY` becomes `yyyy`, `DD` becomes `dd`. Using wrong tokens silently produces wrong output.
- **date-fns never mutates** — operations return new `Date` instances. Store the result.
- **`parse` requires a reference date** — the third argument (`new Date()`) fills in parts not present in the format string.
- **Locale is not global** — pass `{ locale }` explicitly to every `format`, `formatDistance`, etc. call that needs it.
- **`moment(undefined)` creates a valid date (now)** — `new Date(undefined)` returns an invalid date. Audit all places where Moment receives dynamic values.
- **Invalid dates** — use `isValid` from date-fns to guard: `import { isValid } from 'date-fns'`.

## Validation checklist

- [ ] No `import moment` remaining
- [ ] All format tokens converted (`YYYY`→`yyyy`, `DD`→`dd`, `D`→`d`, etc.)
- [ ] Locale imports use named imports from `date-fns/locale` and are passed per-call
- [ ] No code relies on Moment's mutability — outputs of arithmetic operations are assigned
- [ ] Invalid dates guarded with `isValid()` where Moment's silent fallback was relied on
- [ ] Bundle analyzer confirms reduced bundle size

## Codemod references

- No reliable codemod — token mapping and mutation semantics require human review.
- AI-assisted migration is preferred (see prompt below).

## AI Prompt

```
You are migrating date manipulation code from Moment.js to date-fns.

Rules:
1. Replace all `moment(...)` calls with equivalent date-fns functions.
2. Import only the specific functions used (no wildcard imports).
3. Map format tokens: YYYY→yyyy, DD→dd, D→d (day of week), MM→MM, etc.
4. Operations return new Date instances — never mutate in place.
5. Replace global locale setup with per-call `{ locale }` options.
6. Do not change the surrounding logic — only replace the date manipulation.

Migrate the following file:
```

## References

- [date-fns docs](https://date-fns.org/)
- [Moment to date-fns cheatsheet](https://date-fns.org/docs/Getting-Started)
- [Format tokens reference](https://date-fns.org/docs/format)
