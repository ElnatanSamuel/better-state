import type { State, Derived, Resource, ResourceSnapshot } from '../types';

/**
 * Svelte store contract
 */
export interface Readable<T> {
  subscribe(run: (value: T) => void): () => void;
}

/**
 * Convert a Better State state or derived to a Svelte store
 * Can be used with Svelte's $ syntax
 */
export function toStore<T>(atom: State<T> | Derived<T>): Readable<T> {
  return {
    subscribe(run: (value: T) => void) {
      // Immediately call with current value
      run(atom.value);
      // Subscribe to future changes
      return atom.subscribe(run);
    },
  };
}

/**
 * Convert a Better State resource to a Svelte store
 * Exposes the full resource snapshot
 */
export function resourceToStore<T>(resource: Resource<T>): Readable<ResourceSnapshot<T> & { refresh: () => Promise<void> }> {
  return {
    subscribe(run: (value: ResourceSnapshot<T> & { refresh: () => Promise<void> }) => void) {
      const getValue = () => ({
        data: resource.data,
        loading: resource.loading,
        error: resource.error,
        refresh: resource.refresh,
      });

      // Immediately call with current value
      run(getValue());

      // Subscribe to future changes
      return resource.subscribe(() => {
        run(getValue());
      });
    },
  };
}

// Re-export core functions for convenience
export { state, derived, resource, transaction } from '../index';
