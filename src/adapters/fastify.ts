import type { CacheLike } from '../server/resource'
import { serverResource } from '../server/resource'

export interface FastifyAdapterOptions {
  cache?: CacheLike<{ value: any; expiresAt: number | null }>
  ttlMs?: number
}

export function createServerResourceFactory(opts: FastifyAdapterOptions = {}) {
  const { cache, ttlMs } = opts
  return function make<T>(key: string, fetcher: () => Promise<T>, extra?: { ttlMs?: number }) {
    return serverResource(key, fetcher, { cache, ttlMs: extra?.ttlMs ?? ttlMs })
  }
}

// Minimal plugin-like helper (typed loosely to avoid Fastify dep)
export async function registerBetterState(fastify: any, opts: FastifyAdapterOptions = {}) {
  const make = createServerResourceFactory(opts)
  fastify.decorate('betterState', { serverResource: make })
  fastify.addHook('onRequest', async (req: any) => {
    req.betterState = { serverResource: make }
  })
}
