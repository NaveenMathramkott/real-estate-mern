/**
 * In-memory + sessionStorage response cache for GET requests.
 * Every entry has a TTL and an in-flight de-duplication map so that
 * multiple components requesting the same key share one network call.
 */

type Entry = { value: unknown; expires: number };
type Pending = Promise<unknown>;

const memory = new Map<string, Entry>();
const inflight = new Map<string, Pending>();
const listeners = new Set<() => void>();
const NAMESPACE = "tap:cache:";
const DEFAULT_TTL = 60_000;

function storageKey(key: string) {
  return NAMESPACE + key;
}

function readSession(key: string): Entry | undefined {
  try {
    const raw = sessionStorage.getItem(storageKey(key));
    if (!raw) return undefined;
    const entry = JSON.parse(raw) as Entry;
    if (entry.expires < Date.now()) {
      sessionStorage.removeItem(storageKey(key));
      return undefined;
    }
    return entry;
  } catch {
    return undefined;
  }
}

function writeSession(key: string, entry: Entry) {
  try {
    sessionStorage.setItem(storageKey(key), JSON.stringify(entry));
  } catch {
    /* quota exceeded — memory cache still applies */
  }
}

export const apiCache = {
  peek<T>(key: string): T | undefined {
    const entry = memory.get(key) ?? readSession(key);
    if (!entry) return undefined;
    if (entry.expires < Date.now()) {
      memory.delete(key);
      sessionStorage.removeItem(storageKey(key));
      return undefined;
    }
    return entry.value as T;
  },

  set(key: string, value: unknown, ttl = DEFAULT_TTL) {
    const entry: Entry = { value, expires: Date.now() + ttl };
    memory.set(key, entry);
    writeSession(key, entry);
  },

  delete(key: string) {
    memory.delete(key);
    sessionStorage.removeItem(storageKey(key));
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
    for (const key of memory.keys()) {
      if (prefixes.some((p) => key.startsWith(p))) {
        memory.delete(key);
        sessionStorage.removeItem(storageKey(key));
      }
    }
    for (const key of Object.keys(sessionStorage)) {
      if (!key.startsWith(NAMESPACE)) continue;
      const short = key.slice(NAMESPACE.length);
      if (prefixes.some((p) => short.startsWith(p)))
        sessionStorage.removeItem(key);
    }
    for (const listener of listeners) listener();
  },

  clear() {
    memory.clear();
    for (const key of Object.keys(sessionStorage)) {
      if (key.startsWith(NAMESPACE)) sessionStorage.removeItem(key);
    }
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
