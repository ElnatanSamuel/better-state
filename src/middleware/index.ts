import type { State } from '../types'
import { attachInternal, getInternal } from '../core/internals'

export type Middleware<T> = (next: (v: T) => void, current: () => T) => (v: T) => void

export function withMiddleware<T>(atom: State<T>, middlewares: Middleware<T>[]): State<T> {
  const get = () => atom.value
  let setter: (v: T) => void = (v) => {
    atom.value = v
  }
  for (let i = middlewares.length - 1; i >= 0; i--) {
    const mw = middlewares[i]
    setter = mw(setter, get)
  }

  const wrapped: State<T> = {
    get value() {
      return atom.value
    },
    set value(v: T) {
      setter(v)
    },
    set(v: T) {
      setter(v)
    },
    subscribe(listener) {
      return atom.subscribe(listener)
    },
  }

  // Preserve internals tag (pointing to the same node as original)
  const internal = getInternal(atom)
  if (internal) attachInternal(wrapped, internal.type, internal.node)

  return wrapped
}
