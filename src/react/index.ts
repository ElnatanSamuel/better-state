import { useSyncExternalStore } from 'react';
import type { State, Derived, Resource, ResourceSnapshot } from '../types';

/**
 * React hook to use a state or derived value
 * Automatically subscribes to changes and triggers re-renders
 */
export function use<T>(atom: State<T> | Derived<T>): T {
  const subscribe = (onStoreChange: () => void) => {
    // Adapter: our subscribe passes the value, but React just needs notification
    return atom.subscribe(() => onStoreChange());
  };

  const getSnapshot = () => atom.value;

  return useSyncExternalStore(subscribe, getSnapshot);
}

/**
 * React hook to use a resource
 * Returns the full resource snapshot with data, loading, and error
 */
export function useResource<T>(resource: Resource<T>): ResourceSnapshot<T> & { refresh: () => Promise<void> } {
  const subscribe = (onStoreChange: () => void) => {
    return resource.subscribe(() => onStoreChange());
  };

  const getSnapshot = (): ResourceSnapshot<T> => {
    const getter = (resource as any).getSnapshot as (() => ResourceSnapshot<T>) | undefined;
    // Prefer a stable, cached snapshot if available to avoid referential changes
    if (getter) return getter();
    // Fallback (shouldn't be used by our core, but safe for custom Resource impls)
    return {
      data: resource.data,
      loading: resource.loading,
      error: resource.error,
    };
  };

  const snapshot = useSyncExternalStore(subscribe, getSnapshot);

  return {
    ...snapshot,
    refresh: resource.refresh,
  };
}
