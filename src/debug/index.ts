import type { State, Derived, Resource } from '../types'
import { getInternal, getAtomByNode } from '../core/internals'

export function inspect(atom: any) {
  const internal = getInternal(atom)
  if (!internal) return { type: 'unknown', value: undefined, subscribers: 0, dependents: 0 }
  const { type, node } = internal
  let value: any
  if (type === 'state' || type === 'derived') value = (atom as State<any> | Derived<any>).value
  else if (type === 'resource') value = { data: (atom as Resource<any>).data, loading: (atom as Resource<any>).loading, error: (atom as Resource<any>).error }
  const subscribers = (node.subscribers?.size ?? 0) as number
  const dependents = (node.dependents?.size ?? 0) as number
  return { type, value, subscribers, dependents }
}

export function listDependencies(atom: any): any[] {
  const internal = getInternal(atom)
  if (!internal) return []
  const { type, node } = internal
  const out: any[] = []
  if (type === 'derived') {
    for (const dep of node.dependencies ?? []) {
      const a = getAtomByNode(dep)
      if (a) out.push(a)
    }
  }
  return out
}

export function listSubscribers(atom: any): Function[] {
  const internal = getInternal(atom)
  if (!internal) return []
  const subs = internal.node.subscribers
  return subs ? Array.from(subs) : []
}
