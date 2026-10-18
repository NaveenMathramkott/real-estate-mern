import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as React from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { conversationApi } from "@/lib/api";
import { formatMessageTime, idOf } from "@/lib/format";
import { toast } from "@/store/toast-store";
import { joinConversation, leaveConversation, onSocket } from "@/lib/socket";
import { useMutation } from "@/hooks/use-mutation";
import { useQuery } from "@/hooks/use-query";
import { useAuthStore } from "@/store/auth-store";
import type { Message } from "@/lib/types";
import { useTheme } from "@/theme";
import { Avatar, Txt } from "@/components/ui/primitives";
import { ErrorState, LoadingBlock } from "@/components/ui/feedback";
import { Screen, ScreenHeader } from "@/components/ui/screen";

type Bubble = Message & { mine: boolean };

export default function ConversationScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id = "" } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((state) => state.user)!;

  const detail = useQuery(id ? `get|/conversations/${id}` : null, () =>
    conversationApi.detail(id),
  );
  const history = useQuery(
    id ? `get|/conversations/${id}/messages` : null,
    () => conversationApi.messages(id),
  );

  const [draft, setDraft] = React.useState("");

  const send = useMutation({
    mutationFn: (body: string) => conversationApi.send(id, { body }),
    onSuccess: () => setDraft(""),
  });

  // Socket events keep the thread live; the REST query is the fallback when the
  // handshake failed, so refetching on either keeps a single source of truth.
  React.useEffect(() => {
    if (!id) return;
    joinConversation(id);
    const off = onSocket("message:new", (payload) => {
      const message = payload as Message | undefined;
      if (message && message.conversationId === id) {
        void history.refetch();
        void conversationApi.markRead(id);
      }
    });
    return () => {
      off();
      leaveConversation(id);
    };
  }, [id, history]);

  // Backfill is handled by `before`; an explicit "load earlier" keeps parity with
  // the web client without the visitor having to scroll to a pinned top.
  const [backfilling, setBackfilling] = React.useState(false);
  const loadEarlier = async () => {
    const messages = history.data?.messages ?? [];
    if (messages.length === 0) return;
    setBackfilling(true);
    try {
      const older = await conversationApi.messages(id, messages[0].createdAt);
      toast.info(`${older.messages.length} earlier messages loaded`);
      void history.refetch();
    } catch {
      toast.error("Could not load earlier messages");
    } finally {
      setBackfilling(false);
    }
  };

  const messages: Bubble[] = (history.data?.messages ?? []).map((message) => ({
    ...message,
    mine: idOf(message.senderId) === user._id,
  }));

  // Participants come back populated from the profile collection, so they carry
  // `name`/`avatar` on top of the base user fields.
  const other = (detail.data?.conversation?.participants ?? []).find(
    (participant) => participant?._id !== user._id,
  ) as { name?: string; email?: string; avatar?: string } | undefined;

  React.useEffect(() => {
    if (!id || messages.length === 0) return;
    void conversationApi.markRead(id);
    // Read receipts only need to fire when the thread opens or grows.
  }, [id, messages.length]);

  return (
    <Screen header={false} padded={false} edges={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={insets.top + 52}
        style={[
          styles.flex,
          { paddingTop: insets.top + 6, backgroundColor: theme.background },
        ]}
      >
        <ScreenHeader
          title={other?.name ?? other?.email ?? "Conversation"}
          subtitle={
            detail.data?.conversation?.propertyId
              ? "About a listing"
              : undefined
          }
          onBack={() => router.back()}
          right={
            <Avatar
              name={other?.name ?? other?.email}
              uri={other?.avatar}
              size={32}
            />
          }
        />

        {history.isLoading ? (
          <LoadingBlock label="Loading messages…" />
        ) : history.error ? (
          <ErrorState
            message={history.error}
            onRetry={() => void history.refetch()}
          />
        ) : (
          <FlatList
            data={messages}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.thread}
            showsVerticalScrollIndicator={false}
            onStartReached={messages.length >= 20 ? loadEarlier : undefined}
            onStartReachedThreshold={0.4}
            ListHeaderComponent={
              messages.length >= 20 ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={loadEarlier}
                  disabled={backfilling}
                  style={{ paddingVertical: 10 }}
                >
                  <Txt variant="tiny" tone="muted" center>
                    {backfilling ? "Loading…" : "Load earlier messages"}
                  </Txt>
                </Pressable>
              ) : null
            }
            renderItem={({ item }) => (
              <View
                style={[
                  styles.bubble,
                  item.mine ? styles.bubbleMine : styles.bubbleTheirs,
                ]}
              >
                <View
                  style={[
                    styles.bubbleInner,
                    {
                      backgroundColor: item.mine
                        ? theme.primary
                        : theme.surface,
                      borderColor: item.mine ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Txt
                    variant="body"
                    style={{
                      color: item.mine ? theme.onPrimary : theme.foreground,
                    }}
                  >
                    {item.body}
                  </Txt>
                  <Txt
                    variant="tiny"
                    style={{
                      color: item.mine ? "#D6F0E5" : theme.foregroundMuted,
                      marginTop: 4,
                    }}
                  >
                    {formatMessageTime(item.createdAt)}
                    {item.mine && item.readAt ? " · Read" : ""}
                  </Txt>
                </View>
              </View>
            )}
          />
        )}

        <View
          style={[
            styles.composer,
            {
              borderTopColor: theme.border,
              backgroundColor: theme.surface,
              paddingBottom: insets.bottom + 8,
            },
          ]}
        >
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Write a message…"
            placeholderTextColor="#98A5A0"
            multiline
            style={[
              styles.composerInput,
              {
                color: theme.foreground,
                borderColor: theme.border,
                backgroundColor: theme.background,
              },
            ]}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send message"
            disabled={!draft.trim() || send.isPending}
            onPress={() =>
              void send.mutateAsync(draft.trim()).catch(() => undefined)
            }
            style={[
              styles.send,
              {
                backgroundColor: draft.trim()
                  ? theme.primary
                  : theme.borderStrong,
              },
            ]}
          >
            <Ionicons name="send" size={16} color={theme.surface} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  thread: { padding: 16, gap: 8, paddingBottom: 16 },
  bubble: { maxWidth: "82%", marginBottom: 4 },
  bubbleMine: { alignSelf: "flex-end" },
  bubbleTheirs: { alignSelf: "flex-start" },
  bubbleInner: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  composerInput: {
    flex: 1,
    minHeight: 42,
    maxHeight: 120,
    borderRadius: 21,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
  },
  send: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
});
