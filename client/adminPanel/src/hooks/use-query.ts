import * as React from "react";

import { queryStore, type QueryStatus } from "@/lib/query-store";

export type { QueryStatus };

const IDLE = {
  data: undefined,
  error: undefined,
  status: "idle",
  version: 0,
} as const;

export type QueryResult<T> = {
  data: T | undefined;
  error: string | undefined;
  status: QueryStatus;
  isLoading: boolean;
  isFetching: boolean;
  refetch: () => Promise<void>;
  setData: (value: T) => void;
  invalidate: () => void;
};

/**
 * Read-through query hook layered on the shared response cache.
 *
 * State lives in an external store so several components asking for the same
 * key share one request and one cache entry. Invalidation bumps a version,
 * which makes mounted queries refetch themselves — no manual `refetch()` after
 * every mutation.
 */
export function useQuery<T>(
  key: string | null,
  fetcher: () => Promise<T>,
  options: { enabled?: boolean } = {},
) {
  const enabled = options.enabled ?? true;
  const active = Boolean(key) && enabled;
  const idle = IDLE;

  const fetcherRef = React.useRef(fetcher);
  React.useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const subscribe = React.useCallback(
    (listener: () => void) =>
      key ? queryStore.subscribe(key, listener) : () => {},
    [key],
  );

  const getSnapshot = React.useCallback(
    () => (key ? queryStore.snapshot(key) : idle),
    [key, idle],
  );

  const state = React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const value = state.data as T | undefined;
  const { status, version } = state;

  const run = React.useCallback(async () => {
    if (!key) return;

    const cached = queryStore.cached<T>(key);
    if (cached !== undefined) {
      queryStore.succeed(key, cached);
      return;
    }

    // Anything resolved after an invalidation is stale — drop it and let the
    // version-driven effect start a fresh request instead.
    const generation = queryStore.snapshot(key).version;
    queryStore.begin(key);
    queryStore.start(key);
    try {
      const result = await fetcherRef.current();
      if (queryStore.snapshot(key).version !== generation) return;
      queryStore.succeed(key, result);
    } catch (error) {
      if (queryStore.snapshot(key).version !== generation) return;
      queryStore.fail(
        key,
        error instanceof Error ? error.message : "Request failed",
      );
    } finally {
      queryStore.end(key);
    }
  }, [key]);

  React.useEffect(() => {
    if (!active || !key) return;
    if (status !== "idle") return;
    if (queryStore.isPending(key)) return;
    void run();
  }, [active, key, status, version, run]);

  const setData = React.useCallback(
    (next: T) => {
      if (key) queryStore.set(key, next);
    },
    [key],
  );

  const invalidate = React.useCallback(() => {
    if (key) queryStore.invalidate(key);
  }, [key]);

  return {
    data: value,
    error: state.error,
    status,
    isLoading: status === "loading",
    isFetching: status === "loading",
    refetch: run,
    setData,
    invalidate,
  } satisfies QueryResult<T>;
}
