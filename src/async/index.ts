import { resource } from '../core/resource'
import type { Resource } from '../types'

// Wrap a one-off promise in a resource-like API
export function fromPromise<T>(promise: Promise<T>): Resource<T> {
  // Create a resource whose fetcher resolves the given promise once
  let resolved: T | undefined
  const r = resource(async () => {
    if (resolved !== undefined) return resolved
    resolved = await promise
    return resolved
  })
  return r
}

// Polling resource: periodically refreshes
export function poll<T>(fetcher: () => Promise<T>, intervalMs: number): Resource<T> & { stop: () => void } {
  const r = resource(fetcher) as Resource<T> & { stop?: () => void }
  const id = setInterval(() => {
    void r.refresh()
  }, intervalMs)
  r.stop = () => clearInterval(id)
  return r as Resource<T> & { stop: () => void }
}

// Cache resources by key
export function cacheResource<T, K>(fetcher: (key: K) => Promise<T>, keyFn: (key: K) => string = (k) => String(k)) {
  const map = new Map<string, Resource<T>>()
  return (key: K): Resource<T> => {
    const k = keyFn(key)
    let r = map.get(k)
    if (!r) {
      r = resource(() => fetcher(key))
      map.set(k, r)
    }
    return r
  }
}
