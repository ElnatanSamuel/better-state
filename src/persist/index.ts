import type { State } from '../types'

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export function persist<T>(atom: State<T>, opts: { key: string; storage?: StorageLike }): State<T> {
  const storage: StorageLike = opts.storage ?? getDefaultStorage()
  const { key } = opts

  try {
    const raw = storage.getItem(key)
    if (raw != null) {
      const parsed = JSON.parse(raw) as T
      // Only set if different to avoid redundant notification
      if (!Object.is(atom.value, parsed)) atom.set(parsed)
    }
  } catch {
    // ignore bad JSON or storage errors
  }

  // write-through on updates
  atom.subscribe((v) => {
    try {
      storage.setItem(key, JSON.stringify(v))
    } catch {
      // ignore
    }
  })

  return atom
}

function getDefaultStorage(): StorageLike {
  const g: any = typeof globalThis !== 'undefined' ? (globalThis as any) : undefined
  if (g && g.localStorage) return g.localStorage as StorageLike
  // memory fallback
  const mem = new Map<string, string>()
  return {
    getItem: (k) => (mem.has(k) ? mem.get(k)! : null),
    setItem: (k, v) => void mem.set(k, v),
    removeItem: (k) => void mem.delete(k),
  }
}
