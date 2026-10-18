import { useLocalSearchParams, useRouter } from "expo-router";
import { View } from "react-native";

import { agencyApi } from "@/lib/api";
import { useQuery } from "@/hooks/use-query";
import { Txt } from "@/components/ui/primitives";
import {
  EmptyState,
  ErrorState,
  KeyValue,
  ListRow,
  LoadingBlock,
  SectionCard,
} from "@/components/ui/feedback";
import { Screen, ScreenHeader } from "@/components/ui/screen";

/** Agency detail with its member profiles. */
export default function AgencyDetailScreen() {
  const router = useRouter();
  const { id = "" } = useLocalSearchParams<{ id: string }>();

  const { data, isLoading, error, refetch } = useQuery(
    id ? `get|/agencies/${id}` : null,
    () => agencyApi.detail(id),
  );

  const agency = data?.agency;
  const members = data?.members ?? [];

  return (
    <Screen>
      <ScreenHeader
        title={agency?.name ?? "Agency"}
        subtitle={agency?.verified ? "Verified" : "Unverified"}
        onBack={() => router.back()}
      />

      {isLoading ? (
        <LoadingBlock />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void refetch()} />
      ) : agency ? (
        <>
          <SectionCard title="About">
            <KeyValue label="License" value={agency.licenseNo ?? "—"} />
            <KeyValue
              label="Status"
              value={agency.verified ? "Verified" : "Not verified"}
            />
            <KeyValue label="Members" value={String(members.length)} />
          </SectionCard>

          <View style={{ gap: 10 }}>
            <Txt variant="heading">Members</Txt>
            {members.length === 0 ? (
              <EmptyState
                icon="people-outline"
                title="No member profiles"
                description="Profiles link to an agency once an agent sets their agencyId."
              />
            ) : (
              members.map((member) => (
                <ListRow
                  key={member._id}
                  icon="person-outline"
                  label={member.name ?? "Unnamed profile"}
                  onPress={() =>
                    member.userId
                      ? router.push(`/profiles/${member.userId}`)
                      : undefined
                  }
                />
              ))
            )}
          </View>
        </>
      ) : null}
    </Screen>
  );
}
