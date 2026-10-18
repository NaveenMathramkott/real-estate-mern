import { useRouter } from "expo-router";
import * as React from "react";
import { StyleSheet, View } from "react-native";

import { agencyApi } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import { useQuery } from "@/hooks/use-query";
import { Chip } from "@/components/ui/primitives";
import {
  EmptyState,
  ErrorState,
  ListRow,
  LoadingBlock,
  Pagination,
} from "@/components/ui/feedback";
import { Screen, ScreenHeader } from "@/components/ui/screen";

/** Agency directory, filterable by verification state. */
export default function AgenciesScreen() {
  const router = useRouter();
  const [verified, setVerified] = React.useState<boolean | undefined>();
  const [page, setPage] = React.useState(1);

  const { data, isLoading, error, refetch } = useQuery(
    `get|/agencies|${verified ?? "all"}|${page}`,
    () => agencyApi.list({ verified, page, limit: 20 }),
  );

  const agencies = data?.agencies ?? [];

  return (
    <Screen>
      <ScreenHeader
        title="Agencies"
        subtitle={`${formatNumber(data?.total ?? 0)} listed`}
        onBack={() => router.back()}
      />

      <View style={styles.row}>
        <Chip
          label="All"
          selected={verified === undefined}
          onPress={() => {
            setVerified(undefined);
            setPage(1);
          }}
        />
        <Chip
          label="Verified"
          selected={verified === true}
          onPress={() => {
            setVerified(true);
            setPage(1);
          }}
        />
        <Chip
          label="Unverified"
          selected={verified === false}
          onPress={() => {
            setVerified(false);
            setPage(1);
          }}
        />
      </View>

      {isLoading ? (
        <LoadingBlock />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void refetch()} />
      ) : agencies.length === 0 ? (
        <EmptyState
          icon="briefcase-outline"
          title="No agencies found"
          description="Agencies are admin-managed reference data."
        />
      ) : (
        <View style={styles.list}>
          {agencies.map((agency) => (
            <ListRow
              key={agency._id}
              icon="briefcase-outline"
              label={agency.name}
              description={[
                agency.verified ? "Verified" : "Not verified",
                agency.memberCount ? `${agency.memberCount} members` : null,
                agency.licenseNo,
              ]
                .filter(Boolean)
                .join(" · ")}
              onPress={() => router.push(`/agencies/${agency._id}`)}
            />
          ))}
          <Pagination
            page={data?.page ?? page}
            pages={data?.pages ?? 1}
            onChange={setPage}
          />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8 },
  list: { flex: 1, gap: 8 },
});
