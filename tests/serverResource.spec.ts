import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { serverResource } from '../src/server'

describe('serverResource', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('caches within TTL and refreshes after TTL', async () => {
    let n = 0
    const r = serverResource('k', async () => {
      n += 1
      return `data-${n}`
    }, { ttlMs: 1000 })

    // Wait for initial auto-fetch to complete (loading -> false)
    await new Promise<void>((resolve) => {
      const unsub = r.subscribe((snap) => {
        if (!snap.loading) { unsub(); resolve(); }
      })
    })
    expect(r.data).toBe('data-1')
    expect((r as any).cached).toBe(false) // initial fetch wasn't from cache

    await r.refresh()
    expect(r.data).toBe('data-1')
    expect((r as any).cached).toBe(true) // returned from cache

    vi.setSystemTime(new Date(Date.now() + 1100))

    await r.refresh()
    expect(r.data).toBe('data-2')
    expect((r as any).cached).toBe(false)
  })

  it('supports custom cache implementation', async () => {
    const get = vi.fn()
    const set = vi.fn()

    const cache = {
      get,
      set,
    }

    get.mockResolvedValueOnce(undefined)
    const r = serverResource('k2', async () => 'X', { cache: cache as any, ttlMs: 5000 })
    await r.refresh()

    expect(set).toHaveBeenCalled()
    expect(r.data).toBe('X')
  })
})
