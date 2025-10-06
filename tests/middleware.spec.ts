import { describe, it, expect, vi } from 'vitest'
import { state } from '../src/core/state'
import { withMiddleware, type Middleware } from '../src/middleware'

describe('middleware', () => {
  it('runs in order and can block/transform', () => {
    const logs: any[] = []
    const mw1: Middleware<number> = (next, get) => (v) => { logs.push(['mw1', v]); next(v) }
    const mw2: Middleware<number> = (next, get) => (v) => { logs.push(['mw2', v]); next(v * 2) }
    const mw3: Middleware<number> = (next, get) => (v) => { if (v < 0) { logs.push(['mw3-block', v]); return } next(v) }

    const base = state(1)
    const wrapped = withMiddleware(base, [mw1, mw2, mw3])

    wrapped.value = 2
    expect(base.value).toBe(4)
    expect(logs).toEqual([
      ['mw1', 2],
      ['mw2', 2],
    ])

    wrapped.value = -5
    expect(base.value).toBe(4)
    expect(logs[logs.length - 1]).toEqual(['mw3-block', -10])
  })
})
