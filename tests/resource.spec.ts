import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resource } from '../src/core/resource';

describe('resource', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should start with loading state', () => {
    const res = resource(async () => 'data');

    expect(res.loading).toBe(true);
    expect(res.data).toBe(null);
    expect(res.error).toBe(null);
  });

  it('should set data when promise resolves', async () => {
    const res = resource(async () => {
      return 'test data';
    });

    expect(res.loading).toBe(true);

    await vi.runAllTimersAsync();

    expect(res.loading).toBe(false);
    expect(res.data).toBe('test data');
    expect(res.error).toBe(null);
  });

  it('should set error when promise rejects', async () => {
    const testError = new Error('Test error');
    const res = resource(async () => {
      throw testError;
    });

    expect(res.loading).toBe(true);

    await vi.runAllTimersAsync();

    expect(res.loading).toBe(false);
    expect(res.data).toBe(null);
    expect(res.error).toBe(testError);
  });

  it('should notify subscribers on state changes', async () => {
    const listener = vi.fn();
    const res = resource(async () => 'data');

    res.subscribe(listener);

    // Should be called immediately with initial state
    expect(listener).toHaveBeenCalledWith({
      data: null,
      loading: true,
      error: null,
    });

    await vi.runAllTimersAsync();

    // Should be called when data loads
    expect(listener).toHaveBeenCalledWith({
      data: 'data',
      loading: false,
      error: null,
    });
  });

  it('should handle refresh', async () => {
    let counter = 0;
    const res = resource(async () => {
      counter++;
      return `data-${counter}`;
    });

    await vi.runAllTimersAsync();
    expect(res.data).toBe('data-1');

    await res.refresh();
    await vi.runAllTimersAsync();
    expect(res.data).toBe('data-2');
  });

  it('should ignore stale promises (race condition)', async () => {
    let resolveFirst: (value: string) => void;
    let resolveSecond: (value: string) => void;

    const firstPromise = new Promise<string>((resolve) => {
      resolveFirst = resolve;
    });

    const secondPromise = new Promise<string>((resolve) => {
      resolveSecond = resolve;
    });

    let callCount = 0;
    const res = resource(async () => {
      callCount++;
      return callCount === 1 ? firstPromise : secondPromise;
    });

    await vi.runAllTimersAsync();

    // Trigger second refresh before first completes
    res.refresh();
    await vi.runAllTimersAsync();

    // Resolve second promise first
    resolveSecond!('second');
    await vi.runAllTimersAsync();

    expect(res.data).toBe('second');

    // Resolve first promise (should be ignored as stale)
    resolveFirst!('first');
    await vi.runAllTimersAsync();

    expect(res.data).toBe('second'); // Should still be 'second'
  });

  it('should unsubscribe correctly', async () => {
    const listener = vi.fn();
    const res = resource(async () => 'data');

    const unsub = res.subscribe(listener);
    expect(listener).toHaveBeenCalledTimes(1);

    await vi.runAllTimersAsync();
    expect(listener).toHaveBeenCalledTimes(2);

    unsub();
    await res.refresh();
    await vi.runAllTimersAsync();

    expect(listener).toHaveBeenCalledTimes(2); // Not called again
  });

  it('should handle multiple subscribers', async () => {
    const listener1 = vi.fn();
    const listener2 = vi.fn();
    const res = resource(async () => 'data');

    res.subscribe(listener1);
    res.subscribe(listener2);

    await vi.runAllTimersAsync();

    expect(listener1).toHaveBeenCalledWith({
      data: 'data',
      loading: false,
      error: null,
    });

    expect(listener2).toHaveBeenCalledWith({
      data: 'data',
      loading: false,
      error: null,
    });
  });

  it('should convert non-Error rejections to Error', async () => {
    const res = resource(async () => {
      throw 'string error';
    });

    await vi.runAllTimersAsync();

    expect(res.error).toBeInstanceOf(Error);
    expect(res.error?.message).toBe('string error');
  });
});
