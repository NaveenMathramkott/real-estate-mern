import { apiCache } from "@/lib/api-cache";

export type QueryStatus = "idle" | "loading" | "success" | "error";

/** Mutable internal record for one query key. */
type Record_ = {
  data: unknown;
  error: string | undefined;
  status: QueryStatus;
  /** Bumped on invalidation so consumers know they must refetch. */
  version: number;
};

/**
 * Immutable snapshot handed to React. A new object is only allocated when the
 * underlying record actually changes, which is what lets
 * `useSyncExternalStore` detect updates via its `Object.is` comparison.
 */
type Snapshot = Readonly<Record_>;

type Listener = () => void;

const records = new Map<string, Record_>();
const snapshots = new Map<string, Snapshot>();
const listeners = new Map<string, Set<Listener>>();
/** Guards against a second request for a key that is already in flight. */
const inflight = new Set<string>();

function recordFor(key: string): Record_ {
  let record = records.get(key);
  if (!record) {
    record = { data: undefined, error: undefined, status: "idle", version: 0 };
    records.set(key, record);
  }
  return record;
}

function notify(key: string) {
  snapshots.delete(key);
  for (const listener of listeners.get(key) ?? []) listener();
}

function write(
  key: string,
  next: Partial<Record_>,
  options: { bumpVersion?: boolean } = {},
) {
  const record = recordFor(key);
  records.set(key, {
    data: "data" in next ? next.data : record.data,
    error: "error" in next ? next.error : record.error,
    status: next.status ?? record.status,
    version: options.bumpVersion ? record.version + 1 : record.version,
  });
  notify(key);
}

function matches(key: string, prefixes: string[]) {
  return prefixes.some((prefix) => key.startsWith(prefix));
}

export const queryStore = {
  subscribe(key: string, listener: Listener) {
    let set = listeners.get(key);
    if (!set) {
      set = new Set();
      listeners.set(key, set);
    }
    set.add(listener);
    return () => {
      set.delete(listener);
      if (set.size === 0) listeners.delete(key);
    };
  },

  /**
   * Reads are lazy so a fresh cache entry resolves on the very first render
   * without a network round trip. The snapshot object is reused until the
   * record changes, keeping React's change detection correct.
   */
  snapshot(key: string): Snapshot {
    const cached = snapshots.get(key);
    if (cached) return cached;

    const record = recordFor(key);
    if (record.status === "idle") {
      const value = apiCache.peek(key);
      if (value !== undefined) {
        records.set(key, { ...record, data: value, status: "success" });
      }
    }
    const snapshot = records.get(key)!;
    snapshots.set(key, snapshot);
    return snapshot;
  },

  /** Cache read, used to skip a request when the data is already warm. */
  cached<T>(key: string): T | undefined {
    return apiCache.peek<T>(key);
  },

  /**
   * Publish a resolved request. The api layer already cached the value with the
   * endpoint's own TTL, so this only updates the store.
   */
  applyResult(key: string, data: unknown) {
    write(key, { data, error: undefined, status: "success" });
  },

  /** Write an optimistic value into both the store and the response cache. */
  set<T>(key: string, data: T, ttl = 60_000) {
    apiCache.set(key, data, ttl);
    write(key, { data, error: undefined, status: "success" });
  },

  start(key: string) {
    if (recordFor(key).status === "loading") return;
    write(key, { status: "loading", error: undefined });
  },

  succeed(key: string, data: unknown) {
    queryStore.applyResult(key, data);
  },

  fail(key: string, message: string) {
    write(key, { error: message, status: "error" });
  },

  isPending(key: string) {
    return inflight.has(key);
  },

  begin(key: string) {
    inflight.add(key);
  },

  end(key: string) {
    inflight.delete(key);
  },

  /**
   * Drop every entry whose key starts with one of the prefixes and bump its
   * version, so mounted consumers refetch automatically.
   */
  invalidate(...prefixes: string[]) {
    apiCache.invalidate(...prefixes);
    for (const key of records.keys()) {
      if (matches(key, prefixes)) {
        write(key, { status: "idle" }, { bumpVersion: true });
      }
    }
  },

  resetAll() {
    for (const key of records.keys()) {
      write(key, { status: "idle" }, { bumpVersion: true });
    }
  },
};
