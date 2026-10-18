import { useRouter } from "expo-router";

import { Button } from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/feedback";
import { Screen, ScreenHeader } from "@/components/ui/screen";

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <Screen>
      <ScreenHeader title="Not found" />
      <EmptyState
        icon="compass-outline"
        title="That screen does not exist"
        description="The link may be out of date, or the listing has been removed."
        action={
          <Button title="Back to home" onPress={() => router.replace("/")} />
        }
      />
    </Screen>
  );
}
