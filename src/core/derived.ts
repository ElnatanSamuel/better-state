import type { Derived, DerivedNode } from '../types';
import { schedule } from './scheduler';
import { getCurrentTracker, pushTracker, popTracker } from './tracker';
import { attachInternal } from './internals';
import { devtoolsEmit } from '../devtools/bridge';

export function derived<T>(compute: () => T): Derived<T> {
  const node: DerivedNode<T> = {
    compute,
    cached: undefined,
    dirty: true,
    dependencies: new Set(),
    subscribers: new Set(),
    dependents: new Set(),
  };

  let isComputing = false;

  function recomputeIfNeeded(): T {
    // If any dependency (derived) is dirty, this node must recompute
    let depsDirty = false;
    for (const dep of node.dependencies) {
      if ((dep as any).dirty === true) {
        depsDirty = true;
        break;
      }
    }

    if (!node.dirty && !depsDirty && node.cached !== undefined) {
      return node.cached;
    }

    // Cycle detection
    if (isComputing) {
      throw new Error('Circular dependency detected in derived computation');
    }

    isComputing = true;

    // Clear previous dependencies
    for (const dep of node.dependencies) {
      if ('dependents' in dep) {
        dep.dependents.delete(node);
      }
    }
    node.dependencies.clear();

    // Track new dependencies
    pushTracker(node);
    try {
      const newValue = node.compute();
      const changed = !Object.is(node.cached, newValue);
      const oldValue = node.cached;
      
      node.cached = newValue;
      node.dirty = false;

      // Only notify if value actually changed and we have subscribers
      if (changed && node.subscribers.size > 0 && oldValue !== undefined) {
        schedule(node, () => {
          const subs = Array.from(node.subscribers);
          for (const sub of subs) {
            sub(node.cached!);
          }
        }, 'notify');
      }

      if (changed) {
        schedule(node, () => {
          devtoolsEmit({ type: 'update', atomKind: 'derived', subscribers: node.subscribers.size, payload: node.cached });
        }, 'devtools');
      }

      // If value changed, mark dependents dirty and schedule their recompute
      if (changed) {
        for (const dep of node.dependents) {
          dep.dirty = true;
          if (dep.subscribers.size > 0) {
            schedule(dep, () => {
              const recompute = (dep as any).__recompute as (() => unknown) | undefined;
              if (recompute) recompute();
            }, 'recompute');
          }
        }
      }

      return newValue;
    } catch (error) {
      // Reset dirty flag even on error to avoid infinite loops
      node.dirty = false;
      throw error;
    } finally {
      popTracker();
      isComputing = false;
    }
  }

  // Expose an internal hook so states can trigger recomputation in batch
  (node as any).__recompute = recomputeIfNeeded;

  const derivedObj: Derived<T> = {
    get value() {
      // Register as dependency if inside another tracker
      const tracker = getCurrentTracker();
      if (tracker && tracker !== node) {
        tracker.dependencies.add(node);
        node.dependents.add(tracker);
      }

      return recomputeIfNeeded();
    },

    subscribe(listener: (val: T) => void) {
      node.subscribers.add(listener);

      // Compute initial value and notify subscriber immediately
      const currentValue = recomputeIfNeeded();
      listener(currentValue);

      return () => {
        node.subscribers.delete(listener);
      };
    },
  };

  attachInternal(derivedObj, 'derived', node);

  return derivedObj;
}
