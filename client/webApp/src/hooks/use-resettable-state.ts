import * as React from "react";

/**
 * State that resets itself when the source data changes.
 *
 * Forms on this site are seeded from a fetched record (a listing, a profile)
 * and then owned by the visitor. Seeding inside an effect causes a second
 * render pass and can clobber in-flight edits, so instead the previous value
 * is kept alongside a `key` and the state is adjusted during render — the
 * pattern React documents for "resetting all state when a prop changes".
 *
 * @param initial value used until `key` changes
 * @param key identity of the source data; any change discards `initial`
 */
export function useResettableState<T>(
  initial: T | (() => T),
  key: unknown,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const resolve = React.useCallback(
    () => (typeof initial === "function" ? (initial as () => T)() : initial),
    // `initial` is intentionally re-read whenever `key` changes; latching it
    // would defeat the reset the key is there to trigger.
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

/**
 * Debounced mirror of a value, used to keep the search suggestions from firing
 * a request per keystroke.
 *
 * The pending timer id lives in state rather than a ref because it is written
 * during render — that is what makes the debounce restart on a fast typist,
 * and an effect would always be one commit behind.
 */
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
