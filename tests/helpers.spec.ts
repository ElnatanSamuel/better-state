import { describe, it, expect } from 'vitest'
import { state } from '../src/core/state'
import { select, combine, reset, atom } from '../src/helpers'

describe('helpers', () => {
  it('select only notifies when slice changes', async () => {
    const s = state({ a: 1, b: 2 })
    const selA = select(s, v => v.a)

    let calls = 0
    selA.subscribe(() => calls++)

    // access once to compute
    void selA.value

    // change unrelated slice
    s.value = { a: 1, b: 3 }
    await new Promise(r => queueMicrotask(r))

    expect(selA.value).toBe(1)
    expect(calls).toBe(1) // initial only

    // change selected slice
    s.value = { a: 10, b: 3 }
    await new Promise(r => queueMicrotask(r))

    expect(selA.value).toBe(10)
    expect(calls).toBe(2)
  })

  it('combine returns an object of current values', () => {
    const a = atom(1)
    const b = state('x')
    const c = combine({ a, b })

    expect(c.value).toEqual({ a: 1, b: 'x' })
    a.value = 2
    expect(c.value).toEqual({ a: 2, b: 'x' })
  })

  it('reset restores initial value', () => {
    const s = state(5)
    s.value = 10
    reset(s)
    expect(s.value).toBe(5)
  })
})
