---
from: "Vanilla Redux"
to: "Redux Toolkit + RTK Query"
category: "frontend"
tags: ["redux", "redux-toolkit", "rtk-query", "state-management"]
description: "Replace boilerplate-heavy vanilla Redux with Redux Toolkit and RTK Query for data fetching."
draft: false
---

# Vanilla Redux → Redux Toolkit + RTK Query

## Philosophy shift

Vanilla Redux requires manual action types, action creators, reducers, and selectors — all wired by hand. Redux Toolkit (RTK) collapses that into `createSlice`. RTK Query eliminates async action boilerplate entirely by generating data-fetching logic from endpoint definitions.

**Rule:** If a slice manages server data (fetching, caching, loading/error state), use RTK Query instead of a slice.

## Setup

```bash
npm install @reduxjs/toolkit react-redux
```

Vanilla Redux packages become unnecessary:
```bash
npm uninstall redux redux-thunk redux-saga reselect
```

## Store

```ts
// Vanilla Redux
import { createStore, applyMiddleware, combineReducers } from 'redux';
import thunk from 'redux-thunk';

const store = createStore(
  combineReducers({ counter: counterReducer }),
  applyMiddleware(thunk)
);

// RTK
import { configureStore } from '@reduxjs/toolkit';

const store = configureStore({
  reducer: { counter: counterSlice.reducer },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

## Reducers → createSlice

```ts
// Vanilla Redux
const INCREMENT = 'counter/increment';
const DECREMENT = 'counter/decrement';

const incrementAction = () => ({ type: INCREMENT });
const decrementAction = () => ({ type: DECREMENT });

function counterReducer(state = { value: 0 }, action) {
  switch (action.type) {
    case INCREMENT: return { ...state, value: state.value + 1 };
    case DECREMENT: return { ...state, value: state.value - 1 };
    default: return state;
  }
}

// RTK — createSlice writes mutations; Immer makes them immutable under the hood
import { createSlice } from '@reduxjs/toolkit';

const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0 },
  reducers: {
    increment: state => { state.value += 1; },
    decrement: state => { state.value -= 1; },
  },
});

export const { increment, decrement } = counterSlice.actions;
export default counterSlice.reducer;
```

## Async thunks

```ts
// Vanilla Redux
const FETCH_USER = 'users/fetch';
const fetchUserAction = (id) => async (dispatch) => {
  dispatch({ type: FETCH_USER + '_PENDING' });
  try {
    const user = await api.getUser(id);
    dispatch({ type: FETCH_USER + '_FULFILLED', payload: user });
  } catch (err) {
    dispatch({ type: FETCH_USER + '_REJECTED', error: err.message });
  }
};

// RTK — createAsyncThunk generates _pending/_fulfilled/_rejected automatically
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

const fetchUser = createAsyncThunk('users/fetch', async (id: string) => {
  const user = await api.getUser(id);
  return user;
});

const usersSlice = createSlice({
  name: 'users',
  initialState: { data: null, status: 'idle', error: null } as UsersState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchUser.pending, state => { state.status = 'loading'; })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? null;
      });
  },
});
```

## Server data → RTK Query

For data that comes from an API, skip slices entirely:

```ts
// RTK Query — define once, get hooks for free
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const usersApi = createApi({
  reducerPath: 'usersApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  endpoints: builder => ({
    getUser: builder.query<User, string>({
      query: id => `/users/${id}`,
    }),
    createUser: builder.mutation<User, Partial<User>>({
      query: body => ({ url: '/users', method: 'POST', body }),
    }),
  }),
});

export const { useGetUserQuery, useCreateUserMutation } = usersApi;
```

Register in store:
```ts
const store = configureStore({
  reducer: {
    [usersApi.reducerPath]: usersApi.reducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware().concat(usersApi.middleware),
});
```

Use in component:
```tsx
function UserProfile({ id }: { id: string }) {
  const { data, isLoading, error } = useGetUserQuery(id);
  if (isLoading) return <Spinner />;
  if (error) return <Error />;
  return <div>{data?.name}</div>;
}
```

## Selectors

```ts
// Vanilla Redux with reselect
import { createSelector } from 'reselect';
const selectItems = state => state.cart.items;
const selectTotal = createSelector(selectItems, items =>
  items.reduce((sum, item) => sum + item.price, 0)
);

// RTK — createSelector is re-exported from RTK
import { createSelector } from '@reduxjs/toolkit';
const selectItems = (state: RootState) => state.cart.items;
const selectTotal = createSelector(selectItems, items =>
  items.reduce((sum, item) => sum + item.price, 0)
);
```

## Typed hooks

```ts
// src/store/hooks.ts
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './store';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

## When NOT to migrate

- App will switch state-management library entirely (Zustand, Jotai, TanStack Query) — skip RTK.
- State is dominated by server data — go straight to RTK Query and skip manual slices for that data.
- Tiny app with 1-2 reducers — `useReducer` + Context may suffice.

## Pitfalls

- **Immer mutations are only allowed inside `createSlice` reducers** — never mutate state directly in components or thunks.
- **`createAsyncThunk` errors are serialized** — `action.error` is a `SerializedError`, not the original `Error` instance.
- **RTK Query caches by endpoint + arg** — `useGetUserQuery('1')` and `useGetUserQuery('2')` are separate cache entries.
- **Don't mix RTK Query and manual slices for the same data** — pick one source of truth.
- **`configureStore` enables Redux DevTools automatically** — no extra setup needed.
- **`redux-thunk` is included by default** in RTK's `configureStore` — don't add it again.

## Validation checklist

- [ ] No `createStore` calls — replaced with `configureStore`
- [ ] No manual action-type constants — replaced with `createSlice.actions`
- [ ] No hand-written async thunks dispatching `_PENDING`/`_FULFILLED` — replaced with `createAsyncThunk` or RTK Query
- [ ] Server data uses RTK Query endpoints, not slices
- [ ] Typed hooks (`useAppDispatch`, `useAppSelector`) used in components
- [ ] Immer mutations only inside slice reducers (never in components or thunks)

## Codemod references

- No mature codemod — slice structure varies too much per project.
- [Official RTK migration guide](https://redux-toolkit.js.org/usage/migrating-to-modern-redux) is the source of truth.

## AI Prompt

```
You are migrating a Redux module from vanilla Redux to Redux Toolkit.

Rules:
1. Replace action type constants and action creators with createSlice.
2. Replace manual reducers with createSlice.reducers (mutations via Immer are fine inside slices).
3. Replace manual async thunks with createAsyncThunk.
4. If the slice manages API data (fetch/loading/error), replace it with an RTK Query createApi endpoint instead.
5. Export named action creators from slice.actions.
6. Do not change component rendering logic — only replace the Redux wiring.

Migrate the following Redux module:
```

## References

- [Redux Toolkit docs](https://redux-toolkit.js.org/)
- [RTK Query overview](https://redux-toolkit.js.org/rtk-query/overview)
- [Migrating to RTK](https://redux-toolkit.js.org/usage/migrating-to-modern-redux)
