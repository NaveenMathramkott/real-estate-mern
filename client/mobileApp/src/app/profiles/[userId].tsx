import { useLocalSearchParams, useRouter } from "expo-router";
import { View } from "react-native";

import { profileApi } from "@/lib/api";
import { idOf } from "@/lib/format";
import { ROLE_LABELS } from "@/lib/roles";
import { useQuery } from "@/hooks/use-query";
import { Avatar, Badge, Button, Txt } from "@/components/ui/primitives";
import {
  ErrorState,
  KeyValue,
  LoadingBlock,
  SectionCard,
} from "@/components/ui/feedback";
import { Screen, ScreenHeader } from "@/components/ui/screen";

/** Public profile for any user, reached from agency member lists. */
export default function PublicProfileScreen() {
  const router = useRouter();
  const { userId = "" } = useLocalSearchParams<{ userId: string }>();

  const { data, isLoading, error, refetch } = useQuery(
    userId ? `get|/profiles/${userId}` : null,
    () => profileApi.of(userId),
  );

  const profile = data?.profile;
  const resolvedRole =
    profile && "role" in profile
      ? String((profile as { role: string }).role)
      : undefined;

  return (
    <Screen scroll>
      <ScreenHeader title="Profile" onBack={() => router.back()} />

      {isLoading ? <LoadingBlock /> : null}
      {error ? (
        <ErrorState message={error} onRetry={() => void refetch()} />
      ) : null}

      {profile ? (
        <>
          <View style={{ alignItems: "center", gap: 10 }}>
            <Avatar name={profile.name} uri={profile.avatar} size={72} />
            <Txt variant="title">{profile.name ?? "Unnamed profile"}</Txt>
            {resolvedRole ? (
              <Badge tone="primary">
                {ROLE_LABELS[resolvedRole as never] ?? resolvedRole}
              </Badge>
            ) : null}
          </View>

          {profile.bio ? (
            <Txt variant="body" tone="muted" center>
              {profile.bio}
            </Txt>
          ) : null}

          <SectionCard title="Details">
            <KeyValue label="User ID" value={idOf(profile.userId) ?? "—"} />
            {idOf(profile.agencyId) ? (
              <KeyValue label="Agency" value={idOf(profile.agencyId)} />
            ) : null}
          </SectionCard>

          <Button
            title="View agency"
            variant="outline"
            onPress={() =>
              profile.agencyId
                ? router.push(`/agencies/${profile.agencyId}`)
                : undefined
            }
            disabled={!profile.agencyId}
            fullWidth
          />
        </>
      ) : null}
    </Screen>
  );
}
