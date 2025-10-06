import { state } from '../core/state'
import { derived } from '../core/derived'
import type { State } from '../types'
import { getInternal } from '../core/internals'

// Shorthand
export const atom = state

// Reset helper: uses internal node.initial when available
export function reset<T>(s: State<T>, initial?: T) {
  const tag = getInternal(s)
  const init = initial ?? (tag?.node?.initial as T | undefined)
  if (init !== undefined) s.set(init)
}

// Selectors
export function select<S, R>(s: State<S>, selector: (s: S) => R) {
  return derived(() => selector(s.value))
}

// Combine multiple atoms into one derived object
export function combine<T extends Record<string, State<any>>>(atoms: T) {
  return derived(() => {
    const out: any = {}
    for (const k of Object.keys(atoms)) {
      out[k] = atoms[k as keyof T].value
    }
    return out as { [K in keyof T]: T[K] extends State<infer V> ? V : never }
  })
}
