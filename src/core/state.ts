import type { State, StateNode } from '../types';
import { schedule } from './scheduler';
import { getCurrentTracker } from './tracker';
import { attachInternal } from './internals';
import { devtoolsEmit } from '../devtools/bridge';

export function state<T>(initialValue: T, eq: (a: T, b: T) => boolean = Object.is): State<T> {
  const node: StateNode<T> = {
    _value: initialValue,
    initial: initialValue,
    subscribers: new Set(),
    dependents: new Set(),
    eq,
  };

  const stateObj: State<T> = {
    get value() {
      // Dependency tracking: register current tracker if any
      const tracker = getCurrentTracker();
      if (tracker) {
        tracker.dependencies.add(node);
        node.dependents.add(tracker);
      }
      return node._value;
    },

    set value(newValue: T) {
      // Equality check to avoid unnecessary updates
      if (node.eq(node._value, newValue)) {
        return;
      }

      node._value = newValue;

      // Mark all dependent derived nodes (transitively) as dirty
      const stack = Array.from(node.dependents);
      const seen = new Set<any>();
      while (stack.length) {
        const dep = stack.pop()!;
        if (seen.has(dep)) continue;
        seen.add(dep);
        dep.dirty = true;
        // propagate to downstream dependents
        for (const next of dep.dependents) {
          stack.push(next);
        }
        // If the dependent has subscribers, schedule its recompute in this batch
        if (dep.subscribers.size > 0) {
          schedule(dep, () => {
            const recompute = (dep as any).__recompute as (() => unknown) | undefined;
            if (recompute) recompute();
          }, 'recompute');
        }
      }

      // Schedule notification for direct subscribers
      if (node.subscribers.size > 0) {
        const currentValue = node._value;
        schedule(node, () => {
          const subs = Array.from(node.subscribers);
          for (const sub of subs) {
            sub(currentValue);
          }
        }, 'notify');
      }

      // Devtools event
      schedule(node, () => {
        devtoolsEmit({ type: 'update', atomKind: 'state', subscribers: node.subscribers.size, payload: node._value });
      }, 'devtools');
    },

    set(newValue: T) {
      this.value = newValue;
    },

    subscribe(listener: (val: T) => void) {
      node.subscribers.add(listener);
      return () => {
        node.subscribers.delete(listener);
      };
    },
  };

  // Tag for debug/inspect
  attachInternal(stateObj, 'state', node);

  return stateObj;
}
