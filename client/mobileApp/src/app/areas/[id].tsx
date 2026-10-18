import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import { areaApi, propertyApi } from "@/lib/api";
import { formatCurrency, formatNumber } from "@/lib/format";
import { useQuery } from "@/hooks/use-query";
import { useSearchStore } from "@/store/search-store";
import { useTheme } from "@/theme";
import { Badge, Button, Txt } from "@/components/ui/primitives";
import { PropertyCard } from "@/components/property/property-card";
import { PropertyMap } from "@/components/property/property-map";
import {
  Distribution,
  EmptyState,
  ErrorState,
  KeyValue,
  LoadingBlock,
  SectionCard,
  SectionHeading,
} from "@/components/ui/feedback";
import { Screen, ScreenHeader } from "@/components/ui/screen";

/** Area detail: market insights, the boundary on a map, and matching stock. */
export default function AreaDetailScreen() {
  const router = useRouter();
  const { id = "" } = useLocalSearchParams<{ id: string }>();
  const setFilters = useSearchStore((state) => state.setFilters);

  const detail = useQuery(id ? `get|/areas/${id}` : null, () =>
    areaApi.detail(id),
  );
  const insights = useQuery(id ? `get|/areas/${id}/insights` : null, () =>
    areaApi.insights(id),
  );
  const listings = useQuery(id ? `get|/areas/${id}/listings` : null, () =>
    propertyApi.search({ city: detail.data?.area?.city, limit: 12 }),
  );

  const area = detail.data?.area;

  return (
    <Screen scroll>
      <ScreenHeader
        title={area?.name ?? "Area"}
        subtitle={area?.city}
        onBack={() => router.back()}
      />

      {detail.isLoading ? <LoadingBlock /> : null}
      {detail.error ? (
        <ErrorState
          message={detail.error}
          onRetry={() => void detail.refetch()}
        />
      ) : null}

      {area ? (
        <>
          <SectionCard title="Market insights">
            {insights.isLoading ? (
              <LoadingBlock />
            ) : insights.error ? (
              <Txt variant="small" tone="muted">
                Insights are unavailable right now.
              </Txt>
            ) : (
              <>
                <View style={styles.statsRow}>
                  <Stat
                    label="Listings"
                    value={formatNumber(insights.data?.total)}
                  />
                  <Stat
                    label="Median price"
                    value={formatCurrency(
                      insights.data?.priceStats?.medianPrice,
                      undefined,
                      true,
                    )}
                  />
                  <Stat
                    label="Rating"
                    value={`${(insights.data?.rating?.average ?? 0).toFixed(1)} ★`}
                  />
                </View>
                <Txt variant="tiny" tone="muted" uppercase>
                  By purpose
                </Txt>
                <Distribution data={insights.data?.byPurpose ?? {}} />
                <Txt variant="tiny" tone="muted" uppercase>
                  By property type
                </Txt>
                <Distribution data={insights.data?.byType ?? {}} />
                <Txt variant="tiny" tone="muted" uppercase>
                  By bedrooms
                </Txt>
                <Distribution data={insights.data?.byBeds ?? {}} />
              </>
            )}
          </SectionCard>

          {area.boundary ? (
            <View style={{ gap: 10 }}>
              <Txt variant="heading">Boundary</Txt>
              <PropertyMap
                properties={[]}
                height={220}
                polygon={
                  area.boundary.coordinates?.[0] as
                    | [number, number][]
                    | undefined
                }
              />
            </View>
          ) : null}

          <View style={{ gap: 10 }}>
            <SectionHeading
              eyebrow={`Listings in ${area.city}`}
              title="Live stock"
              action={
                <Button
                  title="Search"
                  size="sm"
                  variant="outline"
                  onPress={() => {
                    setFilters({ city: area.city });
                    router.push("/");
                  }}
                />
              }
            />
            {listings.isLoading ? (
              <LoadingBlock />
            ) : (listings.data?.properties ?? []).length === 0 ? (
              <EmptyState
                icon="home-outline"
                title="No active listings here"
                description={`Nothing published in ${area.city} yet.`}
              />
            ) : (
              (listings.data?.properties ?? []).map((property) => (
                <PropertyCard key={property._id} property={property} />
              ))
            )}
          </View>

          <SectionCard title="Details">
            <KeyValue label="Area ID" value={area._id.slice(-8)} />
            <KeyValue label="City" value={area.city} />
            {area.boundary ? (
              <Badge tone="muted">
                {area.boundary.coordinates?.[0]?.length ?? 0}-point boundary
              </Badge>
            ) : null}
          </SectionCard>
        </>
      ) : null}
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.stat, { backgroundColor: theme.accent }]}>
      <Txt variant="tiny" tone="muted" uppercase numberOfLines={1}>
        {label}
      </Txt>
      <Txt variant="heading" numberOfLines={1}>
        {value}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: "row", gap: 8 },
  stat: { flex: 1, gap: 3, padding: 10, borderRadius: 10 },
});
