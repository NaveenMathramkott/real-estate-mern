import { Stack } from "expo-router";

/**
 * Sign-in routes. The root layout only mounts this navigator when there is no
 * session, so the guards here only cover the anchor redirect.
 */
export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
