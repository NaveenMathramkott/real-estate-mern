import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { SortOption } from "@/lib/constants";

/** Mirrors the GET /properties query contract, so the store doubles as the request shape. */
export type SearchFilters = {
  q?: string;
  purpose?: "rent" | "buy";
  city?: string;
  type?: string[];
  beds?: number;
  priceMin?: number;
  priceMax?: number;
  furnished?: string[];
  amenities?: string[];
  lat?: number;
  lng?: number;
  radius?: number;
  /** Closed GeoJSON ring, `[lng, lat]` pairs. */
  polygon?: [number, number][];
  sort?: SortOption;
  page?: number;
  limit?: number;
};

export const EMPTY_FILTERS: SearchFilters = {
  sort: "relevance",
  page: 1,
  limit: 20,
};

/** How the results surface renders. Mobile has no room for a split view, so it
 *  is either a scrolling list or a full-screen map. */
export type ViewMode = "list" | "map";

type SearchState = {
  filters: SearchFilters;
  view: ViewMode;
  /** Price inputs stay as text while the slider is being dragged. */
  setFilter: <K extends keyof SearchFilters>(
    key: K,
    value: SearchFilters[K],
  ) => void;
  setFilters: (patch: Partial<SearchFilters>) => void;
  toggleArrayFilter: (
    key: "type" | "furnished" | "amenities",
    value: string,
  ) => void;
  reset: () => void;
  setView: (view: ViewMode) => void;
};

function withoutSticky(patch: Partial<SearchFilters>): SearchFilters {
  // Changing any filter resets pagination, otherwise page 3 of the old result
  // set is requested against a brand new one.
  const keys = Object.keys(patch);
  const shouldResetPage = keys.some((key) => key !== "page" && key !== "limit");
  return shouldResetPage ? { ...patch, page: 1 } : patch;
}

export const useSearchStore = create<SearchState>()(
  persist(
    (set) => ({
      filters: { ...EMPTY_FILTERS },
      view: "list",

      setFilter: (key, value) =>
        set((state) => ({
          filters: { ...state.filters, ...withoutSticky({ [key]: value }) },
        })),

      setFilters: (patch) =>
        set((state) => ({
          filters: { ...state.filters, ...withoutSticky(patch) },
        })),

      toggleArrayFilter: (key, value) =>
        set((state) => {
          const current = state.filters[key] ?? [];
          const next = current.includes(value)
            ? current.filter((item) => item !== value)
            : [...current, value];
          return {
            filters: { ...state.filters, [key]: next, page: 1 },
          };
        }),

      reset: () => set({ filters: { ...EMPTY_FILTERS } }),

      setView: (view) => set({ view }),
    }),
    {
      name: "tenementary:search",
      storage: createJSONStorage(() => AsyncStorage),
      // `view` is a device preference, not part of the query — but persisting it
      // keeps the layout stable across launches, so it stays in.
      partialize: (state) => ({ filters: state.filters, view: state.view }),
    },
  ),
);

/** Query-param projection of the filters, ready for `GET /properties`. */
export function filtersToParams(filters: SearchFilters) {
  return {
    q: filters.q,
    purpose: filters.purpose,
    city: filters.city,
    type: filters.type?.length ? filters.type.join(",") : undefined,
    beds: filters.beds,
    priceMin: filters.priceMin,
    priceMax: filters.priceMax,
    furnished: filters.furnished?.length
      ? filters.furnished.join(",")
      : undefined,
    amenities: filters.amenities?.length
      ? filters.amenities.join(",")
      : undefined,
    lat: filters.lat,
    lng: filters.lng,
    radius: filters.radius,
    // The API expects a JSON string of a closed `[lng, lat]` ring.
    polygon: filters.polygon ? JSON.stringify(filters.polygon) : undefined,
    page: filters.page,
    limit: filters.limit,
  };
}

export function describeFilters(filters: SearchFilters): {
  label: string;
  key: keyof SearchFilters;
  value?: string | number;
}[] {
  const chips: {
    label: string;
    key: keyof SearchFilters;
    value?: string | number;
  }[] = [];

  if (filters.q) chips.push({ label: `“${filters.q}”`, key: "q" });
  if (filters.city) chips.push({ label: filters.city, key: "city" });
  if (filters.beds) chips.push({ label: `${filters.beds}+ beds`, key: "beds" });
  if (filters.priceMin || filters.priceMax) {
    const min = filters.priceMin
      ? `${(filters.priceMin / 1000).toFixed(0)}k`
      : "0";
    const max = filters.priceMax
      ? `${(filters.priceMax / 1000).toFixed(0)}k`
      : "any";
    chips.push({ label: `₹${min} – ₹${max}`, key: "priceMin" });
  }
  for (const value of filters.furnished ?? []) {
    chips.push({ label: value, key: "furnished", value });
  }
  for (const value of filters.type ?? []) {
    chips.push({ label: value, key: "type", value });
  }
  for (const value of filters.amenities ?? []) {
    chips.push({ label: value, key: "amenities", value });
  }
  if (filters.radius) {
    chips.push({
      label: `within ${(filters.radius / 1000).toFixed(0)} km`,
      key: "lat",
    });
  }
  if (filters.polygon?.length) {
    chips.push({ label: "drawn area", key: "polygon" });
  }

  return chips;
}

/** Clear one chip, keeping the rest of the query intact. */
export function clearFilter(
  filters: SearchFilters,
  key: keyof SearchFilters,
  value?: string | number,
) {
  const next: SearchFilters = { ...filters };
  if (Array.isArray(next[key])) {
    (next[key] as string[]) = (next[key] as string[]).filter(
      (item) => item !== value,
    );
  } else {
    delete next[key];
  }
  return { ...next, page: 1 };
}
