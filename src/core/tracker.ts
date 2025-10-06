// Global dependency tracking stack
import type { DerivedNode } from '../types';

export const currentTrackerStack: Array<DerivedNode<any>> = [];

export function getCurrentTracker(): DerivedNode<any> | undefined {
  return currentTrackerStack[currentTrackerStack.length - 1];
}

export function pushTracker(tracker: DerivedNode<any>) {
  currentTrackerStack.push(tracker);
}

export function popTracker() {
  currentTrackerStack.pop();
}
