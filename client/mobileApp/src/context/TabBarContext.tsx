import { createContext } from "react";

/**
 * Lets a screen hide the native tab bar while it is focused, for pushes that
 * should feel full-screen (a chat thread, for instance).
 *
 * `NativeTabs` exposes `hidden` only as a navigator-level prop, and toggling a
 * `Trigger`'s own `hidden` remounts the navigator and resets its state — so the
 * bar is driven from here instead.
 */
export const TabBarContext = createContext<{
  setIsTabBarHidden: (hidden: boolean) => void;
}>({
  setIsTabBarHidden: () => {},
});
