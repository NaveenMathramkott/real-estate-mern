import { create } from "zustand";

import { propertyApi } from "@/lib/api";
import { propertyImages } from "@/features/property-images";
import type { Property } from "@/lib/types";

/**
 * Enriches the partial property objects that some endpoints return.
 *
 * `GET /properties` attaches an `images` array and a `thumbnail` itself, but
 * `/favorites` and the dashboards populate only a field subset — no media, no
 * `size`, no `baths`. Rather than change every call site, cards ask this store
 * for the full record and it resolves it on demand.
 *
 * Resolution is deliberately lazy: a hook in `property-cover` triggers it only
 * when the card scrolls into view, so a 20-item grid costs a handful of
 * requests rather than twenty, and each property is fetched once per session.
 */

type State = {
  details: Record<string, Property>;
  /** Ids with a request in flight, so repeated triggers stay cheap. */
  loading: Record<string, true>;
  /** Ids whose lookup failed — retried only on an explicit remount. */
  failed: Record<string, true>;
  resolve: (propertyId: string) => Promise<void>;
  clear: () => void;
};

export const usePropertyDetails = create<State>((set, get) => ({
  details: {},
  loading: {},
  failed: {},

  resolve: async (propertyId) => {
    if (!propertyId) return;
    const state = get();
    if (state.details[propertyId] || state.loading[propertyId]) return;

    set((current) => ({ loading: { ...current.loading, [propertyId]: true } }));

    try {
      const data = await propertyApi.detail(propertyId);
      const property = data.property;
      if (property) {
        // The detail endpoint returns media separately; only the list endpoint
        // derives `images`/`thumbnail` from it, so do the same here or the
        // card would resolve with nothing to show.
        const images = propertyImages(property, data.media);
        const enriched: Property = {
          ...property,
          images,
          thumbnail: property.thumbnail ?? images[0] ?? null,
        };
        set((current) => {
          const failed = { ...current.failed };
          delete failed[propertyId];
          return {
            details: { ...current.details, [propertyId]: enriched },
            failed,
          };
        });
      }
    } catch {
      set((current) => ({ failed: { ...current.failed, [propertyId]: true } }));
    } finally {
      set((current) => {
        const loading = { ...current.loading };
        delete loading[propertyId];
        return { loading };
      });
    }
  },

  clear: () => set({ details: {}, loading: {}, failed: {} }),
}));

/**
 * The best version of a property available: the caller's copy, overlaid with
 * anything the detail endpoint knows. The caller's values win, so a newer list
 * response is never rolled back by a stale cache entry.
 */
export function useResolvedProperty(
  property?: Pick<Property, "_id"> | null,
): (Property & Record<string, unknown>) | undefined {
  const id = property?._id;
  return usePropertyDetails((s) => (id ? s.details[id] : undefined)) as
    | (Property & Record<string, unknown>)
    | undefined;
}

/** Merge helper for call sites that already hold a concrete property. */
export function mergeProperty<T extends Property>(
  base: T,
  detail?: Property,
): T {
  if (!detail) return base;

  const merged = { ...base } as Record<string, unknown>;
  for (const [key, value] of Object.entries(detail)) {
    if (key === "_id") continue;
    // Only fill gaps: an empty value in the base must not overwrite real data.
    const current = merged[key];
    if (current === undefined || current === null || current === "") {
      merged[key] = value;
    }
  }
  return merged as T;
}
