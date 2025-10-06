import { computed, ref, type Ref } from 'vue';
import type { State, Derived, Resource, ResourceSnapshot } from '../types';

/**
 * Vue composable to use a state or derived value
 * Returns a Vue computed ref that tracks the state
 */
export function useState<T>(atom: State<T> | Derived<T>): Ref<T> {
  // Use a ref to trigger reactivity
  const valueRef = ref(atom.value) as Ref<T>;

  // Subscribe to changes
  atom.subscribe((newValue) => {
    valueRef.value = newValue;
  });

  return computed(() => atom.value);
}

/**
 * Vue composable to use a resource
 * Returns a reactive object with data, loading, error, and refresh
 */
export function useResource<T>(resource: Resource<T>): Ref<ResourceSnapshot<T> & { refresh: () => Promise<void> }> {
  const snapshot = ref<ResourceSnapshot<T>>({
    data: resource.data,
    loading: resource.loading,
    error: resource.error,
  }) as Ref<ResourceSnapshot<T>>;

  // Subscribe to changes
  resource.subscribe((newSnapshot) => {
    snapshot.value = newSnapshot;
  });

  return computed(() => ({
    data: resource.data,
    loading: resource.loading,
    error: resource.error,
    refresh: resource.refresh,
  }));
}
