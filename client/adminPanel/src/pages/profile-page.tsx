import {
  Building2Icon,
  GlobeIcon,
  MoonIcon,
  SaveIcon,
  SunIcon,
  UserRoundIcon,
} from "lucide-react";
import * as React from "react";

import { KeyValue, LoadingBlock, PageHeader, Panel } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@/hooks/use-mutation";
import { useQuery } from "@/hooks/use-query";
import { API_BASE_URL } from "@/lib/api-client";
import { queryStore } from "@/lib/query-store";
import { authApi, profileApi } from "@/lib/api";
import { CURRENCIES, LOCALES } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { pick } from "@/lib/safe";
import type { Profile, User } from "@/lib/types";
import { useAuthStore } from "@/store/auth-store";
import { useUiStore } from "@/store/ui-store";

type ProfileFormProps = {
  profile: Profile | undefined;
  onSaved: (profile: Profile | undefined) => void;
};

function ProfileForm({ profile, onSaved }: ProfileFormProps) {
  const [draft, setDraft] = React.useState(() => ({
    name: profile?.name ?? "",
    avatar: profile?.avatar ?? "",
    bio: profile?.bio ?? "",
    agencyId: profile?.agencyId ?? "",
  }));

  const save = useMutation({
    mutationFn: () =>
      profileApi.update({
        name: draft.name || undefined,
        avatar: draft.avatar || undefined,
        bio: draft.bio || undefined,
        agencyId: draft.agencyId || undefined,
      }),
    successMessage: "Profile updated",
    // Reflect the saved values immediately, then refresh in the background.
    onSuccess: (data) => {
      onSaved(pick<Profile>(data, "profile") ?? profile ?? undefined);
    },
    invalidate: () => queryStore.invalidate("get|/profiles"),
  });

  return (
    <Panel
      title="Profile details"
      description="Upserted on save, so this works even if registration created no profile."
    >
      <div className="grid gap-4 p-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Display name</Label>
          <Input
            value={draft.name}
            onChange={(event) =>
              setDraft((p) => ({ ...p, name: event.target.value }))
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label>Avatar URL</Label>
          <Input
            value={draft.avatar}
            onChange={(event) =>
              setDraft((p) => ({ ...p, avatar: event.target.value }))
            }
            placeholder="https://…"
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Agency ID</Label>
          <Input
            value={draft.agencyId}
            onChange={(event) =>
              setDraft((p) => ({ ...p, agencyId: event.target.value }))
            }
            placeholder="Optional — links your profile to an agency"
            className="font-mono text-xs"
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Bio</Label>
          <Textarea
            rows={4}
            value={draft.bio}
            onChange={(event) =>
              setDraft((p) => ({ ...p, bio: event.target.value }))
            }
            placeholder="Tell buyers and agents about your background."
          />
        </div>
      </div>
      <div className="flex items-center justify-between border-t px-5 py-4">
        <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <Building2Icon className="size-3.5" />
          Profiles are unique per user.
        </p>
        <Button
          onClick={() => void save.mutateAsync()}
          disabled={save.isPending}
        >
          <SaveIcon className="size-4" />
          Save profile
        </Button>
      </div>
    </Panel>
  );
}

function PreferencesForm({ user }: { user: User }) {
  const [prefs, setPrefs] = React.useState(() => ({
    locale: user.locale ?? "en",
    currency: user.currency ?? "INR",
  }));

  const setUser = useAuthStore((state) => state.setUser);

  const save = useMutation({
    mutationFn: () => profileApi.updatePreferences(prefs),
    successMessage: "Preferences saved",
    onSuccess: (data) => {
      const updated = pick<User>(data, "user");
      if (updated) setUser(updated);
    },
    invalidate: () => queryStore.invalidate("get|/auth/me"),
  });

  return (
    <Panel title="Preferences">
      <div className="space-y-4 p-5">
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            <GlobeIcon className="size-3.5" />
            Locale
          </Label>
          <Select
            value={prefs.locale}
            onValueChange={(value) =>
              setPrefs((prev) => ({ ...prev, locale: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LOCALES.map((locale) => (
                <SelectItem key={locale} value={locale}>
                  {locale}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Currency</Label>
          <Select
            value={prefs.currency}
            onValueChange={(value) =>
              setPrefs((prev) => ({ ...prev, currency: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((currency) => (
                <SelectItem key={currency} value={currency}>
                  {currency}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          className="w-full"
          variant="outline"
          disabled={save.isPending}
          onClick={() => void save.mutateAsync()}
        >
          Save preferences
        </Button>
      </div>
    </Panel>
  );
}

function AppearanceCard() {
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);

  return (
    <Panel title="Appearance">
      <div className="space-y-3 p-5">
        <p className="text-muted-foreground text-sm">
          Appearance is stored locally and applied instantly.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { value: "light", label: "Light", icon: SunIcon },
              { value: "dark", label: "Dark", icon: MoonIcon },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setTheme(option.value)}
              className={`flex flex-col items-center gap-2 rounded-lg border p-4 text-sm font-medium transition-colors ${
                theme === option.value
                  ? "border-primary bg-primary/5 text-primary"
                  : "hover:bg-accent"
              }`}
            >
              <option.icon className="size-5" />
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </Panel>
  );
}

export default function ProfilePage() {
  const profile = useQuery<{ profile: Profile }>("get|/profiles/me|", () =>
    profileApi.me(),
  );
  const account = useQuery<{ user: User }>("get|/auth/me|", authApi.me);
  const user = account.data?.user;

  if (
    (profile.isLoading && !profile.data) ||
    (account.isLoading && !account.data)
  ) {
    return <LoadingBlock />;
  }

  // Neither endpoint can render without an account; surface the failure rather
  // than leaving the user on an empty shell.
  if (account.error) {
    return (
      <Panel title="Session unavailable">
        <div className="space-y-4 p-5">
          <p className="text-muted-foreground text-sm">{account.error}</p>
          <Button variant="outline" onClick={() => void account.refetch()}>
            Retry
          </Button>
        </div>
      </Panel>
    );
  }

  const current = profile.data?.profile;
  const avatar = current?.avatar;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My profile"
        description="The profile record linked to your account, plus locale and currency preferences."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Account" className="lg:col-span-1">
          <div className="space-y-5 p-5">
            <div className="flex items-center gap-3">
              {avatar ? (
                <img
                  src={avatar}
                  alt=""
                  className="size-14 rounded-full border object-cover"
                />
              ) : (
                <div className="bg-primary/10 text-primary flex size-14 items-center justify-center rounded-full">
                  <UserRoundIcon className="size-6" />
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {current?.name ?? "No name"}
                </p>
                <p className="text-muted-foreground truncate text-sm">
                  {user?.email}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <KeyValue label="Role">
                <Badge variant="default" className="capitalize">
                  {user?.role}
                </Badge>
              </KeyValue>
              <KeyValue label="Verification">
                {user?.verified ? (
                  <Badge variant="success">Verified</Badge>
                ) : (
                  <Badge variant="warning">Unverified</Badge>
                )}
              </KeyValue>
              <KeyValue label="Phone">{user?.phone ?? "—"}</KeyValue>
              <KeyValue label="User ID">
                <span className="font-mono text-xs">{user?._id}</span>
              </KeyValue>
              <KeyValue label="Member since">
                {formatDateTime(user?.createdAt)}
              </KeyValue>
            </div>
          </div>
        </Panel>

        <div className="space-y-4 lg:col-span-2">
          <ProfileForm
            key={current?._id ?? "new-profile"}
            profile={current}
            onSaved={(saved) => {
              if (saved) profile.setData({ profile: saved });
            }}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            {user && (
              <PreferencesForm
                key={`${user._id}-${user.locale}-${user.currency}`}
                user={user}
              />
            )}
            <AppearanceCard />
          </div>
        </div>
      </div>

      <Panel title="Session">
        <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-sm">
            Connected to{" "}
            <code className="font-mono text-xs">{API_BASE_URL}</code>. Tokens
            are stored in an httpOnly cookie pair plus a bearer token used for
            silent refresh.
          </p>
          <Button variant="outline" onClick={() => void authApi.health()}>
            Ping health endpoint
          </Button>
        </div>
      </Panel>
    </div>
  );
}
