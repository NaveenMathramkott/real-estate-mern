import { router } from "expo-router";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { View } from "react-native";

import { deniedRouteFor } from "@/lib/roles";
import type { Role } from "@/lib/types";
import { useAuthStore } from "@/store/auth-store";
import { Button, Card, Txt } from "@/components/ui/primitives";
import { LoadingBlock } from "@/components/ui/feedback";

/**
 * Role gate, mirroring the web app's `RequireRole`. Authentication itself is
 * handled once by the root layout, so this only has to answer "may this role
 * open this screen". Redirects happen in an effect so the first render can show
 * the guard's own explanation instead of flashing the destination.
 */
export function RequireAuth({
  children,
  roles,
}: {
  children: ReactNode;
  /** Omit for "any signed-in user". */
  roles?: Role[];
}) {
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);

  const satisfied = status === "authenticated" && Boolean(user);
  const allowed = satisfied && (!roles || (user && roles.includes(user.role)));

  useEffect(() => {
    if (status === "idle" || status === "loading") return;
    if (!satisfied) router.replace("/login");
    else if (!allowed) router.replace(deniedRouteFor(user?.role) as never);
  }, [status, satisfied, allowed, user?.role]);

  if (status === "idle" || status === "loading") return <LoadingBlock />;
  if (!satisfied) return null;
  if (!allowed) {
    return (
      <View style={{ padding: 24 }}>
        <Card>
          <Txt variant="heading">Not available for your role</Txt>
          <Txt variant="small" tone="muted" style={{ marginTop: 6 }}>
            This area is limited to {roles?.join(", ")}. Taking you back to your
            dashboard…
          </Txt>
          <Button
            title="Back to dashboard"
            variant="outline"
            size="sm"
            onPress={() => router.replace(deniedRouteFor(user?.role) as never)}
            style={{ marginTop: 14 }}
          />
        </Card>
      </View>
    );
  }

  return <>{children}</>;
}
