import { create } from "zustand";

import { favoriteApi } from "@/lib/api";
import { toast } from "@/store/toast-store";

import { useAuthStore } from "./auth-store";

type FavoritesState = {
  /** Property ids the signed-in user has shortlisted. */
  ids: string[];
  status: "idle" | "loading" | "ready";
  error: string | null;
  /** Ids with an in-flight add/remove, so cards can show a busy heart. */
  pending: string[];
  load: () => Promise<void>;
  has: (propertyId: string) => boolean;
  toggle: (propertyId: string) => Promise<boolean>;
  clear: () => void;
};

function toggleIn(list: string[], id: string) {
  return list.includes(id)
    ? list.filter((value) => value !== id)
    : [...list, id];
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  ids: [],
  status: "idle",
  error: null,
  pending: [],

  has: (propertyId) => get().ids.includes(propertyId),

  load: async () => {
    const user = useAuthStore.getState().user;
    if (!user) {
      set({ ids: [], status: "idle", error: null });
      return;
    }
    set({ status: "loading", error: null });
    try {
      const data = await favoriteApi.list();
      const ids = (data.favorites ?? [])
        .map((favorite) => {
          const property = favorite.propertyId;
          return typeof property === "string"
            ? property
            : (property as { _id?: string } | undefined)?._id;
        })
        .filter((id): id is string => Boolean(id));
      set({ ids, status: "ready" });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Could not load",
        status: "idle",
      });
    }
  },

  /** Optimistic shortlist toggle that rolls back if the server refuses. */
  toggle: async (propertyId) => {
    const user = useAuthStore.getState().user;
    if (!user) return false;

    const wasFavorited = get().ids.includes(propertyId);
    set((state) => ({
      ids: toggleIn(state.ids, propertyId),
      pending: state.pending.includes(propertyId)
        ? state.pending
        : [...state.pending, propertyId],
    }));

    try {
      if (wasFavorited) await favoriteApi.remove(propertyId);
      else await favoriteApi.add(propertyId);
      return !wasFavorited;
    } catch (error) {
      set((state) => ({
        ids: toggleIn(state.ids, propertyId),
        error: error instanceof Error ? error.message : "Update failed",
      }));
      toast.error(
        "Could not update shortlist",
        error instanceof Error ? error.message : undefined,
      );
      return wasFavorited;
    } finally {
      set((state) => ({
        pending: state.pending.filter((id) => id !== propertyId),
      }));
    }
  },

  clear: () => set({ ids: [], status: "idle", error: null, pending: [] }),
}));

/** Convenience selectors so components don't subscribe to the whole store. */
export function useFavoriteIds() {
  return useFavoritesStore((s) => s.ids);
}

export function useIsFavorite(propertyId: string) {
  return useFavoritesStore((s) => s.ids.includes(propertyId));
}

export function useIsFavoritePending(propertyId: string) {
  return useFavoritesStore((s) => s.pending.includes(propertyId));
}
