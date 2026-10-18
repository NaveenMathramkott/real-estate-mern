import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
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

import { TabBarContext } from "@/context/TabBarContext";
import { conversationApi } from "@/lib/api";
import { formatCurrency, formatMessageTime, idOf } from "@/lib/format";
import { toast } from "@/store/toast-store";
import {
  joinConversation,
  leaveConversation,
  onSocket,
  sendTyping,
} from "@/lib/socket";
import { useMutation } from "@/hooks/use-mutation";
import { useQuery } from "@/hooks/use-query";
import { useAuthStore } from "@/store/auth-store";
import type { ConversationListing, Message } from "@/lib/types";
import { useTheme } from "@/theme";
import { Avatar, Txt } from "@/components/ui/primitives";
import { ErrorState, LoadingBlock } from "@/components/ui/feedback";
import { Screen } from "@/components/ui/screen";

type Bubble = Message & { mine: boolean };

/** Flat list row: either a date divider or a single message. */
type Row =
  | { kind: "divider"; key: string; label: string }
  | { kind: "message"; key: string; message: Bubble; grouped: boolean };

const startOfDay = (value: string) => {
  const date = new Date(value);
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();
};

/** Turns the flat message list into rows with date dividers, WhatsApp-style. */
function buildRows(messages: Bubble[]): Row[] {
  const rows: Row[] = [];
  let lastDay = 0;
  let lastSender: string | undefined;
  let lastAt = 0;

  for (const message of messages) {
    const day = startOfDay(message.createdAt);
    if (day !== lastDay) {
      rows.push({
        kind: "divider",
        key: `d-${message._id}`,
        label: formatMessageTime(message.createdAt),
      });
      lastDay = day;
      lastSender = undefined;
    }

    // Consecutive messages from one side within five minutes read as a group.
    const sender = idOf(message.senderId);
    const grouped =
      sender === lastSender &&
      new Date(message.createdAt).getTime() - lastAt < 5 * 60_000;

    rows.push({ kind: "message", key: message._id, message, grouped });
    lastSender = sender;
    lastAt = new Date(message.createdAt).getTime();
  }

  return rows;
}

export default function ConversationScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id = "" } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);

  const detail = useQuery(id ? `get|/conversations/${id}` : null, () =>
    conversationApi.detail(id),
  );
  const history = useQuery(
    id ? `get|/conversations/${id}/messages` : null,
    () => conversationApi.messages(id),
  );

  // A thread is full-screen — the tab bar would only compete with the composer.
  // Focus-driven rather than mount-driven, so the bar returns if this screen is
  // covered by another push instead of waiting for it to unmount.
  const { setIsTabBarHidden } = React.use(TabBarContext);
  useFocusEffect(
    React.useCallback(() => {
      setIsTabBarHidden(true);
      return () => setIsTabBarHidden(false);
    }, [setIsTabBarHidden]),
  );

  const [draft, setDraft] = React.useState("");
  const [typing, setTyping] = React.useState(false);

  const send = useMutation({
    mutationFn: (body: string) => conversationApi.send(id, { body }),
    onSuccess: () => setDraft(""),
  });

  // Socket events keep the thread live; the REST query is the fallback when the
  // handshake failed, so refetching on either keeps a single source of truth.
  React.useEffect(() => {
    if (!id) return;
    joinConversation(id);
    const offMessage = onSocket("message:new", (payload) => {
      const message = payload as Message | undefined;
      if (message && message.conversationId === id) {
        setTyping(false);
        void history.refetch();
        void conversationApi.markRead(id);
      }
    });
    const offTyping = onSocket("typing", (payload) => {
      const event = payload as { userId?: string; conversationId?: string };
      if (event?.conversationId !== id) return;
      if (event.userId === user?._id) return;
      setTyping(true);
    });
    return () => {
      offMessage();
      offTyping();
      leaveConversation(id);
    };
  }, [id, history, user?._id]);

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
    mine: idOf(message.senderId) === user?._id,
  }));
  const rows = React.useMemo(() => buildRows(messages), [messages]);

  // Participants come back populated from the profile collection, so they carry
  // `name`/`avatar` on top of the base user fields.
  const other = (detail.data?.conversation?.participants ?? []).find(
    (participant) => participant?._id !== user?._id,
  ) as
    | { _id?: string; name?: string; email?: string; avatar?: string }
    | undefined;

  // The endpoint populates `propertyId`, so the thread can name the property
  // instead of only saying "About a listing".
  const linked = detail.data?.conversation?.propertyId;
  const listing: ConversationListing | undefined =
    linked && typeof linked !== "string" ? linked : undefined;

  const contactName = other?.name ?? other?.email ?? "Conversation";

  React.useEffect(() => {
    if (!id || messages.length === 0) return;
    void conversationApi.markRead(id);
    // Read receipts only need to fire when the thread opens or grows.
  }, [id, messages.length]);

  // Throttled typing signal — one emit per two seconds while the draft changes.
  const lastTypingAt = React.useRef(0);
  const onChangeDraft = (value: string) => {
    setDraft(value);
    const now = Date.now();
    if (now - lastTypingAt.current > 2000) {
      lastTypingAt.current = now;
      sendTyping(id);
    }
  };

  return (
    <Screen header={false} padded={false} edges={false}>
      <View style={[styles.flex, { backgroundColor: theme.background }]}>
        {/* Header: back, avatar, contact, typing state. */}
        <View
          style={[
            styles.header,
            {
              paddingTop: insets.top + 8,
              backgroundColor: theme.surface,
              borderBottomColor: theme.border,
            },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to conversations"
            onPress={() => router.back()}
            hitSlop={10}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color="#0B2A23" />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => other?._id && router.push(`/profiles/${other._id}`)}
            style={styles.headerIdentity}
          >
            <Avatar name={contactName} uri={other?.avatar} size={36} />
            <View style={styles.headerText}>
              <Txt variant="bodyStrong" numberOfLines={1}>
                {contactName}
              </Txt>
              <Txt
                variant="tiny"
                tone={typing ? "primary" : "muted"}
                numberOfLines={1}
              >
                {typing ? "typing…" : (other?.email ?? "")}
              </Txt>
            </View>
          </Pressable>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={0}
          style={styles.flex}
        >
          {history.isLoading ? (
            <LoadingBlock label="Loading messages…" />
          ) : history.error ? (
            <ErrorState
              message={history.error}
              onRetry={() => void history.refetch()}
            />
          ) : (
            <FlatList
              data={rows}
              keyExtractor={(item) => item.key}
              contentContainerStyle={styles.thread}
              showsVerticalScrollIndicator={false}
              onStartReached={messages.length >= 20 ? loadEarlier : undefined}
              onStartReachedThreshold={0.4}
              ListHeaderComponent={
                listing ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => router.push(`/property/${listing._id}`)}
                    style={[
                      styles.context,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name="home-outline"
                      size={15}
                      color={theme.primary}
                    />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Txt variant="small" numberOfLines={1}>
                        {listing.title}
                      </Txt>
                      {listing.address ? (
                        <Txt variant="tiny" tone="muted" numberOfLines={1}>
                          {listing.address}
                        </Txt>
                      ) : null}
                    </View>
                    {listing.price ? (
                      <Txt variant="small" style={{ color: theme.primary }}>
                        {formatCurrency(
                          listing.price,
                          listing.currency ?? "INR",
                          true,
                        )}
                      </Txt>
                    ) : null}
                  </Pressable>
                ) : messages.length >= 20 ? (
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
              renderItem={({ item }) => {
                if (item.kind === "divider") {
                  return (
                    <View style={styles.dividerRow}>
                      <View
                        style={[
                          styles.divider,
                          { backgroundColor: theme.surface },
                        ]}
                      >
                        <Txt variant="tiny" tone="muted">
                          {item.label}
                        </Txt>
                      </View>
                    </View>
                  );
                }

                const { message, grouped } = item;
                return (
                  <View
                    style={[
                      styles.bubbleRow,
                      message.mine
                        ? styles.bubbleRowMine
                        : styles.bubbleRowTheirs,
                      grouped ? styles.bubbleGrouped : styles.bubbleNew,
                    ]}
                  >
                    <View
                      style={[
                        styles.bubble,
                        {
                          backgroundColor: message.mine
                            ? theme.primary
                            : theme.surface,
                          borderColor: message.mine
                            ? theme.primary
                            : theme.border,
                          borderBottomRightRadius: message.mine
                            ? grouped
                              ? 5
                              : 16
                            : 16,
                          borderTopLeftRadius: message.mine
                            ? 16
                            : grouped
                              ? 5
                              : 16,
                        },
                      ]}
                    >
                      <Txt
                        variant="body"
                        style={{
                          color: message.mine
                            ? theme.onPrimary
                            : theme.foreground,
                        }}
                      >
                        {message.body}
                      </Txt>
                      <View style={styles.bubbleMeta}>
                        <Txt
                          variant="tiny"
                          style={{
                            color: message.mine
                              ? "#D6F0E5"
                              : theme.foregroundMuted,
                          }}
                        >
                          {formatMessageTime(message.createdAt)}
                        </Txt>
                        {/* Read receipt: one tick sent, two once the other
                            party has opened the thread. */}
                        {message.mine ? (
                          <Ionicons
                            name={
                              message.readAt ? "checkmark-done" : "checkmark"
                            }
                            size={12}
                            color={message.readAt ? "#8FE3C4" : "#D6F0E5"}
                          />
                        ) : null}
                      </View>
                    </View>
                  </View>
                );
              }}
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
              onChangeText={onChangeDraft}
              placeholder="Message"
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
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: { padding: 4 },
  headerIdentity: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerText: { flex: 1, gap: 1 },
  thread: { padding: 12, gap: 2, paddingBottom: 12 },
  dividerRow: { alignItems: "center", paddingVertical: 10 },
  divider: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 11,
    overflow: "hidden",
  },
  bubbleRow: { flexDirection: "row", maxWidth: "84%" },
  bubbleRowMine: { alignSelf: "flex-end", justifyContent: "flex-end" },
  bubbleRowTheirs: { alignSelf: "flex-start" },
  bubbleNew: { marginTop: 8 },
  bubbleGrouped: { marginTop: 2 },
  bubble: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingTop: 7,
    paddingBottom: 6,
  },
  bubbleMeta: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    gap: 3,
    marginTop: 2,
  },
  context: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  composerInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 110,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingTop: 9,
    paddingBottom: 9,
    fontSize: 15,
  },
  send: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
