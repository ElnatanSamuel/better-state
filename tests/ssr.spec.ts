import { describe, it, expect } from 'vitest'
import { state } from '../src/core/state'
import { resource } from '../src/core/resource'
import { dehydrateState, hydrateState, dehydrateResource, hydrateResource } from '../src/ssr'

describe('SSR hydrate/dehydrate', () => {
  it('hydrates state value', () => {
    const s = state(0)
    const payload = dehydrateState(s)
    expect(payload).toBe(0)

    hydrateState(s, 42)
    expect(s.value).toBe(42)
  })

  it('hydrates resource snapshot', async () => {
    const r = resource(async () => 'server')
    // Simulate server payload
    const snap = { data: 'server', loading: false, error: null as any }
    hydrateResource(r, snap)
    expect(r.data).toBe('server')
    expect(r.loading).toBe(false)
    expect(r.error).toBe(null)
  })
})
