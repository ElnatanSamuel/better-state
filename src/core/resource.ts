import type { Resource, ResourceNode, ResourceSnapshot } from '../types';
import { schedule } from './scheduler';
import { attachInternal } from './internals';
import { devtoolsEmit } from '../devtools/bridge';

export function resource<T>(fetcher: () => Promise<T>): Resource<T> {
  const node: ResourceNode<T> = {
    fetcher,
    data: null,
    loading: true,
    error: null,
    subscribers: new Set(),
    currentPromiseId: 0,
  };

  // Stable snapshot cached on the node to satisfy useSyncExternalStore expectations
  let snapshot: ResourceSnapshot<T> = {
    data: node.data,
    loading: node.loading,
    error: node.error,
  };

  function updateSnapshot() {
    snapshot = {
      data: node.data,
      loading: node.loading,
      error: node.error,
    };
  }

  function notify() {
    if (node.subscribers.size > 0) {
      const snap = snapshot;
      schedule(node, () => {
        const subs = Array.from(node.subscribers);
        for (const sub of subs) {
          sub(snap);
        }
      });
    }
  }

  async function refresh(): Promise<void> {
    node.currentPromiseId++;
    const promiseId = node.currentPromiseId;
    
    node.loading = true;
    node.error = null;
    updateSnapshot();
    notify();

    try {
      const result = await node.fetcher();
      
      // Check if this promise is stale (another refresh was called)
      if (promiseId !== node.currentPromiseId) {
        return; // Ignore stale result
      }

      node.data = result;
      node.error = null;
      node.loading = false;
      updateSnapshot();
      // Deliver immediately to subscribers (async resolution)
      if (node.subscribers.size > 0) {
        const subs = Array.from(node.subscribers);
        const snap = snapshot;
        for (const sub of subs) sub(snap);
      }
      schedule(node, () => {
        devtoolsEmit({ type: 'update', atomKind: 'resource', subscribers: node.subscribers.size, payload: snapshot });
      }, 'devtools');
    } catch (err) {
      // Check if this promise is stale
      if (promiseId !== node.currentPromiseId) {
        return; // Ignore stale error
      }
      node.error = err instanceof Error ? err : new Error(String(err));
      node.loading = false;
      updateSnapshot();
      if (node.subscribers.size > 0) {
        const subs = Array.from(node.subscribers);
        const snap = snapshot;
        for (const sub of subs) sub(snap);
      }
      schedule(node, () => {
        devtoolsEmit({ type: 'update', atomKind: 'resource', subscribers: node.subscribers.size, payload: snapshot });
      }, 'devtools');
    }
  }

  // Initial fetch
  void refresh();

  const resourceObj: Resource<T> = {
    get data() {
      return node.data;
    },

    get loading() {
      return node.loading;
    },

    get error() {
      return node.error;
    },

    refresh,

    subscribe(listener: (snapshot: ResourceSnapshot<T>) => void) {
      node.subscribers.add(listener);

      // Immediately notify with current state
      listener(snapshot);

      return () => {
        node.subscribers.delete(listener);
      };
    },
  } as any;

  // Internal method for React hook to get a stable snapshot reference
  (resourceObj as any).getSnapshot = () => snapshot;

  // Internal SSR hydrate: set fields, rebuild snapshot, and notify immediately
  (resourceObj as any).__hydrate = (s: ResourceSnapshot<T>) => {
    node.data = (s as any).data ?? null;
    node.error = (s as any).error ?? null;
    node.loading = !!(s as any).loading;
    updateSnapshot();
    if (node.subscribers.size > 0) {
      const subs = Array.from(node.subscribers);
      const snap = snapshot;
      for (const sub of subs) sub(snap);
    }
    schedule(node, () => {
      devtoolsEmit({ type: 'update', atomKind: 'resource', subscribers: node.subscribers.size, payload: snapshot });
    }, 'devtools');
  };

  // Tag for debug/inspect
  attachInternal(resourceObj, 'resource', node);

  return resourceObj;
}
