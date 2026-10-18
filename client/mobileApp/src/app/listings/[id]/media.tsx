import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { MEDIA_TYPES } from "@/lib/constants";
import { propertyApi } from "@/lib/api";
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
} from "@/components/ui/alert-dialog";
import { LISTER_ROLES } from "@/lib/roles";
import type { MediaType, PropertyMedia } from "@/lib/types";
import { useMutation } from "@/hooks/use-mutation";
import { useQuery } from "@/hooks/use-query";
import { useTheme } from "@/theme";
import { Badge, Button, Txt } from "@/components/ui/primitives";
import { Box } from "@/components/ui/box";
import { Image as GSImage } from "@/components/ui/image";
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
  const [pendingRemoval, setPendingRemoval] =
    React.useState<PropertyMedia | null>(null);

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
          subtitle={detail.data?.property?.title}
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
                    onRemove={() => setPendingRemoval(item)}
                  />
                ))
              )}
            </SectionCard>

            <AlertDialog
              isOpen={Boolean(pendingRemoval)}
              onClose={() => setPendingRemoval(null)}
            >
              <AlertDialogBackdrop className="bg-black/45" />
              <AlertDialogContent className="gap-4 rounded-2xl border border-border bg-background p-5">
                <AlertDialogHeader>
                  <Txt variant="heading">Remove this media?</Txt>
                </AlertDialogHeader>
                <AlertDialogBody>
                  <Txt variant="small" tone="muted">
                    {pendingRemoval?.url
                      ? pendingRemoval.url.split("/").pop()
                      : ""}
                  </Txt>
                </AlertDialogBody>
                <AlertDialogFooter className="gap-2.5">
                  <Button
                    title="Cancel"
                    variant="ghost"
                    onPress={() => setPendingRemoval(null)}
                  />
                  <Button
                    title="Remove"
                    variant="danger"
                    loading={remove.isPending}
                    onPress={() => {
                      if (pendingRemoval)
                        void remove.mutateAsync(pendingRemoval._id);
                      setPendingRemoval(null);
                    }}
                  />
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
      {media.url ? (
        <Box className="h-12 w-12 overflow-hidden rounded-lg bg-border">
          <GSImage
            source={{ uri: media.url }}
            resizeMode="cover"
            alt={media.url}
            style={StyleSheet.absoluteFill}
          />
        </Box>
      ) : (
        <Box className="h-12 w-12 items-center justify-center rounded-lg bg-border">
          <Ionicons name="image-outline" size={18} color="#647771" />
        </Box>
      )}
      <View style={{ flex: 1, gap: 4 }}>
        <Txt variant="bodyStrong" numberOfLines={1}>
          {media.url ? media.url.split("/").pop() : "Media"}
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
  actions: { flexDirection: "row", alignItems: "center", gap: 12 },
});
