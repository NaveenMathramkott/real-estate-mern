import * as React from "react";
import { ScrollView, View } from "react-native";

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
import { savedSearchApi } from "@/lib/api";
import {
  clearFilter,
  describeFilters,
  EMPTY_FILTERS,
  filtersToParams,
  useSearchStore,
  type SearchFilters,
} from "@/store/search-store";
import { useAuthStore } from "@/store/auth-store";
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
} from "@/components/ui/actionsheet";
import { Box } from "@/components/ui/box";
import {
  Button,
  Chip,
  Divider,
  FilterChip,
  Txt,
} from "@/components/ui/primitives";
import { Field, Input, RangeSlider } from "@/components/ui/form";
import { Pressable } from "@/components/ui/pressable";
import { Text as GSText } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useMutation } from "@/hooks/use-mutation";

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

  if (chips.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 8,
      }}
    >
      {chips.map((chip, index) => (
        <FilterChip
          key={`${chip.key}-${chip.value ?? index}`}
          label={chip.label}
          onClear={() => setFilters(clearFilter(filters, chip.key, chip.value))}
        />
      ))}
      {!compact ? (
        <Pressable onPress={reset} className="justify-center px-2">
          <GSText className="text-sm text-primary">Clear all</GSText>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <VStack space="sm">
      <Txt variant="tiny" tone="muted" uppercase>
        {label}
      </Txt>
      <Box className="flex-row flex-wrap gap-2">{children}</Box>
    </VStack>
  );
}

/**
 * Filter panel built on gluestack's `Actionsheet`, so it gets the platform
 * overlay, backdrop dismissal, drag indicator and keyboard avoidance for free.
 * The body mounts only while the sheet is open, so its draft always starts from
 * the committed filters and Cancel really cancels.
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
  const committed = useSearchStore((state) => state.filters);
  const setFilters = useSearchStore((state) => state.setFilters);
  const user = useAuthStore((state) => state.user);

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

  return (
    <Actionsheet
      isOpen={visible}
      onClose={onClose}
      closeOnOverlayClick
      isKeyboardDismissable
      className="bg-background"
    >
      <ActionsheetBackdrop className="bg-black/45" />
      <ActionsheetContent className="max-h-[88%] rounded-t-2xl border-t border-border bg-background pb-8">
        <ActionsheetDragIndicatorWrapper>
          <ActionsheetDragIndicator className="bg-border" />
        </ActionsheetDragIndicatorWrapper>

        <Box className="flex-row items-center justify-between px-4 pb-2 pt-4 w-[100%]">
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
            <Txt variant="small" tone="primary">
              Reset
            </Txt>
          </Pressable>
        </Box>

        <ScrollView
          style={{ maxHeight: 440 }}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 12,
            gap: 16,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <FilterGroup label="Sort by">
            {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(
              ([value, label]) => (
                <Chip
                  key={value}
                  label={label}
                  selected={(draft.sort ?? "relevance") === value}
                  onPress={() =>
                    setDraft((state) => ({
                      ...state,
                      sort: state.sort === value ? undefined : value,
                    }))
                  }
                />
              ),
            )}
          </FilterGroup>

          <Divider />

          <FilterGroup label="Purpose">
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
          </FilterGroup>

          <Divider />

          <VStack space="sm">
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
            <Box className="flex-row flex-wrap gap-2">
              {PRICE_BANDS[draft.purpose ?? "rent"].map((band) => {
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
            </Box>
            <Box className="flex-row gap-3">
              <View style={{ flex: 1 }}>
                <Field label="Min">
                  <Input
                    keyboardType="numeric"
                    placeholder="Any"
                    value={priceMinText}
                    onChangeText={setPriceMinText}
                  />
                </Field>
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Max">
                  <Input
                    keyboardType="numeric"
                    placeholder="Any"
                    value={priceMaxText}
                    onChangeText={setPriceMaxText}
                  />
                </Field>
              </View>
            </Box>
          </VStack>

          <Divider />

          <FilterGroup label="Bedrooms">
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
          </FilterGroup>

          <Divider />

          <FilterGroup label="Property type">
            {PROPERTY_TYPES.map((type) => (
              <Chip
                key={type}
                label={propertyTypeLabel(type)}
                selected={draft.type?.includes(type)}
                onPress={() => toggleIn("type", type)}
              />
            ))}
          </FilterGroup>

          <Divider />

          <FilterGroup label="Furnishing">
            {FURNISHED.map((value) => (
              <Chip
                key={value}
                label={value.replace("-", " ")}
                selected={draft.furnished?.includes(value)}
                onPress={() => toggleIn("furnished", value)}
              />
            ))}
          </FilterGroup>

          <Divider />

          <FilterGroup label="Amenities — all must match">
            {AMENITIES.map((amenity) => (
              <Chip
                key={amenity}
                label={amenity}
                selected={draft.amenities?.includes(amenity)}
                onPress={() => toggleIn("amenities", amenity)}
              />
            ))}
          </FilterGroup>

          <Divider />

          <FilterGroup label="Radius">
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
          </FilterGroup>
          <Txt variant="tiny" tone="muted">
            {draft.lat
              ? "Radius applies once you pick a map centre on the results screen."
              : "Set a radius here, then search from a centre on the map."}
          </Txt>
        </ScrollView>

        <Box className="flex-row gap-2.5 border-t border-border px-4 pt-3">
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
            className="flex-1"
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
        </Box>
      </ActionsheetContent>
    </Actionsheet>
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
      className="py-1.5"
    >
      <Txt variant="tiny" tone="primary">
        Save this search
      </Txt>
    </Pressable>
  );
}
