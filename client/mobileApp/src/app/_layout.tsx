import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as React from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  SafeAreaListener,
  SafeAreaProvider,
} from "react-native-safe-area-context";
import { Uniwind } from "uniwind";

// UniWind compiles the theme in src/global.css; importing it here registers the
// stylesheet for the whole app.
import "@/global.css";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuthStore } from "@/store/auth-store";
import { useFavoritesStore } from "@/store/favorites-store";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { LoadingBlock } from "@/components/ui/feedback";
import { Toaster } from "@/components/ui/toaster";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { darkTheme, lightTheme } from "@/theme";

SplashScreen.preventAutoHideAsync().catch(() => undefined);

/** Screens that only exist once there is a session. */
const APP_SCREENS = [
  { name: "(tabs)" },
  { name: "property/[id]" },
  { name: "listings" },
  { name: "listings/new" },
  { name: "listings/[id]/edit" },
  { name: "listings/[id]/media" },
  { name: "inquiries" },
  { name: "saved-searches" },
  { name: "notifications" },
  { name: "reviews" },
  { name: "dashboard" },
  { name: "areas/index" },
  { name: "areas/[id]" },
  { name: "buildings/index" },
  { name: "buildings/[id]" },
  { name: "agencies/index" },
  { name: "agencies/[id]" },
  { name: "profiles/[userId]" },
] as const;

export default function RootLayout() {
  const scheme = useColorScheme();
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const bootstrap = useAuthStore((state) => state.bootstrap);
  const loadFavorites = useFavoritesStore((state) => state.load);
  const clearFavorites = useFavoritesStore((state) => state.clear);

  React.useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  // Keep the shortlist in sync with the session: loaded on sign-in, dropped on
  // sign-out so a shared device never leaks the previous account's picks.
  React.useEffect(() => {
    if (user) void loadFavorites();
    else clearFavorites();
  }, [user?._id, user, loadFavorites, clearFavorites]);

  // Realtime chat and notifications. Reconnecting on user change also re-sends
  // the access token the handshake needs after a refresh rotation.
  React.useEffect(() => {
    if (!user) {
      disconnectSocket();
      return;
    }
    void connectSocket();
  }, [user?._id, user]);

  React.useEffect(() => {
    if (status === "idle" || status === "loading") return;
    SplashScreen.hideAsync().catch(() => undefined);
  }, [status]);

  const tokens = scheme === "dark" ? darkTheme : lightTheme;
  const navigationTheme = scheme === "dark" ? DarkTheme : DefaultTheme;

  const navigator =
    status === "idle" || status === "loading" ? (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <LoadingBlock label="Checking your session…" />
      </View>
    ) : user ? (
      /* The whole application lives behind authentication: every route below is
         unreachable until there is a session. */
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: tokens.background },
        }}
      >
        {APP_SCREENS.map((screen) => (
          <Stack.Screen key={screen.name} name={screen.name} />
        ))}
        <Stack.Screen name="+not-found" />
      </Stack>
    ) : (
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: tokens.background },
        }}
      >
        {/* `(auth)` owns its own index, which redirects to /login. */}
        <Stack.Screen name="(auth)" />
      </Stack>
    );

  return (
    // `Uniwind.updateInsets` feeds the CSS safe-area variables that
    // `useSafeArea()` inside gluestack components relies on.
    <SafeAreaListener onChange={({ insets }) => Uniwind.updateInsets(insets)}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <GluestackUIProvider mode="system">
          <SafeAreaProvider>
            <ThemeProvider
              value={{
                ...navigationTheme,
                colors: {
                  ...navigationTheme.colors,
                  primary: tokens.primary,
                  background: tokens.background,
                  card: tokens.surface,
                  text: tokens.foreground,
                  border: tokens.border,
                },
              }}
            >
              {navigator}
              <Toaster />
            </ThemeProvider>
          </SafeAreaProvider>
        </GluestackUIProvider>
      </GestureHandlerRootView>
    </SafeAreaListener>
  );
}
