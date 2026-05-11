---
from: "Enzyme"
to: "React Testing Library"
category: "frontend"
tags: ["testing", "react"]
description: "Migrate Enzyme-based tests to React Testing Library, adopting user-centric testing patterns."
draft: false
---

# Enzyme → React Testing Library

## Philosophy shift

Enzyme tests implementation details. RTL tests behavior from the user's perspective.

**Rule:** If your test would still pass after refactoring component internals without changing behavior, it's a good RTL test.

## Setup

Remove Enzyme:
```bash
npm uninstall enzyme enzyme-adapter-react-16 @types/enzyme @types/enzyme-adapter-react-16
```

Install RTL:
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

Add to `setupTests.ts`:
```ts
import '@testing-library/jest-dom';
```

## Core transformations

### Rendering

```ts
// Enzyme
const wrapper = shallow(<MyComponent prop="value" />);
const wrapper = mount(<MyComponent prop="value" />);

// RTL
render(<MyComponent prop="value" />);
```

### Querying elements

Prefer queries in this order: `getByRole` > `getByLabelText` > `getByText` > `getByTestId`.

```ts
// Enzyme
wrapper.find('.btn');
wrapper.find(Button);
wrapper.find('[data-testid="submit"]');

// RTL
screen.getByRole('button', { name: /submit/i });
screen.getByTestId('submit'); // last resort
```

### Asserting text / presence

```ts
// Enzyme
expect(wrapper.text()).toContain('Hello');
expect(wrapper.find('.error').exists()).toBe(true);

// RTL
expect(screen.getByText(/hello/i)).toBeInTheDocument();
expect(screen.getByRole('alert')).toBeInTheDocument();
```

### User interactions

```ts
// Enzyme
wrapper.find('button').simulate('click');
wrapper.find('input').simulate('change', { target: { value: 'text' } });

// RTL (use userEvent, not fireEvent)
import userEvent from '@testing-library/user-event';

const user = userEvent.setup();
await user.click(screen.getByRole('button'));
await user.type(screen.getByRole('textbox'), 'text');
```

### Async assertions

```ts
// Enzyme (manual waits or done callbacks)
await wrapper.update();

// RTL
await screen.findByText(/loaded/i);
await waitFor(() => expect(mock).toHaveBeenCalled());
```

### Testing state / props (anti-pattern in RTL)

```ts
// Enzyme (DO NOT port this pattern)
expect(wrapper.state('count')).toBe(1);
expect(wrapper.props().label).toBe('Save');

// RTL — test the rendered output instead
expect(screen.getByText('Count: 1')).toBeInTheDocument();
expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
```

## Pitfalls

- **`shallow` has no equivalent** — RTL always renders the full tree. Redesign shallow tests to focus on behavior.
- **`simulate` is not realistic** — bypasses browser event propagation. Use `userEvent` instead of `fireEvent`.
- **`wrapper.update()` is not needed** — RTL's `waitFor` and `findBy*` handle async state.
- **`instance()` and `setState()` are gone** — refactor tests to assert DOM output instead.
- **Multiple elements** — `getBy*` throws if multiple match. Use `getAllBy*` or be more specific.
- **Query priority matters** — `getByRole` is most resilient to refactors. `getByTestId` is fragile.

## Query cheatsheet

| Intent | Query |
|--------|-------|
| Button, link, input by accessible name | `getByRole` |
| Form field by its label | `getByLabelText` |
| Non-interactive element by text | `getByText` |
| Form field by placeholder | `getByPlaceholderText` |
| Element not yet in DOM | `findBy*` (async) |
| Element that may not exist | `queryBy*` |

## References

- [RTL docs](https://testing-library.com/docs/react-testing-library/intro)
- [Common mistakes with RTL](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Which query should I use?](https://testing-library.com/docs/queries/about#priority)
