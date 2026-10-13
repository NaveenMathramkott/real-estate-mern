import { useCallback, useState } from "react";

import { toast } from "@/store/toast-store";

type MutationOptions<TArgs extends unknown[], TData> = {
  mutationFn: (...args: TArgs) => Promise<TData>;
  onSuccess?: (data: TData, ...args: TArgs) => void | Promise<void>;
  onError?: (error: Error, ...args: TArgs) => void | Promise<void>;
  successMessage?: string | ((data: TData) => string);
  invalidate?: () => void;
};

/**
 * Wraps a write call with pending/error state, toast feedback and cache invalidation.
 */
export function useMutation<TArgs extends unknown[], TData>(
  options: MutationOptions<TArgs, TData>,
) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const mutateAsync = useCallback(
    async (...args: TArgs) => {
      setIsPending(true);
      setError(undefined);
      try {
        const data = await options.mutationFn(...args);
        options.onSuccess?.(data, ...args);
        options.invalidate?.();
        const message =
          typeof options.successMessage === "function"
            ? options.successMessage(data)
            : options.successMessage;
        if (message) toast.success(message);
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Request failed";
        setError(message);
        options.onError?.(err as Error, ...args);
        toast.error(message);
        throw err;
      } finally {
        setIsPending(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const mutate = useCallback(
    (...args: TArgs) => {
      void mutateAsync(...args).catch(() => undefined);
    },
    [mutateAsync],
  );

  return { mutate, mutateAsync, isPending, error };
}
