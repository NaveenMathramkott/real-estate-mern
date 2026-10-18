import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { propertyApi } from "@/lib/api";
import { bedsLabel, formatListingPrice, formatRelative } from "@/lib/format";
import { propertyTypeLabel } from "@/lib/constants";
import { LISTER_ROLES } from "@/lib/roles";
import type { Property } from "@/lib/types";
import { useMutation } from "@/hooks/use-mutation";
import { useQuery } from "@/hooks/use-query";
import { toast } from "@/store/toast-store";
import { useTheme } from "@/theme";
import { Badge, Button, Txt } from "@/components/ui/primitives";
import { Field, Input, Select } from "@/components/ui/form";
import { PropertyCover } from "@/components/property/property-card";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/ui/feedback";
import { Screen, ScreenHeader } from "@/components/ui/screen";
import { RequireAuth } from "@/components/guards";

const STATUSES = ["active", "draft", "rented", "sold", "expired"];

/** The caller's own stock, with inline status changes and a soft delete. */
export default function ListingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [status, setStatus] = React.useState<string | undefined>();
  const [query, setQuery] = React.useState("");

  // `GET /properties` has no status param, so the status filter is applied to
  // the returned page rather than sent to the server.
  const { data, isLoading, error, refetch } = useQuery(
    `get|/properties|my-listings|${query}`,
    () => propertyApi.search({ q: query || undefined, limit: 100 }),
    { staleTime: 10_000 },
  );

  const remove = useMutation({
    mutationFn: (property: Property) => propertyApi.remove(property._id),
    successMessage: "Listing expired",
  });

  const changeStatus = useMutation({
    mutationFn: ({ property, next }: { property: Property; next: string }) =>
      propertyApi.update(property._id, { status: next } as Partial<Property>),
    successMessage: "Status updated",
  });

  const listings = (data?.properties ?? []).filter(
    (property) => !status || property.status === status,
  );

  return (
    <RequireAuth roles={LISTER_ROLES}>
      <Screen>
        <ScreenHeader
          title="My listings"
          subtitle={`${listings.length} shown`}
          onBack={() => router.back()}
          right={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Create listing"
              onPress={() => router.push("/listings/new")}
              style={[styles.addButton, { backgroundColor: theme.primary }]}
            >
              <Ionicons name="add" size={18} color={theme.onPrimary} />
            </Pressable>
          }
        />

        <Field label="Filter by status">
          <Select
            value={status}
            placeholder="All statuses"
            onSelect={(value) =>
              setStatus(value === status ? undefined : value)
            }
            options={STATUSES.map((value) => ({ value, label: value }))}
          />
        </Field>

        <Input
          value={query}
          onChangeText={setQuery}
          placeholder="Search your listings"
        />

        {isLoading ? (
          <LoadingBlock label="Loading listings…" />
        ) : error ? (
          <ErrorState message={error} onRetry={() => void refetch()} />
        ) : listings.length === 0 ? (
          <EmptyState
            icon="home-outline"
            title="No listings here yet"
            description="Create a listing and it will show up with its enquiries and media."
            action={
              <Button
                title="New listing"
                onPress={() => router.push("/listings/new")}
              />
            }
          />
        ) : (
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listBody}
            showsVerticalScrollIndicator={false}
          >
            {listings.map((property) => (
              <ListingRow
                key={property._id}
                property={property}
                onOpen={() => router.push(`/listings/${property._id}/edit`)}
                onMedia={() => router.push(`/listings/${property._id}/media`)}
                onStatus={(next) => changeStatus.mutate({ property, next })}
                onDelete={() => {
                  void remove.mutateAsync(property).catch(() => {
                    toast.error("Could not expire this listing");
                  });
                }}
              />
            ))}
          </ScrollView>
        )}
      </Screen>
    </RequireAuth>
  );
}

export function ListingRow({
  property,
  onOpen,
  onMedia,
  onStatus,
  onDelete,
}: {
  property: Property;
  onOpen: () => void;
  onMedia: () => void;
  onStatus: (status: string) => void;
  onDelete: () => void;
}) {
  const theme = useTheme();
  const [confirming, setConfirming] = React.useState(false);
  const beds = bedsLabel(property.beds);

  return (
    <View
      style={[
        styles.row,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <Pressable accessibilityRole="button" onPress={onOpen}>
        <PropertyCover property={property} height={64} rounded={8} />
      </Pressable>

      <View style={{ flex: 1, gap: 4 }}>
        <Txt variant="bodyStrong" numberOfLines={1}>
          {property.title}
        </Txt>
        <Txt variant="small" tone="primary">
          {formatListingPrice(
            property.price,
            property.currency,
            property.purpose,
          )}
        </Txt>
        <Txt variant="tiny" tone="muted" numberOfLines={1}>
          {[propertyTypeLabel(property.type), beds, property.address]
            .filter(Boolean)
            .join(" · ")}
        </Txt>
        <View style={styles.metaRow}>
          <Badge tone={property.status === "active" ? "success" : "muted"}>
            {property.status}
          </Badge>
          {property.verifiedAt ? <Badge tone="info">Verified</Badge> : null}
          <Txt variant="tiny" tone="muted">
            {formatRelative(property.createdAt)}
          </Txt>
        </View>
      </View>

      <View style={styles.rowActions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Edit listing"
          onPress={onOpen}
          hitSlop={8}
        >
          <Ionicons name="create-outline" size={18} color={theme.primary} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Manage media"
          onPress={onMedia}
          hitSlop={8}
        >
          <Ionicons
            name="images-outline"
            size={18}
            color={theme.foregroundMuted}
          />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Expire listing"
          onPress={() => setConfirming(true)}
          hitSlop={8}
        >
          <Ionicons name="trash-outline" size={18} color={theme.destructive} />
        </Pressable>
      </View>

      <View style={styles.statusRow}>
        <Select
          value={property.status}
          onSelect={onStatus}
          options={STATUSES.map((value) => ({ value, label: value }))}
        />
      </View>

      {confirming ? (
        <View
          style={[styles.confirm, { backgroundColor: theme.surfaceRaised }]}
        >
          <Txt variant="small">Expire “{property.title}”?</Txt>
          <Txt variant="tiny" tone="muted">
            The record is kept with status “expired”.
          </Txt>
          <View style={styles.rowBetween}>
            <Button
              title="Cancel"
              size="sm"
              variant="ghost"
              onPress={() => setConfirming(false)}
            />
            <Button
              title="Expire"
              size="sm"
              variant="danger"
              onPress={() => {
                onDelete();
                setConfirming(false);
              }}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  list: { flex: 1, marginHorizontal: -16 },
  listBody: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  rowActions: { alignItems: "center", justifyContent: "flex-start", gap: 14 },
  statusRow: { width: "100%" },
  confirm: { width: "100%", gap: 6, padding: 12, borderRadius: 10 },
  rowBetween: { flexDirection: "row", gap: 8, justifyContent: "flex-end" },
});
