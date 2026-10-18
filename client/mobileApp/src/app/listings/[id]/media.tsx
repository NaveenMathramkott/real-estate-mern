import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as React from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";

import { MEDIA_TYPES } from "@/lib/constants";
import { propertyApi } from "@/lib/api";
import { LISTER_ROLES } from "@/lib/roles";
import type { MediaType, PropertyMedia } from "@/lib/types";
import { useMutation } from "@/hooks/use-mutation";
import { useQuery } from "@/hooks/use-query";
import { useTheme } from "@/theme";
import { Badge, Button, Txt } from "@/components/ui/primitives";
import { Field, Input, Select } from "@/components/ui/form";
import {
  EmptyState,
  ErrorState,
  LoadingBlock,
  SectionCard,
} from "@/components/ui/feedback";
import { Screen, ScreenHeader } from "@/components/ui/screen";
import { RequireAuth } from "@/components/guards";

/**
 * Media is attached by hosted URL — the API has no multipart upload middleware
 * yet, so this screen manages URLs and their display order.
 */
export default function ListingMediaScreen() {
  const router = useRouter();
  const { id = "" } = useLocalSearchParams<{ id: string }>();

  const detail = useQuery(id ? `get|/properties/${id}` : null, () =>
    propertyApi.detail(id),
  );

  const media = detail.data?.media ?? [];

  const [url, setUrl] = React.useState("");
  const [type, setType] = React.useState<MediaType>("image");
  const [blurhash, setBlurhash] = React.useState("");

  const add = useMutation({
    mutationFn: () =>
      propertyApi.addMedia(id, {
        url: url.trim(),
        type,
        blurhash: blurhash.trim() || undefined,
        order: media.length,
      }),
    successMessage: "Media added",
    onSuccess: () => {
      setUrl("");
      setBlurhash("");
    },
  });

  const remove = useMutation({
    mutationFn: (mediaId: string) => propertyApi.removeMedia(id, mediaId),
    successMessage: "Media removed",
  });

  // One reorder round trip moves an item, which is cheaper and less error-prone
  // than patching every sibling individually.
  const reorder = useMutation({
    mutationFn: (order: string[]) => propertyApi.reorderMedia(id, order),
    successMessage: "Order updated",
  });

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= media.length) return;
    const order = media.map((item) => item._id);
    const [moved] = order.splice(index, 1);
    order.splice(target, 0, moved);
    void reorder.mutateAsync(order).catch(() => undefined);
  };

  return (
    <RequireAuth roles={LISTER_ROLES}>
      <Screen>
        <ScreenHeader
          title="Media"
          subtitle={detail.data?.property.title}
          onBack={() => router.back()}
        />

        {detail.isLoading ? (
          <LoadingBlock />
        ) : detail.error ? (
          <ErrorState
            message={detail.error}
            onRetry={() => void detail.refetch()}
          />
        ) : (
          <>
            <SectionCard title="Add media">
              <Field label="Hosted URL" required>
                <Input
                  value={url}
                  onChangeText={setUrl}
                  autoCapitalize="none"
                  placeholder="https://res.cloudinary.com/…/photo.jpg"
                />
              </Field>
              <Select
                label="Type"
                value={type}
                onSelect={(value) => setType(value as MediaType)}
                options={MEDIA_TYPES.map((value) => ({ value, label: value }))}
              />
              <Field
                label="Blurhash"
                hint="Optional placeholder hash for fast scrolling."
              >
                <Input
                  value={blurhash}
                  onChangeText={setBlurhash}
                  placeholder="LKO2?U%2Tw=w]~RBVZRi};RPxuwH"
                />
              </Field>
              <Button
                title="Add media"
                onPress={() => void add.mutateAsync().catch(() => undefined)}
                loading={add.isPending}
                disabled={!url.trim()}
                fullWidth
              />
              <Txt variant="tiny" tone="muted">
                Uploads are not supported by the API yet — it accepts a hosted
                URL only.
              </Txt>
            </SectionCard>

            <SectionCard title={`${media.length} assets`}>
              {media.length === 0 ? (
                <EmptyState
                  icon="images-outline"
                  title="No media yet"
                  description="Add an image, video, floorplan or 360° tour above."
                />
              ) : (
                media.map((item, index) => (
                  <MediaRow
                    key={item._id}
                    media={item}
                    index={index}
                    total={media.length}
                    busy={reorder.isPending}
                    onMoveUp={() => move(index, -1)}
                    onMoveDown={() => move(index, 1)}
                    onRemove={() =>
                      Alert.alert("Remove media?", "This cannot be undone.", [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Remove",
                          style: "destructive",
                          onPress: () => void remove.mutateAsync(item._id),
                        },
                      ])
                    }
                  />
                ))
              )}
            </SectionCard>
          </>
        )}
      </Screen>
    </RequireAuth>
  );
}

function MediaRow({
  media,
  index,
  total,
  busy,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  media: PropertyMedia;
  index: number;
  total: number;
  busy: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          opacity: busy ? 0.6 : 1,
        },
      ]}
    >
      <View style={styles.thumb}>
        <Image
          source={{ uri: media.url }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={150}
        />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Txt variant="bodyStrong" numberOfLines={1}>
          {media.url.split("/").pop()}
        </Txt>
        <Badge tone="muted">
          #{index} · {media.type}
        </Badge>
      </View>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Move earlier"
          disabled={index === 0}
          onPress={onMoveUp}
          hitSlop={6}
        >
          <Ionicons
            name="arrow-up"
            size={17}
            color={index === 0 ? theme.border : theme.foregroundMuted}
          />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Move later"
          disabled={index === total - 1}
          onPress={onMoveDown}
          hitSlop={6}
        >
          <Ionicons
            name="arrow-down"
            size={17}
            color={index === total - 1 ? theme.border : theme.foregroundMuted}
          />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Remove media"
          onPress={onRemove}
          hitSlop={6}
        >
          <Ionicons name="trash-outline" size={17} color={theme.destructive} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 8,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#E2E9E5",
  },
  actions: { flexDirection: "row", alignItems: "center", gap: 12 },
});
