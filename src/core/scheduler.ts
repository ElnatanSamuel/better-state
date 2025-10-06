// Batching scheduler for notifications
// Uses microtask queue to coalesce multiple synchronous updates

const pendingNotifications = new Map<any, Map<string, () => void>>();
let isFlushScheduled = false;
let transactionDepth = 0;

function flush() {
  const entries = Array.from(pendingNotifications.entries());
  pendingNotifications.clear();
  isFlushScheduled = false;
  for (const [, map] of entries) {
    for (const task of map.values()) task();
  }
}

export function schedule(key: any, task: () => void, tag: string = 'default') {
  if (typeof task !== 'function') return;
  let map = pendingNotifications.get(key);
  if (!map) {
    map = new Map<string, () => void>();
    pendingNotifications.set(key, map);
  }
  map.set(tag, task);
  
  if (!isFlushScheduled && transactionDepth === 0) {
    isFlushScheduled = true;
    queueMicrotask(flush);
  }
}

// Optional: transaction API to batch multiple writes

export function transaction(fn: () => void) {
  transactionDepth++;
  try {
    fn();
  } finally {
    transactionDepth--;
    if (transactionDepth === 0 && pendingNotifications.size > 0 && !isFlushScheduled) {
      isFlushScheduled = true;
      queueMicrotask(flush);
    }
  }
}
