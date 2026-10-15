import { useCallback, useEffect, useRef, useState } from "react";

import { queryStore } from "@/lib/query-store";
import { toast } from "@/store/toast-store";

type MutationOptions<TArgs extends unknown[], TData> = {
  mutationFn: (...args: TArgs) => Promise<TData>;
  onSuccess?: (data: TData, ...args: TArgs) => void | Promise<void>;
  onError?: (error: Error, ...args: TArgs) => void | Promise<void>;
  successMessage?: string | ((data: TData) => string);
  /** Overrides default invalidation, which drops cached GETs after any successful write. */
  invalidate?: () => void;
};

/** Drops every cached read so mounted queries refetch from the server. */
export function invalidateReads() {
  queryStore.invalidate("get|");
}

/** Wraps a write with pending/error state, toasts and cache invalidation. Callbacks are read
 *  from a ref so a mutation defined in a dialog never keeps a stale closure. */
export function useMutation<TArgs extends unknown[], TData>(
  options: MutationOptions<TArgs, TData>,
) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  const mutateAsync = useCallback(async (...args: TArgs) => {
    const current = optionsRef.current;

    setIsPending(true);
    setError(undefined);
    try {
      const data = await current.mutationFn(...args);
      await current.onSuccess?.(data, ...args);
      (current.invalidate ?? invalidateReads)();
      const message =
        typeof current.successMessage === "function"
          ? current.successMessage(data)
          : current.successMessage;
      if (message) toast.success(message);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed";
      setError(message);
      await optionsRef.current.onError?.(err as Error, ...args);
      toast.error(message);
      throw err;
    } finally {
      setIsPending(false);
    }
  }, []);

  const mutate = useCallback(
    (...args: TArgs) => {
      void mutateAsync(...args).catch(() => undefined);
    },
    [mutateAsync],
  );

  return { mutate, mutateAsync, isPending, error };
}
