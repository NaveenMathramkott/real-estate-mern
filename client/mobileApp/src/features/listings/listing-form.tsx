import { useRouter } from "expo-router";
import * as React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import {
  AMENITIES,
  FURNISHED,
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
  PURPOSES,
  propertyTypeLabel,
} from "@/lib/constants";
import { propertyApi } from "@/lib/api";
import { toNumber } from "@/lib/format";
import type { Property } from "@/lib/types";
import { useMutation } from "@/hooks/use-mutation";
import { useTheme } from "@/theme";
import { Button, Chip, Txt } from "@/components/ui/primitives";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import {
  ErrorState,
  KeyValue,
  LoadingBlock,
  SectionCard,
} from "@/components/ui/feedback";
import { Screen, ScreenHeader } from "@/components/ui/screen";

type FormState = {
  title: string;
  purpose: string;
  type: string;
  status: string;
  description: string;
  price: string;
  size: string;
  beds: string;
  baths: string;
  floor: string;
  furnished: string;
  availableFrom: string;
  amenities: string[];
  address: string;
  lat: string;
  lng: string;
};

const BLANK: FormState = {
  title: "",
  purpose: "rent",
  type: "apartment",
  status: "active",
  description: "",
  price: "",
  size: "",
  beds: "",
  baths: "",
  floor: "",
  furnished: "unfurnished",
  availableFrom: "",
  amenities: [],
  address: "",
  lat: "",
  lng: "",
};

function fromProperty(property: Property): FormState {
  const coordinates = property.location?.coordinates;

  return {
    title: property.title ?? "",
    purpose: property.purpose ?? "rent",
    type: property.type ?? "apartment",
    status: property.status ?? "active",
    description: property.description ?? "",
    price: property.price ? String(property.price) : "",
    size: property.size ? String(property.size) : "",
    beds: property.beds ? String(property.beds) : "",
    baths: property.baths ? String(property.baths) : "",
    floor: property.floor ?? "",
    furnished: property.furnished ?? "unfurnished",
    availableFrom: property.availableFrom
      ? property.availableFrom.slice(0, 10)
      : "",
    amenities: property.amenities ?? [],
    address: property.address ?? "",
    // GeoJSON is [lng, lat]; the two inputs are edited separately.
    lat: coordinates?.[1] === undefined ? "" : String(coordinates[1]),
    lng: coordinates?.[0] === undefined ? "" : String(coordinates[0]),
  };
}

/** Validation mirrors the server's constraints so failures surface inline. */
function validate(form: FormState) {
  const errors: Partial<Record<keyof FormState, string>> = {};
  if (!form.title.trim()) errors.title = "A title is required";
  if (!toNumber(form.price) || (toNumber(form.price) ?? 0) <= 0) {
    errors.price = "Enter a price above zero";
  }
  if (!form.address.trim()) errors.address = "An address is required";
  if (form.lat.trim()) {
    const lat = toNumber(form.lat);
    if (lat === undefined || lat < -90 || lat > 90) {
      errors.lat = "Latitude must be between -90 and 90";
    }
  }
  if (form.lng.trim()) {
    const lng = toNumber(form.lng);
    if (lng === undefined || lng < -180 || lng > 180) {
      errors.lng = "Longitude must be between -180 and 180";
    }
  }
  // GeoJSON [lng, lat] is only useful when both halves are present.
  if (Boolean(form.lat.trim()) !== Boolean(form.lng.trim())) {
    errors.lat = errors.lat ?? "Latitude and longitude must both be set";
  }
  return errors;
}

function toPayload(form: FormState) {
  const lat = toNumber(form.lat);
  const lng = toNumber(form.lng);
  return {
    title: form.title.trim(),
    description: form.description.trim() || undefined,
    purpose: form.purpose,
    type: form.type,
    status: form.status,
    price: toNumber(form.price) ?? 0,
    size: toNumber(form.size),
    beds: toNumber(form.beds),
    baths: toNumber(form.baths),
    floor: form.floor.trim() || undefined,
    furnished: form.furnished,
    availableFrom: form.availableFrom || undefined,
    amenities: form.amenities,
    address: form.address.trim(),
    // GeoJSON is [lng, lat] — swapping these silently breaks every map query.
    location:
      lat !== undefined && lng !== undefined
        ? {
            type: "Point" as const,
            coordinates: [lng, lat] as [number, number],
          }
        : undefined,
  };
}

/** The route file (`[id]/edit`) wraps this in `RequireAuth`. */
export function ListingForm({
  editing,
  initial,
  loading,
  error,
  onRetry,
  onDone,
}: {
  editing: boolean;
  initial?: Property;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  onDone: () => void;
}) {
  const theme = useTheme();
  const router = useRouter();
  const [form, setForm] = React.useState<FormState>(BLANK);
  const [errors, setErrors] = React.useState<
    Partial<Record<keyof FormState, string>>
  >({});
  const loadedFor = React.useRef<string | undefined>(undefined);

  // Seed once per listing so typing is never clobbered by a background refetch.
  React.useEffect(() => {
    const key = initial?._id;
    if (!initial || loadedFor.current === key) return;
    loadedFor.current = key;
    setForm(fromProperty(initial));
  }, [initial]);

  const patch = (next: Partial<FormState>) =>
    setForm((state) => ({ ...state, ...next }));

  const save = useMutation({
    mutationFn: () => {
      const payload = toPayload(form) as Partial<Property>;
      if (!editing) return propertyApi.create(payload);
      // `editing` implies a listing, but the detail request can fail or come
      // back empty — never dereference `initial` on the strength of a boolean.
      const id = initial?._id;
      if (!id) throw new Error("This listing could not be loaded.");
      return propertyApi.update(id, payload);
    },
    successMessage: editing ? "Listing updated" : "Listing published",
    onSuccess: onDone,
  });

  const submit = () => {
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    void save.mutateAsync().catch(() => undefined);
  };

  if (loading) {
    return (
      <Screen>
        <ScreenHeader title={editing ? "Edit listing" : "New listing"} />
        <LoadingBlock />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <ScreenHeader title="Edit listing" />
        <ErrorState message={error} onRetry={() => onRetry?.()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader
        title={editing ? "Edit listing" : "New listing"}
        subtitle={
          editing ? "Changes go live immediately" : "Publishes as active"
        }
        onBack={() => router.back()}
        right={
          editing ? (
            <Button
              title="Media"
              size="sm"
              variant="outline"
              onPress={() => router.push(`/listings/${initial?._id}/media`)}
            />
          ) : undefined
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <SectionCard title="Basics">
          <Field label="Listing title" required error={errors.title}>
            <Input
              value={form.title}
              onChangeText={(title) => patch({ title })}
              placeholder="2 BHK near Connaught Place"
              invalid={Boolean(errors.title)}
            />
          </Field>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Select
                label="Purpose"
                value={form.purpose}
                onSelect={(purpose) => patch({ purpose })}
                options={PURPOSES.map((value) => ({
                  value,
                  label: value === "rent" ? "Rent" : "Buy",
                }))}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Select
                label="Property type"
                value={form.type}
                onSelect={(type) => patch({ type })}
                options={PROPERTY_TYPES.map((value) => ({
                  value,
                  label: propertyTypeLabel(value),
                }))}
              />
            </View>
          </View>

          {editing ? (
            <Select
              label="Status"
              value={form.status}
              onSelect={(status) => patch({ status })}
              options={PROPERTY_STATUSES.map((value) => ({
                value,
                label: value,
              }))}
            />
          ) : (
            <KeyValue
              label="Status"
              value="active"
              hint="Editable after publishing"
            />
          )}

          <Field label="Description">
            <Textarea
              value={form.description}
              onChangeText={(description) => patch({ description })}
              placeholder="What makes this place worth a viewing?"
            />
          </Field>
        </SectionCard>

        <SectionCard title="Specs">
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Field label="Price" required error={errors.price}>
                <Input
                  keyboardType="numeric"
                  value={form.price}
                  onChangeText={(price) => patch({ price })}
                  placeholder="42000"
                  invalid={Boolean(errors.price)}
                />
              </Field>
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Built-up area (sq.ft)">
                <Input
                  keyboardType="numeric"
                  value={form.size}
                  onChangeText={(size) => patch({ size })}
                  placeholder="1100"
                />
              </Field>
            </View>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Field label="Bedrooms">
                <Input
                  keyboardType="number-pad"
                  value={form.beds}
                  onChangeText={(beds) => patch({ beds })}
                  placeholder="2"
                />
              </Field>
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Bathrooms">
                <Input
                  keyboardType="number-pad"
                  value={form.baths}
                  onChangeText={(baths) => patch({ baths })}
                  placeholder="2"
                />
              </Field>
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Floor">
                <Input
                  value={form.floor}
                  onChangeText={(floor) => patch({ floor })}
                  placeholder="4th"
                />
              </Field>
            </View>
          </View>

          <Select
            label="Furnishing"
            value={form.furnished}
            onSelect={(furnished) => patch({ furnished })}
            options={FURNISHED.map((value) => ({
              value,
              label: value.replace("-", " "),
            }))}
          />

          <Field
            label="Available from"
            hint="YYYY-MM-DD, or leave blank for immediately."
          >
            <Input
              value={form.availableFrom}
              onChangeText={(availableFrom) => patch({ availableFrom })}
              placeholder="2026-01-15"
            />
          </Field>
        </SectionCard>

        <SectionCard title="Amenities">
          <View style={styles.wrapRow}>
            {AMENITIES.map((amenity) => (
              <Chip
                key={amenity}
                label={amenity}
                selected={form.amenities.includes(amenity)}
                onPress={() =>
                  patch({
                    amenities: form.amenities.includes(amenity)
                      ? form.amenities.filter((item) => item !== amenity)
                      : [...form.amenities, amenity],
                  })
                }
              />
            ))}
          </View>
        </SectionCard>

        <SectionCard title="Location">
          <Field label="Address" required error={errors.address}>
            <Input
              value={form.address}
              onChangeText={(address) => patch({ address })}
              placeholder="Connaught Place, New Delhi"
              invalid={Boolean(errors.address)}
            />
          </Field>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Field label="Latitude" error={errors.lat}>
                <Input
                  keyboardType="numbers-and-punctuation"
                  value={form.lat}
                  onChangeText={(lat) => patch({ lat })}
                  placeholder="28.6139"
                />
              </Field>
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Longitude" error={errors.lng}>
                <Input
                  keyboardType="numbers-and-punctuation"
                  value={form.lng}
                  onChangeText={(lng) => patch({ lng })}
                  placeholder="77.2090"
                />
              </Field>
            </View>
          </View>
          <Txt variant="tiny" tone="muted">
            Map queries use GeoJSON order — latitude goes second on the wire.
          </Txt>
        </SectionCard>

        {editing && initial?.verifiedAt ? (
          <SectionCard title="Verification">
            <KeyValue
              label="Verified on"
              value={String(initial.verifiedAt).slice(0, 10)}
            />
          </SectionCard>
        ) : null}

        <Pressable
          accessibilityRole="button"
          onPress={submit}
          disabled={save.isPending}
          style={[
            styles.submit,
            {
              backgroundColor: theme.primary,
              opacity: save.isPending ? 0.6 : 1,
            },
          ]}
        >
          <Txt variant="bodyStrong" style={{ color: theme.onPrimary }}>
            {save.isPending
              ? "Saving…"
              : editing
                ? "Save changes"
                : "Publish listing"}
          </Txt>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, marginHorizontal: -16 },
  body: { paddingHorizontal: 16, paddingBottom: 32, gap: 16 },
  row: { flexDirection: "row", gap: 12 },
  wrapRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  submit: { paddingVertical: 15, borderRadius: 12, alignItems: "center" },
});
