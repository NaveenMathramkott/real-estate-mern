import * as React from "react";

import { apiCache } from "@/lib/api-cache";
import { queryStore, type QueryStatus } from "@/lib/query-store";

export type { QueryStatus };

const IDLE: { data: undefined; error: undefined; status: QueryStatus } = {
  data: undefined,
  error: undefined,
  status: "idle",
};

export type QueryResult<T> = {
  data: T | undefined;
  error: string | undefined;
  status: QueryStatus;
  isLoading: boolean;
  isFetching: boolean;
  refetch: () => Promise<void>;
  setData: (value: T) => void;
};

/**
 * Read-through query hook layered on the shared response cache.
 *
 * State lives in an external store, so several components asking for the same
 * key share one request and one cache entry. Fresh entries resolve on mount
 * without a network round trip.
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

  const run = React.useCallback(async () => {
    if (!key) return;
    const cached = apiCache.peek<T>(key);
    if (cached !== undefined) {
      queryStore.succeed(key, cached);
      return;
    }
    queryStore.start(key);
    try {
      queryStore.succeed(key, await fetcherRef.current());
    } catch (error) {
      queryStore.fail(
        key,
        error instanceof Error ? error.message : "Request failed",
      );
    }
  }, [key]);

  React.useEffect(() => {
    if (!active || !key) return;
    if (queryStore.snapshot(key).status === "idle") void run();
  }, [active, key, run]);

  const setData = React.useCallback(
    (next: T) => {
      if (key) queryStore.set(key, next);
    },
    [key],
  );

  return {
    data: value,
    error: state.error,
    status: state.status,
    isLoading: state.status === "loading",
    isFetching: state.status === "loading",
    refetch: run,
    setData,
  } satisfies QueryResult<T>;
}
