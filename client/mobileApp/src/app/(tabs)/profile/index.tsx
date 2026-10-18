import { useRouter } from "expo-router";
import * as React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { CURRENCIES, LOCALES } from "@/lib/constants";
import { dashboardApi, profileApi } from "@/lib/api";
import { formatCurrency, formatNumber } from "@/lib/format";
import { capabilitiesFor, LISTER_ROLES, ROLE_LABELS } from "@/lib/roles";
import { useMutation } from "@/hooks/use-mutation";
import { useQuery } from "@/hooks/use-query";
import { useAuthStore } from "@/store/auth-store";
import { useTheme } from "@/theme";
import { Avatar, Badge, Button, Txt } from "@/components/ui/primitives";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { KeyValue, ListRow, SectionCard } from "@/components/ui/feedback";
import { Screen, ScreenHeader } from "@/components/ui/screen";

/**
 * The Profile tab: who you are, what your role can do, and every destination
 * the app exposes. Consumers and listers get different sections here, which is
 * where the role model becomes visible in the navigation.
 */
export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const user = useAuthStore((state) => state.user)!;
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);

  const caps = capabilitiesFor(user.role);
  const isLister = LISTER_ROLES.includes(user.role);

  const dashboard = useQuery("get|/dashboard|profile", () =>
    dashboardApi.generic(),
  );
  const profile = useQuery("get|/profiles/me", () => profileApi.me());

  const [name, setName] = React.useState("");
  const [avatar, setAvatar] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [agencyId, setAgencyId] = React.useState("");
  const [locale, setLocale] = React.useState(user.locale ?? "en");
  const [currency, setCurrency] = React.useState(user.currency ?? "INR");

  // Seed the form once per profile so typing is never clobbered by a refetch.
  const seeded = React.useRef(false);
  React.useEffect(() => {
    if (!profile.data?.profile || seeded.current) return;
    seeded.current = true;
    setName(profile.data.profile.name ?? "");
    setAvatar(profile.data.profile.avatar ?? "");
    setBio(profile.data.profile.bio ?? "");
    setAgencyId(profile.data.profile.agencyId ?? "");
  }, [profile.data?.profile]);

  const saveProfile = useMutation({
    mutationFn: () =>
      profileApi.update({
        name: name.trim() || undefined,
        avatar: avatar.trim() || undefined,
        bio: bio.trim() || undefined,
        agencyId: agencyId.trim() || undefined,
      }),
    successMessage: "Profile saved",
  });

  const savePreferences = useMutation({
    mutationFn: () => profileApi.updatePreferences({ locale, currency }),
    successMessage: "Preferences saved",
    onSuccess: () => setUser({ ...user, locale, currency }),
  });

  const summary = dashboard.data?.summary as Record<string, number> | undefined;

  return (
    <Screen scroll>
      <ScreenHeader title="Profile" subtitle={ROLE_LABELS[user.role]} />

      <View
        style={[
          styles.identity,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <Avatar name={user.email} uri={avatar || undefined} size={56} />
        <View style={{ flex: 1, gap: 4 }}>
          <Txt variant="heading" numberOfLines={1}>
            {name || user.email}
          </Txt>
          <Badge tone="primary">{ROLE_LABELS[user.role]}</Badge>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open dashboard"
          onPress={() => router.push("/dashboard")}
          hitSlop={8}
        >
          <Txt variant="title" style={{ color: theme.primary }}>
            ›
          </Txt>
        </Pressable>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push("/dashboard")}
        style={[styles.dashboardCta, { backgroundColor: theme.primary }]}
      >
        <View style={{ flex: 1 }}>
          <Txt variant="subheading" style={{ color: "#FFFFFF" }}>
            {isLister
              ? "Your portfolio at a glance"
              : "Pick up where you left off"}
          </Txt>
          <Txt variant="tiny" style={{ color: "#D6F0E5" }}>
            {isLister
              ? "Portfolio value, lead pipeline and price changes"
              : "Shortlist value, saved searches and recent enquiries"}
          </Txt>
        </View>
        <Txt variant="subheading" style={{ color: "#FFFFFF" }}>
          ›
        </Txt>
      </Pressable>

      {isLister && summary ? (
        <View style={styles.tiles}>
          <Tile
            label={user.role === "landlord" ? "Properties" : "Listings"}
            value={formatNumber(summary.totalListings ?? 0)}
          />
          <Tile
            label="Portfolio"
            value={formatCurrency(summary.portfolioValue, user.currency, true)}
          />
          <Tile
            label="Open leads"
            value={formatNumber(summary.newInquiries ?? 0)}
          />
        </View>
      ) : null}

      {/* ------------------------------------------------ role-specific nav */}
      {caps.canManageListings ? (
        <SectionCard title="Your listings">
          <ListRow
            icon="add-circle-outline"
            label="Create a listing"
            description="Publish stock as an agent or landlord"
            onPress={() => router.push("/listings/new")}
          />
          <ListRow
            icon="briefcase-outline"
            label="My listings"
            value={
              summary ? formatNumber(summary.totalListings ?? 0) : undefined
            }
            description="Edit status, price and media"
            onPress={() => router.push("/listings")}
          />
          <ListRow
            icon="mail-unread-outline"
            label="Enquiries"
            value={
              summary ? formatNumber(summary.newInquiries ?? 0) : undefined
            }
            description="Leads addressed to you"
            onPress={() => router.push("/inquiries")}
          />
        </SectionCard>
      ) : (
        <SectionCard title="Your activity">
          <ListRow
            icon="heart-outline"
            label="Shortlist"
            value={summary ? formatNumber(summary.favorites ?? 0) : undefined}
            description="Listings you saved"
            onPress={() => router.push("/saved")}
          />
          <ListRow
            icon="bookmark-outline"
            label="Saved searches"
            value={
              summary ? formatNumber(summary.savedSearches ?? 0) : undefined
            }
            onPress={() => router.push("/saved-searches")}
          />
          <ListRow
            icon="chatbubbles-outline"
            label="Messages"
            description="Threads with agents and owners"
            onPress={() => router.push("/chats")}
          />
          <ListRow
            icon="star-outline"
            label="My reviews"
            onPress={() => router.push("/reviews")}
          />
        </SectionCard>
      )}

      <SectionCard title="Activity">
        <ListRow
          icon="notifications-outline"
          label="Notifications"
          description="Messages, enquiries and price drops"
          onPress={() => router.push("/notifications")}
        />
      </SectionCard>

      <SectionCard title="Marketplace">
        <ListRow
          icon="map-outline"
          label="Areas"
          description="Neighbourhoods with market insights"
          onPress={() => router.push("/areas")}
        />
        <ListRow
          icon="business-outline"
          label="Buildings"
          description="Buildings with resident reviews"
          onPress={() => router.push("/buildings")}
        />
        <ListRow
          icon="briefcase-outline"
          label="Agencies"
          description="Verified brokerages and their members"
          onPress={() => router.push("/agencies")}
        />
      </SectionCard>

      {/* ------------------------------------------------ editable profile */}
      <SectionCard title="Public details">
        <Txt variant="tiny" tone="muted">
          Anyone opening your public profile sees exactly these fields.
        </Txt>
        <Field label="Display name">
          <Input value={name} onChangeText={setName} placeholder="Agent One" />
        </Field>
        <Field
          label="Avatar URL"
          hint="A hosted image; initials are used otherwise."
        >
          <Input
            value={avatar}
            onChangeText={setAvatar}
            autoCapitalize="none"
            placeholder="https://…"
          />
        </Field>
        <Field label="Bio">
          <Textarea
            value={bio}
            onChangeText={setBio}
            placeholder="Eight years in Connaught Place, two hundred leases closed."
          />
        </Field>
        {isLister ? (
          <Field
            label="Agency ID"
            hint="Leave blank if you are not attached to an agency."
          >
            <Input
              value={agencyId}
              onChangeText={setAgencyId}
              autoCapitalize="none"
            />
          </Field>
        ) : null}
        <Button
          title="Save profile"
          onPress={() => void saveProfile.mutateAsync().catch(() => undefined)}
          loading={saveProfile.isPending}
          fullWidth
        />
        {profile.error ? (
          <Txt variant="tiny" tone="destructive">
            Could not load your profile — the form shows a blank slate.
          </Txt>
        ) : null}
      </SectionCard>

      <SectionCard title="Preferences">
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Select
              label="Language"
              value={locale}
              onSelect={setLocale}
              options={LOCALES.map((value) => ({
                value,
                label: value.toUpperCase(),
              }))}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Select
              label="Currency"
              value={currency}
              onSelect={setCurrency}
              options={CURRENCIES.map((value) => ({ value, label: value }))}
            />
          </View>
        </View>
        <Button
          title="Save preferences"
          variant="outline"
          onPress={() =>
            void savePreferences.mutateAsync().catch(() => undefined)
          }
          loading={savePreferences.isPending}
          fullWidth
        />
      </SectionCard>

      <SectionCard title="Account">
        <KeyValue label="Email" value={user.email} />
        <KeyValue label="Role" value={ROLE_LABELS[user.role]} />
        <KeyValue label="Verified" value={user.verified ? "Yes" : "Not yet"} />
      </SectionCard>

      <Button
        title="Sign out"
        variant="outline"
        onPress={() => void logout()}
        fullWidth
      />
    </Screen>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.tile, { backgroundColor: theme.accent }]}>
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
  identity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dashboardCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 14,
  },
  tiles: { flexDirection: "row", gap: 8 },
  tile: { flex: 1, gap: 4, padding: 10, borderRadius: 10 },
  row: { flexDirection: "row", gap: 12 },
});
