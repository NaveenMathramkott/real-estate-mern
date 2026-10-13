import { apiCache } from "@/lib/api-client";

export type QueryStatus = "idle" | "loading" | "success" | "error";

export type QueryState<T> = {
  data: T | undefined;
  error: string | undefined;
  status: QueryStatus;
};

/**
 * Tiny observable query store so components can read cache state through
 * `useSyncExternalStore` instead of mirroring it into component state.
 */

type Entry = QueryState<unknown> & { listeners: Set<() => void> };

const entries = new Map<string, Entry>();

function entryFor(key: string): Entry {
  let entry = entries.get(key);
  if (!entry) {
    entry = {
      data: undefined,
      error: undefined,
      status: "idle",
      listeners: new Set(),
    };
    entries.set(key, entry);
  }
  return entry;
}

function patch(key: string, next: Partial<QueryState<unknown>>) {
  const entry = entryFor(key);
  entry.data = "data" in next ? next.data : entry.data;
  entry.error = "error" in next ? next.error : entry.error;
  entry.status = next.status ?? entry.status;
  for (const listener of entry.listeners) listener();
}

export const queryStore = {
  subscribe(key: string, listener: () => void) {
    const entry = entryFor(key);
    entry.listeners.add(listener);
    return () => {
      entry.listeners.delete(listener);
    };
  },

  snapshot(key: string): QueryState<unknown> {
    const entry = entryFor(key);
    if (entry.status === "idle") {
      const cached = apiCache.peek(key);
      if (cached !== undefined) {
        entry.data = cached;
        entry.status = "success";
      }
    }
    return entry;
  },

  reset(key: string) {
    const entry = entryFor(key);
    entry.data = undefined;
    entry.error = undefined;
    entry.status = "idle";
    for (const listener of entry.listeners) listener();
  },

  /** Write fresh data into both the store and the shared response cache. */
  set<T>(key: string, data: T, ttl = 60_000) {
    apiCache.set(key, data, ttl);
    patch(key, { data, error: undefined, status: "success" });
  },

  invalidate(...prefixes: string[]) {
    apiCache.invalidate(...prefixes);
    for (const key of entries.keys()) {
      if (prefixes.some((prefix) => key.startsWith(prefix)))
        queryStore.reset(key);
    }
  },

  start(key: string) {
    if (entryFor(key).status === "loading") return;
    patch(key, { status: "loading" });
  },

  succeed(key: string, data: unknown) {
    queryStore.set(key, data);
  },

  fail(key: string, message: string) {
    patch(key, { error: message, status: "error" });
  },
};

// Any cache invalidation also drops the derived store entries that mirror it.
apiCache.onInvalidate(() => {
  for (const key of entries.keys()) {
    const entry = entries.get(key)!;
    entry.data = undefined;
    entry.error = undefined;
    entry.status = "idle";
    for (const listener of entry.listeners) listener();
  }
});
