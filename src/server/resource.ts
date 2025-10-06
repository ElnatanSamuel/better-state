import type { Resource } from '../types'
import { resource as clientResource } from '../core/resource'

export interface CacheLike<T = any> {
  get(key: string): T | undefined | Promise<T | undefined>
  set(key: string, value: T, ttlMs?: number): void | Promise<void>
  delete?(key: string): void | Promise<void>
  clear?(pattern?: string): void | Promise<void>
}

class MemoryCache implements CacheLike<{ value: any; expiresAt: number | null }> {
  private map = new Map<string, { value: any; expiresAt: number | null }>()
  get(key: string) {
    const hit = this.map.get(key)
    if (!hit) return undefined
    if (hit.expiresAt != null && Date.now() > hit.expiresAt) {
      this.map.delete(key)
      return undefined
    }
    return hit
  }
  set(key: string, value: { value: any; expiresAt: number | null }) {
    this.map.set(key, value)
  }
}

export interface ServerResourceOptions {
  cache?: CacheLike<{ value: any; expiresAt: number | null }>
  ttlMs?: number
}

export function serverResource<T>(key: string, fetcher: () => Promise<T>, opts: ServerResourceOptions = {}): Resource<T> & { cached: boolean } {
  const cache = opts.cache ?? new MemoryCache()
  const ttlMs = opts.ttlMs ?? 0

  let cached = false

  // Create a resource that first tries cache, otherwise fetches and stores
  const r = clientResource(async () => {
    const hit = await cache.get(key)
    if (hit && (hit.expiresAt == null || Date.now() <= hit.expiresAt)) {
      cached = true
      return hit.value as T
    }
    const value = await fetcher()
    const expiresAt = ttlMs > 0 ? Date.now() + ttlMs : null
    await cache.set(key, { value, expiresAt })
    cached = false
    return value
  }) as Resource<T> & { cached: boolean }

  Object.defineProperty(r, 'cached', { get() { return cached }, enumerable: false })
  return r
}
