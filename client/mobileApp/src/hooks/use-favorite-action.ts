import { useRouter } from "expo-router";
import { useCallback } from "react";

import { toast } from "@/store/toast-store";
import { useAuthStore } from "@/store/auth-store";
import { useFavoritesStore } from "@/store/favorites-store";

/** One entry point for the heart: signed out to sign-in, signed in to an optimistic toggle. */
export function useFavoriteAction() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const toggle = useFavoritesStore((s) => s.toggle);

  return useCallback(
    async (propertyId: string) => {
      if (!user) {
        router.push("/login");
        return;
      }
      const nowFavorite = await toggle(propertyId);
      toast.success(
        nowFavorite ? "Added to shortlist" : "Removed from shortlist",
        nowFavorite ? "Find it any time under Saved." : undefined,
      );
    },
    [router, toggle, user],
  );
}
