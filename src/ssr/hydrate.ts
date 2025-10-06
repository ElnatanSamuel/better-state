import type { State, Resource, ResourceSnapshot } from '../types'

// Serialize/deserialize helpers for SSR
export function dehydrateState<T>(s: State<T>): T {
  return s.value
}

export function hydrateState<T>(s: State<T>, value: T): void {
  s.set(value)
}

export function dehydrateResource<T>(r: Resource<T>): ResourceSnapshot<T> {
  return { data: r.data, loading: r.loading, error: r.error }
}

export function hydrateResource<T>(r: Resource<T>, snap: ResourceSnapshot<T>): void {
  const anyR: any = r as any
  if (typeof anyR.__hydrate === 'function') {
    anyR.__hydrate(snap)
  }
}
