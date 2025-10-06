import type { CacheLike } from '../server/resource'
import { serverResource } from '../server/resource'

export interface NextAdapterOptions {
  cache?: CacheLike<{ value: any; expiresAt: number | null }>
  ttlMs?: number
}

export function createServerResourceFactory(opts: NextAdapterOptions = {}) {
  const { cache, ttlMs } = opts
  return function make<T>(key: string, fetcher: () => Promise<T>, extra?: { ttlMs?: number }) {
    return serverResource(key, fetcher, { cache, ttlMs: extra?.ttlMs ?? ttlMs })
  }
}

// App Router helper: provide a per-request factory from Route Handler context if desired
export function withServerResources<TArgs extends any[], R>(
  factory: ReturnType<typeof createServerResourceFactory>,
  fn: (factory: ReturnType<typeof createServerResourceFactory>, ...args: TArgs) => R
) {
  return (...args: TArgs) => fn(factory, ...args)
}
