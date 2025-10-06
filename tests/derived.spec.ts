import { describe, it, expect, vi } from 'vitest';
import { state } from '../src/core/state';
import { derived } from '../src/core/derived';

describe('derived', () => {
  it('should compute initial value', () => {
    const a = state(2);
    const b = state(3);
    const sum = derived(() => a.value + b.value);

    expect(sum.value).toBe(5);
  });

  it('should update when dependencies change', async () => {
    const a = state(2);
    const b = state(3);
    const sum = derived(() => a.value + b.value);

    expect(sum.value).toBe(5);

    a.value = 10;
    await new Promise(resolve => queueMicrotask(resolve));

    expect(sum.value).toBe(13);
  });

  it('should be lazy - not compute until accessed', () => {
    const computeFn = vi.fn(() => 42);
    const d = derived(computeFn);

    expect(computeFn).not.toHaveBeenCalled();

    const val = d.value;
    expect(computeFn).toHaveBeenCalledTimes(1);
    expect(val).toBe(42);
  });

  it('should cache computed value', () => {
    const computeFn = vi.fn(() => 42);
    const d = derived(computeFn);

    d.value;
    d.value;
    d.value;

    expect(computeFn).toHaveBeenCalledTimes(1);
  });

  it('should recompute only when dependencies change', () => {
    const a = state(5);
    const computeFn = vi.fn(() => a.value * 2);
    const doubled = derived(computeFn);

    doubled.value; // First compute
    expect(computeFn).toHaveBeenCalledTimes(1);

    doubled.value; // Cached
    expect(computeFn).toHaveBeenCalledTimes(1);

    a.value = 10; // Change dependency
    doubled.value; // Should recompute
    expect(computeFn).toHaveBeenCalledTimes(2);
  });

  it('should notify subscribers when value changes', async () => {
    const a = state(2);
    const doubled = derived(() => a.value * 2);
    const listener = vi.fn();

    doubled.subscribe(listener);

    // Should be called immediately with current value
    expect(listener).toHaveBeenCalledWith(4);

    a.value = 5;
    await new Promise(resolve => queueMicrotask(resolve));

    expect(listener).toHaveBeenCalledWith(10);
    expect(listener).toHaveBeenCalledTimes(2); // Initial + update
  });

  it('should not notify if computed value is the same', async () => {
    const a = state(2);
    const isEven = derived(() => a.value % 2 === 0);
    const listener = vi.fn();

    isEven.subscribe(listener);
    expect(listener).toHaveBeenCalledWith(true);

    a.value = 4; // Still even
    await new Promise(resolve => queueMicrotask(resolve));

    // Should not notify because value didn't change (true -> true)
    expect(listener).toHaveBeenCalledTimes(1);

    a.value = 5; // Now odd
    await new Promise(resolve => queueMicrotask(resolve));

    expect(listener).toHaveBeenCalledWith(false);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('should support chained derived values', () => {
    const a = state(2);
    const doubled = derived(() => a.value * 2);
    const quadrupled = derived(() => doubled.value * 2);

    expect(quadrupled.value).toBe(8);

    a.value = 5;
    expect(quadrupled.value).toBe(20);
  });

  it('should track multiple dependencies', () => {
    const a = state(2);
    const b = state(3);
    const c = state(4);
    const sum = derived(() => a.value + b.value + c.value);

    expect(sum.value).toBe(9);

    a.value = 10;
    expect(sum.value).toBe(17);

    b.value = 20;
    expect(sum.value).toBe(34);
  });

  it('should handle conditional dependencies', () => {
    const useA = state(true);
    const a = state(10);
    const b = state(20);
    const conditional = derived(() => (useA.value ? a.value : b.value));

    expect(conditional.value).toBe(10);

    useA.value = false;
    expect(conditional.value).toBe(20);

    a.value = 100; // Should not affect result
    expect(conditional.value).toBe(20);

    b.value = 200; // Should affect result
    expect(conditional.value).toBe(200);
  });

  it('should detect circular dependencies', () => {
    const a = state(1);
    let bDerived: any;
    
    const aDerived = derived(() => {
      return bDerived ? bDerived.value + 1 : a.value;
    });
    
    bDerived = derived(() => aDerived.value + 1);

    expect(() => bDerived.value).toThrow('Circular dependency detected');
  });

  it('should unsubscribe correctly', async () => {
    const a = state(2);
    const doubled = derived(() => a.value * 2);
    const listener = vi.fn();

    const unsub = doubled.subscribe(listener);
    expect(listener).toHaveBeenCalledTimes(1);

    a.value = 5;
    await new Promise(resolve => queueMicrotask(resolve));
    expect(listener).toHaveBeenCalledTimes(2);

    unsub();
    a.value = 10;
    await new Promise(resolve => queueMicrotask(resolve));
    expect(listener).toHaveBeenCalledTimes(2); // Not called again
  });
});
