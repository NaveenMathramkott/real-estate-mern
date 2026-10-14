import type { SortOption } from "@/lib/constants";
import type { Property } from "@/lib/types";

/**
 * Client-side ordering. `GET /properties` accepts no `sort` param, so sorting
 * happens here over the current page rather than triggering a refetch.
 */
export function sortProperties(properties: Property[], sort: SortOption) {
  const copy = [...properties];
  switch (sort) {
    case "price-asc":
      return copy.sort((a, b) => a.price - b.price);
    case "price-desc":
      return copy.sort((a, b) => b.price - a.price);
    case "size-desc":
      return copy.sort((a, b) => (b.size ?? 0) - (a.size ?? 0));
    case "newest":
      return copy.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    default:
      return copy;
  }
}
