// Minimal devtools/event bridge. Optional global consumer can hook via window.__BETTER_STATE_DEVTOOLS__
export type AtomKind = 'state' | 'derived' | 'resource';
export type UpdateEvent = {
  type: 'update';
  atomKind: AtomKind;
  subscribers?: number;
  payload?: any;
};

const localListeners = new Set<(e: UpdateEvent) => void>();

export function onStateChange(listener: (e: UpdateEvent) => void) {
  localListeners.add(listener);
  return () => localListeners.delete(listener);
}

export function devtoolsEmit(event: UpdateEvent) {
  try {
    // Local listeners
    for (const l of localListeners) l(event);
    // Global extension hook
    const g: any = (globalThis as any).__BETTER_STATE_DEVTOOLS__;
    if (g && typeof g.emit === 'function') g.emit(event);
  } catch {
    // ignore
  }
}
