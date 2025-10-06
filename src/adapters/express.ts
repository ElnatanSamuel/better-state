import type { CacheLike } from '../server/resource'
import { serverResource } from '../server/resource'

export interface ExpressAdapterOptions {
  cache?: CacheLike<{ value: any; expiresAt: number | null }>
  ttlMs?: number
}

export function createServerResourceFactory(opts: ExpressAdapterOptions = {}) {
  const { cache, ttlMs } = opts
  return function make<T>(key: string, fetcher: () => Promise<T>, extra?: { ttlMs?: number }) {
    return serverResource(key, fetcher, { cache, ttlMs: extra?.ttlMs ?? ttlMs })
  }
}

// Express middleware example (typed as any to avoid bringing express types)
export function betterStateMiddleware(opts: ExpressAdapterOptions = {}) {
  const make = createServerResourceFactory(opts)
  return function (_req: any, res: any, next: any) {
    res.locals = res.locals || {}
    res.locals.betterState = { serverResource: make }
    next()
  }
}
