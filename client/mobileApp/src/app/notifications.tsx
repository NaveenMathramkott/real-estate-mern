import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { notificationApi } from "@/lib/api";
import { formatRelative } from "@/lib/format";
import type { AppNotification } from "@/lib/types";
import { useMutation } from "@/hooks/use-mutation";
import { useQuery } from "@/hooks/use-query";
import { onSocket } from "@/lib/socket";
import { useTheme } from "@/theme";
import { Badge, Button, Txt } from "@/components/ui/primitives";
import { Toggle } from "@/components/ui/form";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/ui/feedback";
import { Screen, ScreenHeader } from "@/components/ui/screen";
import { RequireAuth } from "@/components/guards";

const TYPE_META: Record<
  string,
  { icon: React.ComponentProps<typeof Ionicons>["name"]; label: string }
> = {
  message: { icon: "chatbubble-outline", label: "Message" },
  inquiry: { icon: "mail-outline", label: "Enquiry" },
  review: { icon: "star-outline", label: "Review" },
  price: { icon: "trending-down-outline", label: "Price drop" },
};

function titleFor(item: AppNotification) {
  const meta = TYPE_META[item.type];
  if (item.payload?.conversationId) return "New message";
  if (item.payload?.propertyId) return "Listing update";
  return meta?.label ?? "Notification";
}

export default function NotificationsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [unreadOnly, setUnreadOnly] = React.useState(false);

  const { data, isLoading, error, refetch } = useQuery(
    `get|/notifications|${unreadOnly}|50`,
    () => notificationApi.list({ unreadOnly, limit: 50 }),
    { staleTime: 15_000 },
  );

  React.useEffect(() => {
    const off = onSocket("notification:new", () => void refetch());
    return off;
  }, [refetch]);

  const markRead = useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
  });
  const markAll = useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    successMessage: "All caught up",
  });

  const notifications = data?.notifications ?? [];

  const open = (item: AppNotification) => {
    const conversationId = item.payload?.conversationId;
    const propertyId = item.payload?.propertyId as string | undefined;
    if (!item.readAt)
      void markRead.mutateAsync(item._id).catch(() => undefined);
    if (conversationId) router.push(`/chats/${conversationId}`);
    else if (propertyId) router.push(`/property/${propertyId}`);
  };

  return (
    <RequireAuth>
      <Screen>
        <ScreenHeader
          title="Notifications"
          subtitle={`${notifications.length} shown`}
          onBack={() => router.back()}
          right={
            notifications.some((item) => !item.readAt) ? (
              <Button
                title="Mark all"
                size="sm"
                variant="ghost"
                onPress={() => void markAll.mutateAsync()}
              />
            ) : undefined
          }
        />

        <Toggle
          label="Unread only"
          value={unreadOnly}
          onChange={setUnreadOnly}
        />

        {isLoading ? (
          <LoadingBlock />
        ) : error ? (
          <ErrorState message={error} onRetry={() => void refetch()} />
        ) : notifications.length === 0 ? (
          <EmptyState
            icon="notifications-outline"
            title="Nothing new"
            description="Messages, enquiries and price drops will show up here."
          />
        ) : (
          <View style={styles.list}>
            {notifications.map((item) => {
              const meta = TYPE_META[item.type] ?? {
                icon: "ellipse-outline",
                label: item.type,
              };
              const unread = !item.readAt;
              return (
                <Pressable
                  key={item._id}
                  accessibilityRole="button"
                  onPress={() => open(item)}
                  style={[
                    styles.row,
                    {
                      backgroundColor: unread
                        ? theme.surface
                        : theme.surfaceSoft,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.icon,
                      {
                        backgroundColor: unread
                          ? theme.primarySoft
                          : theme.accent,
                      },
                    ]}
                  >
                    <Ionicons
                      name={meta.icon}
                      size={16}
                      color={unread ? theme.primary : theme.foregroundMuted}
                    />
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <View style={styles.titleRow}>
                      <Txt
                        variant="bodyStrong"
                        numberOfLines={1}
                        style={{ flex: 1 }}
                      >
                        {titleFor(item)}
                      </Txt>
                      {unread ? <Badge tone="primary">New</Badge> : null}
                    </View>
                    {item.payload?.preview ? (
                      <Txt variant="small" tone="muted" numberOfLines={2}>
                        {item.payload.preview}
                      </Txt>
                    ) : null}
                    <Txt variant="tiny" tone="muted">
                      {formatRelative(item.createdAt)}
                    </Txt>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </Screen>
    </RequireAuth>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, gap: 10 },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
});
