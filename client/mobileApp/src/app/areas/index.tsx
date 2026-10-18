import { useRouter } from "expo-router";
import * as React from "react";
import { StyleSheet, View } from "react-native";

import { areaApi } from "@/lib/api";
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
import { formatNumber } from "@/lib/format";

/** Neighbourhood directory — the mobile counterpart of the web areas list. */
export default function AreasScreen() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [city, setCity] = React.useState("");
  const [page, setPage] = React.useState(1);

  const { data, isLoading, error, refetch } = useQuery(
    `get|/areas|${name}|${city}|${page}`,
    () =>
      areaApi.list({
        name: name || undefined,
        city: city || undefined,
        page,
        limit: 20,
      }),
  );

  const areas = data?.areas ?? [];

  return (
    <Screen>
      <ScreenHeader
        title="Areas"
        subtitle={`${formatNumber(data?.total ?? 0)} neighbourhoods`}
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
            placeholder="Search by name"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Input
            value={city}
            onChangeText={(v) => {
              setCity(v);
              setPage(1);
            }}
            placeholder="City"
          />
        </View>
      </View>

      {isLoading ? (
        <LoadingBlock />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void refetch()} />
      ) : areas.length === 0 ? (
        <EmptyState
          icon="map-outline"
          title="No areas found"
          description="Areas are admin-managed reference data on the server."
        />
      ) : (
        <View style={styles.list}>
          {areas.map((area) => (
            <ListRow
              key={area._id}
              icon="map-outline"
              label={area.name}
              description={area.city}
              onPress={() => router.push(`/areas/${area._id}`)}
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
              setCity("");
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
