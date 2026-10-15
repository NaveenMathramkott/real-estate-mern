import * as React from "react";

import { withFreshCache } from "@/lib/api-client";
import { queryStore, type QueryStatus } from "@/lib/query-store";

export type { QueryStatus };

const IDLE = {
  data: undefined,
  error: undefined,
  status: "idle",
  version: 0,
  at: 0,
} as const;

export type QueryResult<T> = {
  data: T | undefined;
  error: string | undefined;
  status: QueryStatus;
  /** True only before the first value arrives — drives skeletons. */
  isLoading: boolean;
  /** True whenever a request is in flight, including background revalidation. */
  isFetching: boolean;
  /** Background refresh over data that is already on screen. */
  isValidating: boolean;
  refetch: () => Promise<void>;
  setData: (value: T) => void;
  invalidate: () => void;
};

export type UseQueryOptions = {
  enabled?: boolean;
  /** How long data may be reused. Defaults to 0 so every mount revalidates; raise for hot keys. */
  staleTime?: number;
};

/** Read-through query over a shared store, so one key means one request. Revalidates whenever
 *  the query becomes active, keeping cached data on screen while it refreshes underneath. */
export function useQuery<T>(
  key: string | null,
  fetcher: () => Promise<T>,
  options: UseQueryOptions = {},
) {
  const enabled = options.enabled ?? true;
  const staleTime = options.staleTime ?? 0;
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
  const { status } = state;

  const run = React.useCallback(
    async (options_: { revalidate?: boolean } = {}) => {
      if (!key) return;
      // One request per key at a time; concurrent callers share the promise.
      if (queryStore.isPending(key)) return;

      const hasData = queryStore.snapshot(key).data !== undefined;
      // With data on screen the request is a background refresh and must not be
      // answered from the response cache.
      const revalidate = options_.revalidate ?? hasData;

      // Anything resolved after an invalidation is stale — drop it and let the
      // version-driven effect start a fresh request instead.
      const generation = queryStore.snapshot(key).version;
      queryStore.begin(key);
      queryStore.start(key);
      try {
        const result = revalidate
          ? await withFreshCache(() => fetcherRef.current())
          : await fetcherRef.current();
        if (queryStore.snapshot(key).version !== generation) return;
        queryStore.succeed(key, result);
      } catch (error) {
        if (queryStore.snapshot(key).version !== generation) return;
        // A failed refresh keeps the data already on screen; only a first load
        // has nothing to fall back to and surfaces the error.
        queryStore.fail(
          key,
          error instanceof Error ? error.message : "Request failed",
        );
      } finally {
        queryStore.end(key);
      }
    },
    [key],
  );

  React.useEffect(() => {
    if (!active || !key) return;
    if (queryStore.isPending(key)) return;
    // Fresh enough to reuse as-is, otherwise revalidate in the background.
    void run({ revalidate: queryStore.age(key) >= staleTime });
    // `status` is deliberately not a dependency: it changes as a result of this
    // effect, and including it would restart the request on every state change.
  }, [active, key, state.version, staleTime, run]);

  const setData = React.useCallback(
    (next: T) => {
      if (key) queryStore.set(key, next);
    },
    [key],
  );

  const invalidate = React.useCallback(() => {
    if (key) queryStore.invalidate(key);
  }, [key]);

  const isFetching = status === "loading";

  return {
    data: value,
    error: state.error,
    status,
    isLoading: isFetching && value === undefined,
    isFetching,
    isValidating: isFetching && value !== undefined,
    refetch: () => run({ revalidate: true }),
    setData,
    invalidate,
  } satisfies QueryResult<T>;
}
