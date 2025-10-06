# Better State - Usage Guide

## Table of Contents

1. [Installation](#installation)
2. [Core Concepts](#core-concepts)
3. [API Reference](#api-reference)
4. [Framework Integration](#framework-integration)
5. [Advanced Patterns](#advanced-patterns)
6. [Best Practices](#best-practices)
7. [Performance Tips](#performance-tips)

## Installation

```bash
npm install better-state
```

For framework-specific usage, ensure you have the peer dependencies installed:

```bash
# For React
npm install react@^18.0.0

# For Vue
npm install vue@^3.0.0

# Svelte has no peer dependencies
```

## Core Concepts

### Reactive State

Better State uses fine-grained reactivity, meaning only the components or subscribers that depend on changed values are notified.

### Dependency Tracking

Dependencies are tracked automatically. When you access `.value` inside a `derived` function, that state becomes a dependency.

### Lazy Evaluation

Derived values are only computed when:
1. Their value is accessed
2. They have active subscribers
3. Their dependencies have changed

### Batching

Multiple synchronous updates are batched into a single notification using microtasks.

## API Reference

### `state(initialValue, equalityFn?)`

Creates a reactive state container.

**Parameters:**
- `initialValue`: The initial value
- `equalityFn` (optional): Custom equality function (defaults to `Object.is`)

**Returns:** `State<T>`

**Example:**
```typescript
const count = state(0);
const user = state({ name: 'Alice' }, (a, b) => a.name === b.name);
```

**State API:**
- `value`: Get or set the current value
- `set(value)`: Alternative method to set value
- `subscribe(listener)`: Subscribe to changes, returns unsubscribe function

### `derived(computeFn)`

Creates a computed value that automatically tracks dependencies.

**Parameters:**
- `computeFn`: Function that computes the derived value

**Returns:** `Derived<T>`

**Example:**
```typescript
const firstName = state('John');
const lastName = state('Doe');
const fullName = derived(() => `${firstName.value} ${lastName.value}`);
```

**Derived API:**
- `value`: Get the current computed value (readonly)
- `subscribe(listener)`: Subscribe to changes

### `resource(fetcherFn)`

Handles async/server state with automatic loading tracking.

**Parameters:**
- `fetcherFn`: Async function that fetches the data

**Returns:** `Resource<T>`

**Example:**
```typescript
const user = resource(async () => {
  const res = await fetch('/api/user');
  return res.json();
});
```

**Resource API:**
- `data`: The fetched data (null initially)
- `loading`: Boolean indicating loading state
- `error`: Error object if fetch failed
- `refresh()`: Manually trigger a refresh
- `subscribe(listener)`: Subscribe to state changes

### `transaction(fn)`

Batches multiple updates into a single notification.

**Parameters:**
- `fn`: Function containing state updates

**Example:**
```typescript
transaction(() => {
  x.value = 1;
  y.value = 2;
  z.value = 3;
});
// Only one notification sent
```

## Framework Integration

### React

Use `use()` for state/derived and `useResource()` for resources.

```typescript
import { use, useResource } from 'better-state/react';

function Component() {
  const count = use(counterState);
  const { data, loading, error, refresh } = useResource(userResource);
  
  return <div>{count}</div>;
}
```

### Vue

Use `useState()` for state/derived and `useResource()` for resources.

```vue
<script setup>
import { useState, useResource } from 'better-state/vue';

const count = useState(counterState);
const user = useResource(userResource);
</script>

<template>
  <div>{{ count }}</div>
</template>
```

### Svelte

Use `toStore()` for state/derived and `resourceToStore()` for resources.

```svelte
<script>
import { toStore, resourceToStore } from 'better-state/svelte';

const count = toStore(counterState);
const user = resourceToStore(userResource);
</script>

<div>{$count}</div>
```

## Advanced Patterns

### Conditional Dependencies

```typescript
const mode = state<'celsius' | 'fahrenheit'>('celsius');
const celsius = state(20);
const fahrenheit = state(68);

const temperature = derived(() => {
  return mode.value === 'celsius' ? celsius.value : fahrenheit.value;
});
```

### Chained Derivations

```typescript
const items = state([1, 2, 3, 4, 5]);
const doubled = derived(() => items.value.map(x => x * 2));
const sum = derived(() => doubled.value.reduce((a, b) => a + b, 0));
```

### Parameterized Resources

```typescript
const userId = state(1);

const user = resource(async () => {
  const res = await fetch(`/api/users/${userId.value}`);
  return res.json();
});

// Change user and refresh
userId.value = 2;
user.refresh();
```

### State Composition

```typescript
interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

const todos = state<Todo[]>([]);
const filter = state<'all' | 'active' | 'completed'>('all');

const filteredTodos = derived(() => {
  const f = filter.value;
  if (f === 'all') return todos.value;
  if (f === 'active') return todos.value.filter(t => !t.completed);
  return todos.value.filter(t => t.completed);
});

const activeCount = derived(() => {
  return todos.value.filter(t => !t.completed).length;
});
```

### Custom Equality for Objects

```typescript
// Deep equality for objects
const settings = state(
  { theme: 'dark', fontSize: 14 },
  (a, b) => JSON.stringify(a) === JSON.stringify(b)
);

// Shallow equality
const user = state(
  { name: 'Alice', age: 30 },
  (a, b) => a.name === b.name && a.age === b.age
);
```

## Best Practices

### 1. Create State Outside Components

```typescript
// ✅ Good - state persists across renders
const counter = state(0);

function Component() {
  const count = use(counter);
  return <div>{count}</div>;
}

// ❌ Bad - creates new state on every render
function Component() {
  const counter = state(0); // Don't do this!
  const count = use(counter);
  return <div>{count}</div>;
}
```

### 2. Use Derived for Computed Values

```typescript
// ✅ Good - automatically updates
const total = derived(() => price.value * quantity.value);

// ❌ Bad - manual updates required
let total = price.value * quantity.value;
```

### 3. Batch Related Updates

```typescript
// ✅ Good - one notification
transaction(() => {
  firstName.value = 'Jane';
  lastName.value = 'Smith';
});

// ⚠️ Works but less efficient - two notifications
firstName.value = 'Jane';
lastName.value = 'Smith';
```

### 4. Unsubscribe When Done

```typescript
// ✅ Good - cleanup
const unsub = count.subscribe(v => console.log(v));
// Later...
unsub();

// In React (automatic cleanup)
useEffect(() => {
  const unsub = count.subscribe(v => console.log(v));
  return unsub;
}, []);
```

### 5. Use Custom Equality for Objects

```typescript
// ✅ Good - prevents unnecessary updates
const user = state(
  { name: 'Alice' },
  (a, b) => a.name === b.name
);

user.value = { name: 'Alice' }; // No notification

// ❌ Without custom equality
const user = state({ name: 'Alice' });
user.value = { name: 'Alice' }; // Triggers notification
```

## Performance Tips

### 1. Minimize Derived Computations

```typescript
// ✅ Good - simple computation
const doubled = derived(() => count.value * 2);

// ⚠️ Expensive - runs on every dependency change
const processed = derived(() => {
  return hugeArray.value.map(expensive).filter(predicate).sort();
});
```

### 2. Use Transactions for Bulk Updates

```typescript
// ✅ Good - batched
transaction(() => {
  items.value = newItems;
  filter.value = newFilter;
  sort.value = newSort;
});
```

### 3. Avoid Unnecessary Subscriptions

```typescript
// ✅ Good - only subscribe when needed
if (needsTracking) {
  const unsub = state.subscribe(handler);
}

// ❌ Bad - subscribes even when not needed
const unsub = state.subscribe(handler);
```

### 4. Memoize Expensive Derivations

```typescript
// Break expensive derivations into steps
const step1 = derived(() => expensiveOp1(data.value));
const step2 = derived(() => expensiveOp2(step1.value));
const final = derived(() => expensiveOp3(step2.value));
```

### 5. Use Conditional Dependencies Wisely

```typescript
// Only tracks the active dependency
const value = derived(() => {
  if (useA.value) {
    return a.value; // Only tracks 'a' when useA is true
  } else {
    return b.value; // Only tracks 'b' when useA is false
  }
});
```

## Common Patterns

### Form State Management

```typescript
const formData = state({
  email: '',
  password: '',
  rememberMe: false,
});

const isValid = derived(() => {
  const { email, password } = formData.value;
  return email.includes('@') && password.length >= 8;
});

const submitForm = async () => {
  if (!isValid.value) return;
  // Submit logic
};
```

### Pagination

```typescript
const page = state(1);
const pageSize = state(10);

const data = resource(async () => {
  const res = await fetch(`/api/items?page=${page.value}&size=${pageSize.value}`);
  return res.json();
});

const nextPage = () => {
  page.value++;
  data.refresh();
};
```

### Search with Debouncing

```typescript
const searchQuery = state('');
let timeoutId: number;

const debouncedSearch = derived(() => {
  clearTimeout(timeoutId);
  return new Promise(resolve => {
    timeoutId = setTimeout(() => resolve(searchQuery.value), 300);
  });
});
```

## Troubleshooting

### Circular Dependencies

If you get a "Circular dependency detected" error:

```typescript
// ❌ Circular
const a = derived(() => b.value + 1);
const b = derived(() => a.value + 1); // Error!

// ✅ Fix - break the cycle
const a = state(1);
const b = derived(() => a.value + 1);
```

### State Not Updating

Make sure you're modifying the `.value` property:

```typescript
// ❌ Wrong
count = 5;

// ✅ Correct
count.value = 5;
```

### Resource Race Conditions

Better State automatically handles race conditions, but ensure you're using the latest data:

```typescript
const data = resource(fetcher);

// ✅ Good - uses latest data
data.subscribe(({ data, loading }) => {
  if (!loading) console.log(data);
});

// ⚠️ May be stale
const snapshot = data.data;
```
