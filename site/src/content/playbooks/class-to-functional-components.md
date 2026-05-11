---
from: "React Class Based"
to: "React Functional Components"
category: "frontend"
tags: ["react", "hooks", "components"]
description: "Migrate React class based components to functional components with hooks."
draft: false
---

# React Class Based → React Functional Components

## Philosophy shift

Class components carry lifecycle methods, `this`, and instance state as a single object. Functional components express the same behavior as plain functions — state and side effects are isolated in hooks, composable and independently testable.

**Rule:** Never port lifecycle methods 1-to-1 into `useEffect`. Understand the intent (sync, fetch, subscription) and express it with the right hook instead.

## Core transformations

### State

```tsx
// Class
class Counter extends React.Component {
  state = { count: 0 };

  increment = () => this.setState({ count: this.state.count + 1 });

  render() {
    return <button onClick={this.increment}>{this.state.count}</button>;
  }
}

// Functional
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

Use the updater form (`setCount(c => c + 1)`) when the new value depends on the previous one.

### Props

```tsx
// Class
class Greeting extends React.Component<{ name: string }> {
  render() {
    return <h1>Hello, {this.props.name}</h1>;
  }
}

// Functional
function Greeting({ name }: { name: string }) {
  return <h1>Hello, {name}</h1>;
}
```

### componentDidMount

```tsx
// Class
componentDidMount() {
  fetchUser(this.props.id).then(user => this.setState({ user }));
}

// Functional
useEffect(() => {
  fetchUser(id).then(setUser);
}, []); // empty deps = run once on mount
```

### componentDidUpdate

```tsx
// Class
componentDidUpdate(prevProps) {
  if (prevProps.id !== this.props.id) {
    fetchUser(this.props.id).then(user => this.setState({ user }));
  }
}

// Functional
useEffect(() => {
  fetchUser(id).then(setUser);
}, [id]); // re-runs when id changes
```

### componentWillUnmount

```tsx
// Class
componentDidMount() {
  this.sub = subscribe(this.props.topic);
}
componentWillUnmount() {
  this.sub.unsubscribe();
}

// Functional
useEffect(() => {
  const sub = subscribe(topic);
  return () => sub.unsubscribe(); // cleanup function
}, [topic]);
```

### getDerivedStateFromProps

```tsx
// Class
static getDerivedStateFromProps(props, state) {
  if (props.value !== state.prevValue) {
    return { derived: transform(props.value), prevValue: props.value };
  }
  return null;
}

// Functional — compute during render, no effect needed
function Component({ value }: { value: string }) {
  const derived = transform(value); // just compute it
  return <div>{derived}</div>;
}
```

Only reach for `useMemo` if the computation is measurably expensive.

### shouldComponentUpdate / PureComponent

```tsx
// Class
class List extends React.PureComponent<{ items: string[] }> { ... }

// or
shouldComponentUpdate(nextProps) {
  return nextProps.items !== this.props.items;
}

// Functional
const List = React.memo(function List({ items }: { items: string[] }) {
  return ...;
});
```

### Instance variables (non-state values)

```tsx
// Class — instance field that doesn't trigger re-render
this.timerId = setInterval(...);

// Functional
const timerId = useRef<ReturnType<typeof setInterval>>(null);
timerId.current = setInterval(...);
```

`useRef` holds a mutable value across renders without causing re-renders.

### Context

```tsx
// Class
static contextType = ThemeContext;
render() {
  return <div className={this.context.theme}>...</div>;
}

// Functional
const { theme } = useContext(ThemeContext);
```

### Error boundaries

Error boundaries **must remain class components** — there is no functional hook equivalent. Keep one thin class wrapper and render functional children inside it:

```tsx
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    return this.state.hasError ? <Fallback /> : this.props.children;
  }
}
```

## Lifecycle → Hook mapping

| Class lifecycle | Hook equivalent |
|-----------------|-----------------|
| `componentDidMount` | `useEffect(() => {}, [])` |
| `componentDidUpdate` | `useEffect(() => {}, [dep])` |
| `componentWillUnmount` | cleanup fn in `useEffect` |
| `getDerivedStateFromProps` | derive during render or `useMemo` |
| `shouldComponentUpdate` | `React.memo` |
| `getSnapshotBeforeUpdate` | `useLayoutEffect` |
| `componentDidCatch` | still requires class (`getDerivedStateFromError`) |

## When NOT to migrate

- Component is an **error boundary** — must stay as a class (no functional hook equivalent).
- Component uses `getSnapshotBeforeUpdate` for DOM-read-before-update — `useLayoutEffect` is close but not identical.
- Component is in deprecated legacy code path slated for removal.
- Tests rely on `instance()` access — refactor tests first.

## Pitfalls

- **`this` is gone** — all props and state are captured by closure. Stale closures in `useEffect` are the #1 mistake: ensure deps array is accurate.
- **`setState` merges; `useState` replaces** — for objects, spread manually: `setState(prev => ({ ...prev, key: value }))`.
- **`componentDidMount` ≠ `useEffect(() => {}, [])`** — `useEffect` runs after paint, `componentDidMount` is synchronous post-DOM. Use `useLayoutEffect` if timing matters.
- **Copying `this.setState` calls** — class `setState` batches automatically in React 18. Functional `useState` setters batch too, but patterns with multiple `setState` calls in class should be consolidated into one state object or `useReducer`.
- **Multiple state fields** — if fields change together, keep them in one `useState` object or migrate to `useReducer`.
- **Arrow function class fields (`onClick = () => ...`)** — these become plain inline functions or extracted handlers. No behavior change, but don't bind `this` unnecessarily.

## When to use `useReducer` instead of `useState`

Replace multiple related `useState` hooks with `useReducer` when:
- Several state fields always update together
- Next state depends on previous in complex ways
- The class had many `setState` calls with conditional logic

```tsx
// Many related useState hooks → useReducer
const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
const [data, setData] = useState<User | null>(null);
const [error, setError] = useState<string | null>(null);

// →
type State = { status: 'idle' | 'loading' | 'error'; data: User | null; error: string | null };
type Action =
  | { type: 'fetch' }
  | { type: 'success'; data: User }
  | { type: 'failure'; error: string };

const [state, dispatch] = useReducer(reducer, { status: 'idle', data: null, error: null });
```

## Validation checklist

- [ ] No `this.state` / `this.setState` remaining
- [ ] No `this.props` access — destructured at function signature
- [ ] All lifecycle methods converted (verified against the mapping table)
- [ ] Cleanup functions returned from `useEffect` where unmount logic existed
- [ ] `useReducer` considered for multi-field related state
- [ ] Error boundaries left as class components
- [ ] Component renders identically (visual + snapshot parity)

## Codemod references

- [react-codemod](https://github.com/reactjs/react-codemod) — includes `class-to-function-component`; handles trivial cases.
- Manual review required for any component with non-trivial side effects, refs, or lifecycle logic.

## AI Prompt

```
You are migrating a React class component to a functional component with hooks.

Rules:
1. Replace `this.state` and `this.setState` with `useState`.
2. Replace `this.props.x` with destructured props.
3. Map lifecycle methods to hooks using this table:
   - componentDidMount → useEffect with []
   - componentDidUpdate(prevProps/State) → useEffect with dep array
   - componentWillUnmount → cleanup return in useEffect
   - getDerivedStateFromProps → derive value during render
   - shouldComponentUpdate / PureComponent → React.memo
4. Replace instance variables (non-state) with useRef.
5. Replace contextType with useContext.
6. Do NOT migrate error boundaries — keep them as class components.
7. Do not change the component's external API (props interface, display name).

Migrate the following component:
```

## References

- [React hooks intro](https://react.dev/reference/react/hooks)
- [useEffect reference](https://react.dev/reference/react/useEffect)
- [Migrating from classes](https://react.dev/reference/react/Component#alternatives)
