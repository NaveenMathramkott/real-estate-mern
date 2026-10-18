import { useLocalSearchParams, useRouter } from "expo-router";

import { propertyApi } from "@/lib/api";
import { LISTER_ROLES } from "@/lib/roles";
import { useQuery } from "@/hooks/use-query";
import { RequireAuth } from "@/components/guards";
import { ListingForm } from "@/features/listings/listing-form";

/** Edit route — seeds the shared form from `GET /properties/{id}`. */
export default function EditListingScreen() {
  const router = useRouter();
  const { id = "" } = useLocalSearchParams<{ id: string }>();

  const existing = useQuery(id ? `get|/properties/${id}` : null, () =>
    propertyApi.detail(id),
  );

  return (
    <RequireAuth roles={LISTER_ROLES}>
      <ListingForm
        editing
        loading={existing.isLoading}
        initial={existing.data?.property}
        error={existing.error}
        onRetry={() => void existing.refetch()}
        onDone={() => router.replace("/listings")}
      />
    </RequireAuth>
  );
}
