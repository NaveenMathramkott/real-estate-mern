import { useRouter } from "expo-router";

import { LISTER_ROLES } from "@/lib/roles";
import { RequireAuth } from "@/components/guards";
import { ListingForm } from "@/features/listings/listing-form";

/** Create route. `/listings/new` and `/listings/[id]/edit` share one form; the
 *  only difference is whether an existing listing seeds the fields. */
export default function NewListingScreen() {
  const router = useRouter();

  return (
    <RequireAuth roles={LISTER_ROLES}>
      <ListingForm editing={false} onDone={() => router.replace("/listings")} />
    </RequireAuth>
  );
}
