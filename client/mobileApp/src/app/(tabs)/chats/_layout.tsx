import { Stack } from "expo-router";

/**
 * The chats tab carries its own stack so a thread opens as a full-screen push
 * over the inbox rather than resolving against the tab bar itself.
 *
 * Both screens draw their own header chrome, so the navigator header stays off.
 */
export default function ChatsLayout() {
  return (
    <Stack
      screenOptions={{ headerShown: false, animation: "slide_from_right" }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
