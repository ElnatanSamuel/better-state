# Better State

Better State is a minimal, framework-agnostic reactive state management library with fine-grained reactivity. It provides simple primitives for synchronous state, derived values, and asynchronous resources, plus optional modules for persistence, middleware, async helpers, server-side caching, and SSR hydration.

## Installation

```bash
npm install @elnatan/better-state
```

## Quick start

```ts
import { state, derived, resource, transaction } from "@elnatan/better-state";

// State
const count = state(0);
count.value++;
count.subscribe((v) => console.log("count:", v));

// Derived
const doubled = derived(() => count.value * 2);
console.log(doubled.value); // computes on demand

// Transaction (batch updates)
transaction(() => {
  count.value += 1;
  count.value += 1;
}); // subscribers notified once with final value

// Resource (async)
const user = resource(async () => {
  const res = await fetch("https://jsonplaceholder.typicode.com/users/1");
  return res.json();
});
user.subscribe((snap) => console.log("user:", snap));
await user.refresh();
```

## React usage

```tsx
import React from "react";
import { state, resource } from "@elnatan/better-state";
import { use, useResource } from "@elnatan/better-state/react";

const counter = state(0);
const user = resource(async () => (await fetch("/api/user")).json());

export default function App() {
  const count = use(counter);
  const snap = useResource(user);
  return (
    <div>
      <button onClick={() => (counter.value += 1)}>Count: {count}</button>
      {snap.loading
        ? "Loading…"
        : snap.error
        ? snap.error.message
        : snap.data?.name}
      <button onClick={user.refresh}>Refresh</button>
    </div>
  );
}
```

## Core API

- **state(initial, eq?) → State<T>**

  - `value` getter/setter
  - `set(v)`
  - `subscribe(listener)`
  - Optional equality `(a,b)=>boolean` to suppress redundant notifications

- **derived(compute) → Derived<T>**

  - Lazily computes and caches
  - Tracks dependencies automatically
  - `value` getter
  - `subscribe(listener)`

- **resource(fetcher) → Resource<T>**

  - Fields: `data | null`, `loading: boolean`, `error: Error | null`
  - `refresh()` to re-run fetcher
  - `subscribe(listener)` emits stable snapshots and handles races

- **transaction(fn)**
  - Defers flush until end of `fn`, coalescing notifications per node

## Extended modules

### Persistence

Persist a state atom to `localStorage` (or custom storage).

```ts
import { state } from "@elnatan/better-state";
import { persist } from "@elnatan/better-state/persist";

const count = persist(state(0), { key: "count" });

// Custom storage
persist(state(0), {
  key: "k",
  storage: {
    getItem: (k) => localStorage.getItem(k),
    setItem: (k, v) => localStorage.setItem(k, v),
    removeItem: (k) => localStorage.removeItem(k),
  },
});
```

### Middleware

Intercept and transform state updates.

```ts
import { state } from "@elnatan/better-state";
import {
  withMiddleware,
  type Middleware,
} from "@elnatan/better-state/middleware";

const base = state(0);
const wrapped = withMiddleware(base, [
  (next, get) => (v) => {
    console.log("set", v);
    next(v);
  },
  (next, get) => (v) => {
    if (v < 0) return;
    next(v);
  },
]);

wrapped.value = 1; // logs and passes validation
```

### Helpers

```ts
import { state } from "@elnatan/better-state";
import { atom, reset, select, combine } from "@elnatan/better-state/helpers";

const s = atom(1); // alias for state
const tenX = select(s, (x) => x * 10);

const user = state({ name: "E", age: 22 });
const snapshot = combine({ s, user }); // derived object of values

reset(s); // restore to initial value
```

### Async helpers

```ts
import { fromPromise, poll, cacheResource } from "@elnatan/better-state/async";

const ready = fromPromise(Promise.resolve("ok"));
const ticker = poll(async () => Date.now(), 2000); // ticker.stop()
const getUser = cacheResource(async (id: string) =>
  (await fetch("/api/" + id)).json()
);
```

### Debug and DevTools

Inspection helpers:

```ts
import {
  inspect,
  listDependencies,
  listSubscribers,
} from "@elnatan/better-state/debug";
console.log(inspect(someAtom));
console.log(listDependencies(someDerived));
console.log(listSubscribers(someAtom));
```

Global emitter:

```ts
import { onStateChange } from "@elnatan/better-state/devtools";
const off = onStateChange((e) => {
  // { type: 'update', atomKind: 'state'|'derived'|'resource', subscribers, payload }
  console.log(e);
});

// Optional: browser extension bridge can read from
// globalThis.__BETTER_STATE_DEVTOOLS__ = { emit(e) { … } }
```

## Server integration

`serverResource` caches fetch results by key with optional TTL and pluggable caches.

```ts
import { serverResource } from "@elnatan/better-state/server";

const user = serverResource(
  "user:1",
  async () => {
    const res = await fetch("https://jsonplaceholder.typicode.com/users/1");
    return res.json();
  },
  { ttlMs: 10_000 }
);

await user.refresh();
console.log(user.data);
```

Custom cache implementation:

```ts
import type { CacheLike } from "@elnatan/better-state/server";

const cache: CacheLike<{ value: any; expiresAt: number | null }> = {
  store: new Map<string, any>(),
  get(key) {
    return (this.store as Map<string, any>).get(key);
  },
  set(key, value) {
    (this.store as Map<string, any>).set(key, value);
  },
};

serverResource("k", fetcher, { cache, ttlMs: 60_000 });
```

## SSR hydration

Serialize on the server and hydrate on the client.

```ts
import {
  dehydrateState,
  hydrateState,
  dehydrateResource,
  hydrateResource,
} from "@elnatan/better-state/ssr";

// Server
const payload = {
  count: dehydrateState(count),
  user: dehydrateResource(userResource),
};

// Client
hydrateState(count, payload.count);
hydrateResource(userResource, payload.user);
```

## Framework adapters

Express:

```ts
import express from "express";
import { betterStateMiddleware } from "@elnatan/better-state/adapters/express";

const app = express();
app.use(betterStateMiddleware({ ttlMs: 10_000 }));
```

Fastify:

```ts
import Fastify from "fastify";
import { registerBetterState } from "@elnatan/better-state/adapters/fastify";

const f = Fastify();
await registerBetterState(f, { ttlMs: 10_000 });
```

Next.js (App Router):

```ts
import { createServerResourceFactory } from "@elnatan/better-state/adapters/next";
const make = createServerResourceFactory({ ttlMs: 10_000 });
```

## Design notes

- Notifications are batched via a microtask scheduler with per-node task tagging.
- Derived values are lazy and recompute only when accessed after invalidation.
- Resources emit stable snapshot objects to satisfy React `useSyncExternalStore`.
- Persistence uses `localStorage` when available and falls back to in-memory.

## License

GPL-3.0-or-later
