import { describe, it, expect, vi } from 'vitest'
import { state } from '../src/core/state'
import { onStateChange } from '../src/devtools'

describe('devtools', () => {
  it('emits update events on state changes', async () => {
    const s = state(0)
    const listener = vi.fn()
    const unsub = onStateChange(listener)

    s.value = 1
    await new Promise(r => queueMicrotask(r))

    expect(listener).toHaveBeenCalled()
    const evt = listener.mock.calls.at(-1)![0]
    expect(evt.type).toBe('update')
    expect(evt.atomKind).toBe('state')
    unsub()
  })
})
