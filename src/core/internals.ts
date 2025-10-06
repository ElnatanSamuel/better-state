// Internal symbol to tag atoms with their node for debugging/inspection
export const INTERNAL = Symbol.for('better-state.internal');

export type AtomType = 'state' | 'derived' | 'resource';

export interface InternalTag<TNode = any> {
  type: AtomType;
  node: TNode;
}

export function attachInternal(target: any, type: AtomType, node: any) {
  try {
    Object.defineProperty(target, INTERNAL, {
      value: { type, node } as InternalTag,
      enumerable: false,
      configurable: false,
      writable: false,
    });
    registerAtom(node, target);
  } catch {
    // ignore if cannot define (should not happen)
  }
}

export function getInternal(target: any): InternalTag | undefined {
  return target && (target as any)[INTERNAL];
}

// Map internal nodes back to their public atoms for debug traversal
const nodeToAtom = new WeakMap<object, any>();

export function registerAtom(node: object, atom: any) {
  nodeToAtom.set(node, atom);
}

export function getAtomByNode(node: object): any | undefined {
  return nodeToAtom.get(node);
}
