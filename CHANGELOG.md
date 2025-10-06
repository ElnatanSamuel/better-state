# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2025-10-02

### Added

#### Core Features
- **`state(initialValue, eq?)`** - Create reactive state with optional custom equality
- **`derived(computeFn)`** - Create computed values with automatic dependency tracking
- **`resource(fetcherFn)`** - Handle async/server state with loading, error, and data tracking
- **`transaction(fn)`** - Batch multiple state updates into single notification

#### Framework Bindings
- **React** - `use()` hook and `useResource()` hook using `useSyncExternalStore`
- **Vue** - `useState()` and `useResource()` composables
- **Svelte** - `toStore()` and `resourceToStore()` for Svelte store contract

#### Features
- Fine-grained reactivity - only affected subscribers are notified
- Lazy evaluation - derived values compute only when needed
- Automatic dependency tracking - no manual dependency arrays
- Batched updates - multiple synchronous updates coalesced via microtask
- Race condition handling - automatic stale promise detection in resources
- Cycle detection - throws helpful error for circular dependencies
- TypeScript support - full type inference, no manual typing needed

#### Testing
- Comprehensive unit tests for state, derived, resource, and transactions
- Tests for batching, equality checking, subscriptions, and edge cases
- Vitest configuration for fast test execution

#### Documentation
- Complete README with installation and usage examples
- Detailed USAGE.md guide with advanced patterns and best practices
- Example applications for React, Vue, Svelte, and vanilla JS
- API reference with all methods and options

#### Build System
- Vite-based build with TypeScript compilation
- Multiple entry points for framework-specific bindings
- ES module output format
- Type declaration generation

### Technical Details

#### Architecture
- Global dependency tracking stack for automatic dependency collection
- Microtask-based notification batching using `queueMicrotask`
- Set-based subscriber management for O(1) operations
- Separate internal node structures for state, derived, and resource

#### Performance Optimizations
- Lazy computation of derived values
- Cached derived values with dirty flag tracking
- Batched notifications to prevent redundant updates
- Efficient dependency graph management

### Package Information
- **Name**: better-state
- **Version**: 1.0.0
- **License**: MIT
- **Peer Dependencies**: React ^18.0.0 (optional), Vue ^3.0.0 (optional)
