import { useSyncExternalStore } from "react";
import { useColorScheme as useRNColorScheme } from "react-native";

// Static web rendering has to assume a theme on the server and reconcile on the
// client. `useSyncExternalStore` expresses exactly that: the server snapshot is
// always light, the client snapshot is the real media query.
const emptySubscribe = () => () => {};

export function useColorScheme() {
  const hydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  const colorScheme = useRNColorScheme();

  return hydrated ? colorScheme : "light";
}
