import { apiCache } from "@/lib/api-cache";

export type QueryStatus = "idle" | "loading" | "success" | "error";

/** Mutable internal record for one query key. */
type Record_ = {
  data: unknown;
  error: string | undefined;
  status: QueryStatus;
  /** Bumped on invalidation so consumers know they must refetch. */
  version: number;
  /** When `data` was last written, used to decide whether it is stale. */
  at: number;
};

/** Snapshot for React; a new object is allocated only when the record actually changes. */
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
    record = {
      data: undefined,
      error: undefined,
      status: "idle",
      version: 0,
      at: 0,
    };
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
  const data = "data" in next ? next.data : record.data;
  records.set(key, {
    data,
    error: "error" in next ? next.error : record.error,
    status: next.status ?? record.status,
    version: options.bumpVersion ? record.version + 1 : record.version,
    // Only stamp a fresh time when the value itself changed, so a status-only
    // write does not make old data look recent.
    at: "data" in next ? Date.now() : record.at,
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

  /** Lazy read, so a warm entry resolves on first render with no network round trip. */
  snapshot(key: string): Snapshot {
    const cached = snapshots.get(key);
    if (cached) return cached;

    const record = recordFor(key);
    if (record.status === "idle") {
      const value = apiCache.peek(key);
      if (value !== undefined) {
        records.set(key, {
          ...record,
          data: value,
          status: "success",
          at: Date.now(),
        });
      }
    }
    const snapshot = records.get(key)!;
    snapshots.set(key, snapshot);
    return snapshot;
  },

  /** Milliseconds since this key's data was written; `Infinity` when absent. */
  age(key: string): number {
    const record = records.get(key);
    if (!record || record.data === undefined) return Number.POSITIVE_INFINITY;
    return Date.now() - record.at;
  },

  /** Cache read, used to skip a request when the data is already warm. */
  cached<T>(key: string): T | undefined {
    return apiCache.peek<T>(key);
  },

  /** Publish a resolved request; the api layer has already cached the value. */
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

  /** Drop matching keys and bump their version so mounted consumers refetch. */
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

  /** Marks keys stale but keeps their data, so a refresh does not blank the page. */
  markAllStale() {
    for (const key of records.keys()) {
      write(key, { status: "idle" }, { bumpVersion: true });
    }
  },
};
