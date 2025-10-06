import { describe, it, expect, vi } from 'vitest'
import { state } from '../src/core/state'
import { persist, type StorageLike } from '../src/persist'

describe('persist', () => {
  it('restores saved value and writes on updates', async () => {
    const mem: Record<string, string> = {}
    const storage: StorageLike = {
      getItem: (k) => (k in mem ? mem[k] : null),
      setItem: (k, v) => { mem[k] = v },
      removeItem: (k) => { delete mem[k] },
    }

    // Prepopulate storage
    mem['count'] = JSON.stringify(41)

    const base = state(0)
    const persisted = persist(base, { key: 'count', storage })

    expect(persisted.value).toBe(41)

    persisted.value = 42
    await new Promise((r) => queueMicrotask(r))

    expect(mem['count']).toBe(JSON.stringify(42))
  })
})
