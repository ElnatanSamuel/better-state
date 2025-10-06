import { describe, it, expect, vi } from 'vitest';
import { state } from '../src/core/state';

describe('state', () => {
  it('should create a state with initial value', () => {
    const count = state(0);
    expect(count.value).toBe(0);
  });

  it('should update value when set', () => {
    const count = state(0);
    count.value = 5;
    expect(count.value).toBe(5);
  });

  it('should use set() method', () => {
    const count = state(0);
    count.set(10);
    expect(count.value).toBe(10);
  });

  it('should notify subscribers when value changes', async () => {
    const count = state(0);
    const listener = vi.fn();

    count.subscribe(listener);
    count.value = 1;

    // Wait for microtask to complete
    await new Promise(resolve => queueMicrotask(resolve));

    expect(listener).toHaveBeenCalledWith(1);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('should not notify if value is equal (Object.is)', async () => {
    const count = state(5);
    const listener = vi.fn();

    count.subscribe(listener);
    count.value = 5; // Same value

    await new Promise(resolve => queueMicrotask(resolve));

    expect(listener).not.toHaveBeenCalled();
  });

  it('should support custom equality comparator', async () => {
    const obj = state({ x: 1 }, (a, b) => a.x === b.x);
    const listener = vi.fn();

    obj.subscribe(listener);
    obj.value = { x: 1 }; // Different object, same x

    await new Promise(resolve => queueMicrotask(resolve));

    expect(listener).not.toHaveBeenCalled();

    obj.value = { x: 2 }; // Different x
    await new Promise(resolve => queueMicrotask(resolve));

    expect(listener).toHaveBeenCalledWith({ x: 2 });
  });

  it('should unsubscribe correctly', async () => {
    const count = state(0);
    const listener = vi.fn();

    const unsub = count.subscribe(listener);
    count.value = 1;

    await new Promise(resolve => queueMicrotask(resolve));
    expect(listener).toHaveBeenCalledTimes(1);

    unsub();
    count.value = 2;

    await new Promise(resolve => queueMicrotask(resolve));
    expect(listener).toHaveBeenCalledTimes(1); // Still 1, not called again
  });

  it('should batch multiple synchronous updates', async () => {
    const count = state(0);
    const listener = vi.fn();

    count.subscribe(listener);

    count.value = 1;
    count.value = 2;
    count.value = 3;

    // Should not have been called yet (batched)
    expect(listener).not.toHaveBeenCalled();

    await new Promise(resolve => queueMicrotask(resolve));

    // Should be called once with final value
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(3);
  });

  it('should support multiple subscribers', async () => {
    const count = state(0);
    const listener1 = vi.fn();
    const listener2 = vi.fn();

    count.subscribe(listener1);
    count.subscribe(listener2);

    count.value = 5;

    await new Promise(resolve => queueMicrotask(resolve));

    expect(listener1).toHaveBeenCalledWith(5);
    expect(listener2).toHaveBeenCalledWith(5);
  });
});
