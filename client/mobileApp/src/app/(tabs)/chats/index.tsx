import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { conversationApi } from "@/lib/api";
import { formatMessageTime } from "@/lib/format";
import type { Conversation, User } from "@/lib/types";
import { useQuery } from "@/hooks/use-query";
import { useAuthStore } from "@/store/auth-store";
import { useTheme } from "@/theme";
import { Avatar, Txt } from "@/components/ui/primitives";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/ui/feedback";
import { Screen, ScreenHeader } from "@/components/ui/screen";

/** `GET /conversations` populates participants from the profile collection, so
 *  the payload carries `name`/`avatar` rather than a raw `User` document. */
type Participant = Partial<User> & { name?: string; avatar?: string };

function otherParticipant(
  conversation: Conversation,
  userId: string | undefined,
): Participant {
  const other = (conversation.participants ?? []).find(
    (participant) => participant?._id !== userId,
  );
  return (other as Participant) ?? {};
}

export default function ChatsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const user = useAuthStore((state) => state.user)!;
  const { data, isLoading, error, refetch } = useQuery(
    "get|/conversations|inbox",
    () => conversationApi.list(),
    { staleTime: 15_000 },
  );

  const conversations = data?.conversations ?? [];

  return (
    <Screen>
      <ScreenHeader
        title="Chats"
        subtitle={`${conversations.length} conversation${conversations.length === 1 ? "" : "s"}`}
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open notifications"
            onPress={() => router.push("/notifications")}
            style={[styles.bell, { borderColor: theme.borderStrong }]}
          >
            <Ionicons
              name="notifications-outline"
              size={16}
              color={theme.foreground}
            />
          </Pressable>
        }
      />

      {isLoading ? (
        <LoadingBlock label="Loading conversations…" />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void refetch()} />
      ) : conversations.length === 0 ? (
        <EmptyState
          icon="chatbubbles-outline"
          title="No conversations yet"
          description="Open any listing and tap “Message” to start a thread with the agent or owner."
          action={
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/")}
            >
              <Txt variant="small" style={{ color: theme.primary }}>
                Browse listings
              </Txt>
            </Pressable>
          }
        />
      ) : (
        <View style={styles.list}>
          {conversations.map((conversation) => {
            const other = otherParticipant(conversation, user._id);
            const label = other.name ?? other.email ?? "Conversation";
            const preview = conversation.lastMessage?.body ?? "Say hello";

            return (
              <Pressable
                key={conversation._id}
                accessibilityRole="button"
                onPress={() => router.push(`/chats/${conversation._id}`)}
                style={({ pressed }) => [
                  styles.row,
                  {
                    backgroundColor: pressed ? theme.accent : theme.surface,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Avatar name={label} uri={other.avatar} />
                <View style={{ flex: 1, gap: 3 }}>
                  <Txt variant="bodyStrong" numberOfLines={1}>
                    {label}
                  </Txt>
                  <Txt variant="small" tone="muted" numberOfLines={1}>
                    {preview}
                  </Txt>
                </View>
                <Txt variant="tiny" tone="muted">
                  {formatMessageTime(conversation.lastMessageAt)}
                </Txt>
              </Pressable>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  bell: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  list: { flex: 1, gap: 10 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
