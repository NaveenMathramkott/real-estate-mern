/**
 * In-memory response cache for GET requests.
 *
 * Every entry carries a hard expiry plus the time it was written, which lets
 * callers decide whether a cached value may be shown without a network round
 * trip. Requests are de-duplicated so several components asking for the same
 * key share one call.
 *
 * Deliberately memory-only: an earlier version also mirrored entries into
 * sessionStorage, and because that survives a reload it made every page look
 * frozen at whatever it had fetched last. Freshness on navigation matters more
 * here than a faster first paint.
 */

type Entry = { value: unknown; expires: number; storedAt: number };
type Pending = Promise<unknown>;

const memory = new Map<string, Entry>();
const inflight = new Map<string, Pending>();
const listeners = new Set<() => void>();
const DEFAULT_TTL = 60_000;

function alive(entry: Entry | undefined): entry is Entry {
  return Boolean(entry) && entry!.expires > Date.now();
}

export const apiCache = {
  /** The cached value, or `undefined` once the entry has expired. */
  peek<T>(key: string): T | undefined {
    const entry = memory.get(key);
    if (!alive(entry)) {
      memory.delete(key);
      return undefined;
    }
    return entry.value as T;
  },

  set(key: string, value: unknown, ttl = DEFAULT_TTL) {
    const now = Date.now();
    memory.set(key, { value, expires: now + ttl, storedAt: now });
  },

  /** Milliseconds since the entry was written, or `Infinity` when absent. */
  age(key: string): number {
    const entry = memory.get(key);
    if (!alive(entry)) return Number.POSITIVE_INFINITY;
    return Date.now() - entry.storedAt!;
  },

  /** True when the entry is missing, expired, or older than `staleTime`. */
  isStale(key: string, staleTime = 0): boolean {
    return this.age(key) >= staleTime;
  },

  delete(key: string) {
    memory.delete(key);
  },

  /** Subscribe to invalidations so dependent stores can drop derived state. */
  onInvalidate(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  /** Drop every entry whose key starts with one of the prefixes. */
  invalidate(...prefixes: string[]) {
    if (prefixes.length === 0) {
      memory.clear();
    } else {
      for (const key of memory.keys()) {
        if (prefixes.some((prefix) => key.startsWith(prefix))) {
          memory.delete(key);
        }
      }
    }
    for (const listener of listeners) listener();
  },

  clear() {
    memory.clear();
    for (const listener of listeners) listener();
  },

  /** Share one in-flight promise between concurrent callers. */
  dedupe<T>(key: string, run: () => Promise<T>): Promise<T> {
    const existing = inflight.get(key) as Promise<T> | undefined;
    if (existing) return existing;
    const promise = run().finally(() => inflight.delete(key));
    inflight.set(key, promise);
    return promise;
  },
};

/** Stable key builder so callers get consistent cache identities. */
export function cacheKey(...parts: unknown[]) {
  return parts
    .map((part) =>
      typeof part === "string" || typeof part === "number"
        ? String(part)
        : JSON.stringify(part),
    )
    .join("|");
}
