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
  /**
   * How long data may be reused without a network call. Defaults to `0`, so
   * every mount revalidates — navigating back to a page should never show a
   * result set frozen from a minute ago. Raise it for hot keys like
   * autocomplete, where the extra chatter is not worth it.
   */
  staleTime?: number;
};

/**
 * Read-through query hook layered on the shared response cache.
 *
 * State lives in an external store so several components asking for the same
 * key share one request and one cache entry. The important behaviour is
 * revalidation: a query re-runs every time it becomes active. Cached data stays
 * on screen while the refresh is in flight, so revisiting a page is instant
 * *and* current — the earlier version only fetched while a key was `idle`,
 * which meant a key that had once succeeded never refreshed again.
 */
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
