import { useQuery } from "@/hooks/use-query";
import { propertyApi } from "@/lib/api";
import { filtersToParams, useSearchStore } from "@/store/search-store";

/**
 * Both the list and map surfaces read the same store and therefore the same
 * query key, so switching views never refetches.
 */
export function useSearchResults() {
  const filters = useSearchStore((state) => state.filters);
  const params = filtersToParams(filters);

  return useQuery(`get|/properties|${JSON.stringify(params)}`, () =>
    propertyApi.search(params),
  );
}
