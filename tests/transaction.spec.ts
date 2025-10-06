import { describe, it, expect, vi } from 'vitest';
import { state } from '../src/core/state';
import { transaction } from '../src/core/scheduler';

describe('transaction', () => {
  it('should batch multiple state updates', async () => {
    const a = state(1);
    const b = state(2);
    const listener = vi.fn();

    a.subscribe(listener);

    transaction(() => {
      a.value = 10;
      a.value = 20;
      a.value = 30;
    });

    // Should not have been called yet
    expect(listener).not.toHaveBeenCalled();

    await new Promise(resolve => queueMicrotask(resolve));

    // Should be called once with final value
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(30);
  });

  it('should support nested transactions', async () => {
    const count = state(0);
    const listener = vi.fn();

    count.subscribe(listener);

    transaction(() => {
      count.value = 1;
      transaction(() => {
        count.value = 2;
      });
      count.value = 3;
    });

    await new Promise(resolve => queueMicrotask(resolve));

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(3);
  });

  it('should handle errors in transactions', async () => {
    const count = state(0);
    const listener = vi.fn();

    count.subscribe(listener);

    expect(() => {
      transaction(() => {
        count.value = 5;
        throw new Error('Test error');
      });
    }).toThrow('Test error');

    await new Promise(resolve => queueMicrotask(resolve));

    // Should still notify with the value set before error
    expect(listener).toHaveBeenCalledWith(5);
  });
});
