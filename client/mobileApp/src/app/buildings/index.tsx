import { useRouter } from "expo-router";
import * as React from "react";
import { StyleSheet, View } from "react-native";

import { buildingApi } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import { useQuery } from "@/hooks/use-query";
import { Button } from "@/components/ui/primitives";
import { Input } from "@/components/ui/form";
import {
  EmptyState,
  ErrorState,
  ListRow,
  LoadingBlock,
  Pagination,
} from "@/components/ui/feedback";
import { Screen, ScreenHeader } from "@/components/ui/screen";

/** Building directory — the mobile counterpart of the web buildings list. */
export default function BuildingsScreen() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [developer, setDeveloper] = React.useState("");
  const [page, setPage] = React.useState(1);

  const { data, isLoading, error, refetch } = useQuery(
    `get|/buildings|${name}|${developer}|${page}`,
    () =>
      buildingApi.list({
        name: name || undefined,
        developer: developer || undefined,
        page,
        limit: 20,
      }),
  );

  const buildings = data?.buildings ?? [];

  return (
    <Screen>
      <ScreenHeader
        title="Buildings"
        subtitle={`${formatNumber(data?.total ?? 0)} listed`}
        onBack={() => router.back()}
      />

      <View style={styles.filters}>
        <View style={{ flex: 1 }}>
          <Input
            value={name}
            onChangeText={(v) => {
              setName(v);
              setPage(1);
            }}
            placeholder="Name"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Input
            value={developer}
            onChangeText={(v) => {
              setDeveloper(v);
              setPage(1);
            }}
            placeholder="Developer"
          />
        </View>
      </View>

      {isLoading ? (
        <LoadingBlock />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void refetch()} />
      ) : buildings.length === 0 ? (
        <EmptyState
          icon="business-outline"
          title="No buildings found"
          description="Buildings are admin-managed reference data."
        />
      ) : (
        <View style={styles.list}>
          {buildings.map((building) => (
            <ListRow
              key={building._id}
              icon="business-outline"
              label={building.name}
              description={
                [
                  building.developer,
                  building.yearBuilt ? `Built ${building.yearBuilt}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ") || "Developer not set"
              }
              onPress={() => router.push(`/buildings/${building._id}`)}
            />
          ))}
          <Pagination
            page={data?.page ?? page}
            pages={data?.pages ?? 1}
            onChange={setPage}
          />
          <Button
            title="Clear filters"
            variant="ghost"
            size="sm"
            onPress={() => {
              setName("");
              setDeveloper("");
              setPage(1);
            }}
          />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: { flexDirection: "row", gap: 10 },
  list: { flex: 1, gap: 8 },
});
