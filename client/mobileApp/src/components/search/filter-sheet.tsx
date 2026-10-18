import * as React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import {
  AMENITIES,
  FURNISHED,
  PRICE_BANDS,
  PROPERTY_TYPES,
  PURPOSES,
  propertyTypeLabel,
  type SortOption,
} from "@/lib/constants";
import { formatCompact } from "@/lib/format";
import {
  clearFilter,
  describeFilters,
  EMPTY_FILTERS,
  filtersToParams,
  useSearchStore,
  type SearchFilters,
} from "@/store/search-store";
import { useTheme } from "@/theme";
import {
  Button,
  Chip,
  Divider,
  FilterChip,
  Txt,
} from "@/components/ui/primitives";
import { Field, Input, RangeSlider } from "@/components/ui/form";
import { savedSearchApi } from "@/lib/api";
import { useMutation } from "@/hooks/use-mutation";
import { useAuthStore } from "@/store/auth-store";

const SORT_LABELS: Record<SortOption, string> = {
  relevance: "Recommended",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  "size-desc": "Largest first",
  newest: "Newest first",
};

const BED_PRESETS = [1, 2, 3, 4];
const RADIUS_STEPS = [500, 1000, 2000, 5000, 10000, 20000, 50000];

const PRICE_CEILING = { rent: 500_000, buy: 50_000_000 };
const PRICE_STEP = 50_000;

/** Summary of what is currently narrowing the results, with per-chip clearing. */
export function ActiveFilterChips({ compact = false }: { compact?: boolean }) {
  const filters = useSearchStore((state) => state.filters);
  const setFilters = useSearchStore((state) => state.setFilters);
  const reset = useSearchStore((state) => state.reset);
  const chips = describeFilters(filters);
  const theme = useTheme();

  if (chips.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipRow}
    >
      {chips.map((chip, index) => (
        <FilterChip
          key={`${chip.key}-${chip.value ?? index}`}
          label={chip.label}
          onClear={() => setFilters(clearFilter(filters, chip.key, chip.value))}
        />
      ))}
      {!compact ? (
        <Pressable
          onPress={reset}
          style={{ justifyContent: "center", paddingHorizontal: 8 }}
        >
          <Txt variant="small" style={{ color: theme.primary }}>
            Clear all
          </Txt>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

/** Sort menu — the mobile equivalent of the web results `SortMenu`. */
export function SortRow() {
  const sort = useSearchStore((state) => state.filters.sort ?? "relevance");
  const setFilter = useSearchStore((state) => state.setFilter);
  const theme = useTheme();
  const options = Object.entries(SORT_LABELS) as [SortOption, string][];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.sortRow}
    >
      {options.map(([value, label]) => {
        const active = sort === value;
        return (
          <Pressable
            key={value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => setFilter("sort", value)}
            style={[
              styles.sortChip,
              {
                backgroundColor: active ? theme.foreground : theme.surface,
                borderColor: active ? theme.foreground : theme.border,
              },
            ]}
          >
            <Txt
              variant="tiny"
              style={{ color: active ? theme.surface : theme.foreground }}
            >
              {label}
            </Txt>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/**
 * Bottom-sheet filter panel — the mobile stand-in for the web filter sidebar.
 * The body mounts only while the sheet is open, so its draft state always starts
 * from the committed filters and Cancel really cancels.
 */
export function FilterSheet({
  visible,
  onClose,
  onApply,
  resultCount,
}: {
  visible: boolean;
  onClose: () => void;
  onApply: () => void;
  resultCount?: number;
}) {
  if (!visible) return null;

  return (
    <FilterSheetBody
      onClose={onClose}
      onApply={onApply}
      resultCount={resultCount}
    />
  );
}

function FilterSheetBody({
  onClose,
  onApply,
  resultCount,
}: {
  onClose: () => void;
  onApply: () => void;
  resultCount?: number;
}) {
  const committed = useSearchStore((state) => state.filters);
  const setFilters = useSearchStore((state) => state.setFilters);
  const user = useAuthStore((state) => state.user);
  const theme = useTheme();

  const [draft, setDraft] = React.useState<SearchFilters>(committed);
  const [priceMinText, setPriceMinText] = React.useState(
    committed.priceMin ? String(committed.priceMin) : "",
  );
  const [priceMaxText, setPriceMaxText] = React.useState(
    committed.priceMax ? String(committed.priceMax) : "",
  );

  const ceiling = PRICE_CEILING[draft.purpose ?? "rent"];

  const saveSearch = useMutation({
    mutationFn: () =>
      savedSearchApi.create({
        filters: filtersToParams(draft),
        alertFrequency: "daily",
      }),
    successMessage: "Search saved",
    onSuccess: onClose,
  });

  const toggleIn = (key: "type" | "furnished" | "amenities", value: string) => {
    const current = draft[key] ?? [];
    const next = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];
    setDraft((state) => ({ ...state, [key]: next }));
  };

  const bands = PRICE_BANDS[draft.purpose ?? "rent"];

  return (
    <View style={[StyleSheet.absoluteFill, styles.sheetHost]}>
      <Pressable
        accessibilityLabel="Close filters"
        onPress={onClose}
        style={[StyleSheet.absoluteFill, { backgroundColor: theme.overlay }]}
      />

      <View
        style={[
          styles.sheet,
          { backgroundColor: theme.background, borderColor: theme.border },
        ]}
      >
        <View style={styles.sheetHeader}>
          <Txt variant="heading">Filters</Txt>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Reset filters"
            onPress={() => {
              setDraft({ ...EMPTY_FILTERS });
              setPriceMinText("");
              setPriceMaxText("");
            }}
          >
            <Txt variant="small" style={{ color: theme.primary }}>
              Reset
            </Txt>
          </Pressable>
        </View>

        <ScrollView
          style={{ maxHeight: 460 }}
          contentContainerStyle={styles.sheetBody}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ gap: 8 }}>
            <Txt variant="tiny" tone="muted" uppercase>
              Purpose
            </Txt>
            <View style={styles.wrapRow}>
              {PURPOSES.map((purpose) => (
                <Chip
                  key={purpose}
                  label={purpose === "rent" ? "Rent" : "Buy"}
                  selected={draft.purpose === purpose}
                  onPress={() =>
                    setDraft((state) => ({
                      ...state,
                      purpose: state.purpose === purpose ? undefined : purpose,
                      priceMin: undefined,
                      priceMax: undefined,
                    }))
                  }
                />
              ))}
            </View>
          </View>

          <Divider />

          <View style={{ gap: 8 }}>
            <Txt variant="tiny" tone="muted" uppercase>
              Price ({formatCompact(0)} – {formatCompact(ceiling)})
            </Txt>
            <RangeSlider
              min={0}
              max={ceiling}
              step={PRICE_STEP}
              lower={draft.priceMin ?? 0}
              upper={draft.priceMax ?? ceiling}
              onChange={(lower, upper) =>
                setDraft((state) => ({
                  ...state,
                  priceMin: lower <= 0 ? undefined : lower,
                  priceMax: upper >= ceiling ? undefined : upper,
                }))
              }
            />
            <View style={styles.bandRow}>
              {bands.map((band) => {
                const active =
                  draft.priceMin === band.min && draft.priceMax === band.max;
                return (
                  <Chip
                    key={band.label}
                    label={band.label}
                    selected={active}
                    onPress={() =>
                      setDraft((state) => ({
                        ...state,
                        priceMin: active ? undefined : band.min,
                        priceMax: active ? undefined : band.max,
                      }))
                    }
                  />
                );
              })}
            </View>
            <View style={styles.priceInputs}>
              <Field label="Min">
                <Input
                  keyboardType="numeric"
                  placeholder="Any"
                  value={priceMinText}
                  onChangeText={setPriceMinText}
                />
              </Field>
              <Field label="Max">
                <Input
                  keyboardType="numeric"
                  placeholder="Any"
                  value={priceMaxText}
                  onChangeText={setPriceMaxText}
                />
              </Field>
            </View>
          </View>

          <Divider />

          <View style={{ gap: 8 }}>
            <Txt variant="tiny" tone="muted" uppercase>
              Bedrooms
            </Txt>
            <View style={styles.wrapRow}>
              {BED_PRESETS.map((beds) => (
                <Chip
                  key={beds}
                  label={`${beds}+`}
                  selected={draft.beds === beds}
                  onPress={() =>
                    setDraft((state) => ({
                      ...state,
                      beds: state.beds === beds ? undefined : beds,
                    }))
                  }
                />
              ))}
            </View>
          </View>

          <Divider />

          <View style={{ gap: 8 }}>
            <Txt variant="tiny" tone="muted" uppercase>
              Property type
            </Txt>
            <View style={styles.wrapRow}>
              {PROPERTY_TYPES.map((type) => (
                <Chip
                  key={type}
                  label={propertyTypeLabel(type)}
                  selected={draft.type?.includes(type)}
                  onPress={() => toggleIn("type", type)}
                />
              ))}
            </View>
          </View>

          <Divider />

          <View style={{ gap: 8 }}>
            <Txt variant="tiny" tone="muted" uppercase>
              Furnishing
            </Txt>
            <View style={styles.wrapRow}>
              {FURNISHED.map((value) => (
                <Chip
                  key={value}
                  label={value.replace("-", " ")}
                  selected={draft.furnished?.includes(value)}
                  onPress={() => toggleIn("furnished", value)}
                />
              ))}
            </View>
          </View>

          <Divider />

          <View style={{ gap: 8 }}>
            <Txt variant="tiny" tone="muted" uppercase>
              Amenities — all must match
            </Txt>
            <View style={styles.wrapRow}>
              {AMENITIES.map((amenity) => (
                <Chip
                  key={amenity}
                  label={amenity}
                  selected={draft.amenities?.includes(amenity)}
                  onPress={() => toggleIn("amenities", amenity)}
                />
              ))}
            </View>
          </View>

          <Divider />

          <View style={{ gap: 8 }}>
            <Txt variant="tiny" tone="muted" uppercase>
              Radius
            </Txt>
            <View style={styles.wrapRow}>
              <Chip
                label="Anywhere"
                selected={!draft.lat}
                onPress={() =>
                  setDraft((state) => ({
                    ...state,
                    lat: undefined,
                    lng: undefined,
                    radius: undefined,
                  }))
                }
              />
              {RADIUS_STEPS.map((metres) => (
                <Chip
                  key={metres}
                  label={metres >= 1000 ? `${metres / 1000} km` : `${metres} m`}
                  selected={draft.radius === metres}
                  onPress={() =>
                    setDraft((state) => ({
                      ...state,
                      radius: state.radius === metres ? undefined : metres,
                    }))
                  }
                />
              ))}
            </View>
            <Txt variant="tiny" tone="muted">
              {draft.lat
                ? "Radius applies once you pick a map centre on the results screen."
                : "Set a radius here, then search from a centre on the map."}
            </Txt>
          </View>
        </ScrollView>

        <View style={[styles.sheetFooter, { borderTopColor: theme.border }]}>
          {user ? (
            <Button
              title="Save search"
              variant="outline"
              onPress={() => saveSearch.mutate()}
              loading={saveSearch.isPending}
            />
          ) : null}
          <Button
            title={
              resultCount === undefined
                ? "Show results"
                : `Show ${resultCount} results`
            }
            onPress={() => {
              const min = Number(priceMinText.replace(/,/g, ""));
              const max = Number(priceMaxText.replace(/,/g, ""));
              setFilters({
                ...draft,
                priceMin: Number.isFinite(min) && min > 0 ? min : undefined,
                priceMax: Number.isFinite(max) && max > 0 ? max : undefined,
              });
              onApply();
            }}
          />
        </View>
      </View>
    </View>
  );
}

/** Nudges the visitor to save a search, mirroring the web empty-state CTA. */
export function SaveCurrentSearchPrompt() {
  const filters = useSearchStore((state) => state.filters);
  const user = useAuthStore((state) => state.user);

  const save = useMutation({
    mutationFn: () =>
      savedSearchApi.create({
        filters: filtersToParams(filters),
        alertFrequency: "off",
      }),
    successMessage: "Search saved",
  });

  // The prompt only makes sense once a search has narrowed something and the
  // visitor has an account to attach the alert to.
  if (!user || describeFilters(filters).length === 0) return null;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => save.mutate()}
      style={{ paddingVertical: 6 }}
    >
      <Txt variant="tiny" tone="primary">
        Save this search
      </Txt>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chipRow: { gap: 8, paddingHorizontal: 16, paddingVertical: 8 },
  sortRow: { gap: 8, paddingHorizontal: 16, paddingVertical: 6 },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  sheetHost: { zIndex: 60 },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: "88%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    paddingBottom: 28,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 10,
  },
  sheetBody: { paddingHorizontal: 16, paddingBottom: 12, gap: 16 },
  wrapRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  bandRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  priceInputs: { flexDirection: "row", gap: 12 },
  sheetFooter: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
