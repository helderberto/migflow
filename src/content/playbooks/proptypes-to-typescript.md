---
from: "PropTypes"
to: "TypeScript"
category: "language"
tags: ["typescript", "react", "proptypes", "types"]
description: "Replace runtime PropTypes validation with compile-time TypeScript interfaces."
draft: false
---

# PropTypes → TypeScript

## Philosophy shift

PropTypes validate props at runtime in development — errors show up in the console after the component renders. TypeScript catches mismatches at compile time, before the code runs. Once on TypeScript, PropTypes are redundant.

**Rule:** Remove `propTypes` and `defaultProps` declarations after adding TypeScript types. Keeping both creates a maintenance burden with no added safety.

## Setup

If not already on TypeScript, see the **JavaScript → TypeScript** playbook first. Then:

```bash
npm install --save-dev @types/react @types/react-dom
npm uninstall prop-types
```

## Core transformations

### Basic props

```tsx
// PropTypes
import PropTypes from 'prop-types';

function Button({ label, onClick, disabled }) {
  return <button onClick={onClick} disabled={disabled}>{label}</button>;
}

Button.propTypes = {
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

Button.defaultProps = {
  disabled: false,
};

// TypeScript
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

function Button({ label, onClick, disabled = false }: ButtonProps) {
  return <button onClick={onClick} disabled={disabled}>{label}</button>;
}
```

### Enum / oneOf

```tsx
// PropTypes
Component.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger']),
};

// TypeScript
interface Props {
  variant?: 'primary' | 'secondary' | 'danger';
}
```

### Shape / nested objects

```tsx
// PropTypes
Component.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    email: PropTypes.string,
  }).isRequired,
};

// TypeScript
interface User {
  id: string;
  name: string;
  email?: string;
}

interface Props {
  user: User;
}
```

### Arrays

```tsx
// PropTypes
Component.propTypes = {
  items: PropTypes.arrayOf(PropTypes.string).isRequired,
  users: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string })),
};

// TypeScript
interface Props {
  items: string[];
  users?: Array<{ id: string }>;
}
```

### Children

```tsx
// PropTypes
Component.propTypes = {
  children: PropTypes.node.isRequired,
  child: PropTypes.element.isRequired,
};

// TypeScript
interface Props {
  children: React.ReactNode;
  child: React.ReactElement;
}
```

### Functions with signatures

```tsx
// PropTypes
Component.propTypes = {
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func,
};

// TypeScript — be explicit about the signature
interface Props {
  onChange: (value: string) => void;
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void;
}
```

### instanceOf / custom validators

```tsx
// PropTypes
Component.propTypes = {
  date: PropTypes.instanceOf(Date),
  custom: PropTypes.custom, // custom validator function
};

// TypeScript
interface Props {
  date?: Date;
  custom?: string; // replace with the actual type
}
```

### defaultProps → default parameters

```tsx
// PropTypes defaultProps
Component.defaultProps = {
  size: 'medium',
  disabled: false,
};

// TypeScript — default values in destructuring
function Component({ size = 'medium', disabled = false }: Props) { ... }
```

## PropTypes → TypeScript type mapping

| PropTypes | TypeScript |
|-----------|------------|
| `string` | `string` |
| `number` | `number` |
| `bool` | `boolean` |
| `func` | `() => void` (specify signature) |
| `array` | `unknown[]` (specify element type) |
| `object` | `Record<string, unknown>` (define interface) |
| `node` | `React.ReactNode` |
| `element` | `React.ReactElement` |
| `symbol` | `symbol` |
| `any` | `unknown` (avoid `any`) |
| `oneOf([...])` | union type `'a' \| 'b'` |
| `oneOfType([...])` | union type `string \| number` |
| `arrayOf(T)` | `T[]` |
| `shape({...})` | `interface` or inline object type |
| `instanceOf(C)` | `InstanceType<typeof C>` |
| `.isRequired` | remove `?` (required by default) |
| absent (optional) | add `?` to property |

## When NOT to migrate

- Project not on TypeScript yet — do `JavaScript → TypeScript` first.
- Library shipped to JS-only consumers that rely on runtime PropTypes validation.
- React ≤ 18 where PropTypes still warns usefully — React 19 removed it, so this concern fades.

## Pitfalls

- **`isRequired` inverts** — in PropTypes, all props are optional unless `.isRequired` is added. In TypeScript, all props are required unless marked with `?`.
- **`PropTypes.func` loses signature info** — always replace with an explicit function type.
- **`PropTypes.object` and `PropTypes.array` are too loose** — replace with specific interfaces or `unknown[]`.
- **`defaultProps` is deprecated in React 19** — always use default parameter values instead.
- **Class components with `defaultProps`** — if still on class components, move defaults into the constructor or use the static property pattern with TypeScript.
- **Third-party components with PropTypes** — `@types/*` packages already define TypeScript types; no migration needed for those.

## Validation checklist

- [ ] No `import PropTypes from 'prop-types'` remaining
- [ ] No `Component.propTypes = {...}` declarations
- [ ] No `Component.defaultProps = {...}` — replaced with parameter defaults
- [ ] Each component has a typed props interface/type
- [ ] `prop-types` removed from `package.json`
- [ ] `tsc --noEmit` reports no prop-related errors

## Codemod references

- [react-javascript-to-typescript-transform](https://github.com/lyft/react-javascript-to-typescript-transform) — Lyft's codemod handles PropTypes → TS in many cases.
- Manual review required where PropTypes used `oneOfType`/`shape` with non-trivial nesting.

## AI Prompt

```
You are migrating a React component from PropTypes to TypeScript.

Rules:
1. Create an interface (or type) for the component's props, named <ComponentName>Props.
2. Map each propTypes entry to its TypeScript equivalent using this table:
   - string → string, number → number, bool → boolean
   - func → explicit function signature (e.g. () => void or (val: string) => void)
   - node → React.ReactNode, element → React.ReactElement
   - oneOf([...]) → union type ('a' | 'b')
   - shape({...}) → inline object type or named interface
   - arrayOf(T) → T[]
   - .isRequired → required prop (no ?); absent → optional prop (?)
3. Replace defaultProps with default parameter values in the function signature.
4. Remove the propTypes and defaultProps declarations entirely.
5. Do not change JSX or component logic.

Migrate the following component:
```

## References

- [TypeScript with React](https://react.dev/learn/typescript)
- [React TypeScript cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [PropTypes deprecation in React 19](https://react.dev/blog/2024/04/25/react-19-upgrade-guide#removed-proptypes-and-defaultprops)
