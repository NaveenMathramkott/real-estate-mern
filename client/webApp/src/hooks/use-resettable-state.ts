import * as React from "react";

// State that resets when its source data changes. Forms here are seeded from a fetched
// record, then owned by the visitor, so the reset happens during render not in an effect.
export function useResettableState<T>(
  initial: T | (() => T),
  key: unknown,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const resolve = React.useCallback(
    () => (typeof initial === "function" ? (initial as () => T)() : initial),
    // `initial` is re-read on every key change; latching it would defeat the reset.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );

  const [entry, setEntry] = React.useState<{ key: unknown; value: T }>(() => ({
    key,
    value: resolve(),
  }));

  if (!Object.is(entry.key, key)) {
    setEntry({ key, value: resolve() });
  }

  const setValue = React.useCallback<React.Dispatch<React.SetStateAction<T>>>(
    (next) =>
      setEntry((current) => ({
        key: current.key,
        value:
          typeof next === "function"
            ? (next as (previous: T) => T)(current.value)
            : next,
      })),
    [],
  );

  return [entry.value, setValue];
}

// Debounced mirror of a value. The timer id lives in state because it is written during
// render, which is what lets a fast typist restart the debounce instead of lagging.
export function useDebouncedValue<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = React.useState(value);
  const [last, setLast] = React.useState(value);
  const [timer, setTimer] = React.useState<
    ReturnType<typeof setTimeout> | undefined
  >(undefined);

  if (!Object.is(last, value)) {
    setLast(value);
    if (timer !== undefined) clearTimeout(timer);
    setTimer(setTimeout(() => setDebounced(value), ms));
  }

  React.useEffect(
    () => () => {
      // Only the most recent timer needs clearing; earlier ones already fired.
      setTimer((current) => {
        if (current !== undefined) clearTimeout(current);
        return undefined;
      });
    },
    [],
  );

  return debounced;
}
