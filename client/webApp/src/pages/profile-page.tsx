import {
  GlobeIcon,
  SaveIcon,
  StarIcon,
  Trash2Icon,
  UserIcon,
} from "lucide-react";
import * as React from "react";

import {
  EmptyState,
  ErrorState,
  LoadingBlock,
  RatingStars,
} from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMutation } from "@/hooks/use-mutation";
import { useResettableState } from "@/hooks/use-resettable-state";
import { useQuery } from "@/hooks/use-query";
import { profileApi, reviewApi } from "@/lib/api";
import { CURRENCIES, LOCALES } from "@/lib/constants";
import { formatRelative, initials } from "@/lib/format";
import { ROLE_LABELS } from "@/lib/roles";
import { useAuthStore } from "@/store/auth-store";

const TARGET_LABELS: Record<string, string> = {
  building: "Building",
  area: "Area",
  agent: "Agent",
};

export function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, error, refetch } = useQuery("get|/profiles/me", () =>
    profileApi.me(),
  );

  const [form, setForm] = useResettableState(
    () => ({
      name: data?.profile?.name ?? "",
      avatar: data?.profile?.avatar ?? "",
      bio: data?.profile?.bio ?? "",
      agencyId: data?.profile?.agencyId ?? "",
    }),
    data?.profile?._id ?? "empty",
  );

  const [prefs, setPrefs] = React.useState({
    locale: user?.locale ?? "en",
    currency: user?.currency ?? "INR",
  });

  const saveProfile = useMutation({
    mutationFn: () => profileApi.update(form),
    successMessage: "Profile saved",
  });

  const savePreferences = useMutation({
    mutationFn: () => profileApi.updatePreferences(prefs),
    successMessage: "Preferences saved",
    onSuccess: () => {
      const user = useAuthStore.getState().user;
      useAuthStore.setState({
        user: user ? { ...user, ...prefs } : user,
      });
    },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl leading-none font-medium tracking-tight">
          Profile & preferences
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Your public profile appears on the listings and enquiries you create.
        </p>
      </header>

      {isLoading && <LoadingBlock />}
      {error && <ErrorState message={error} onRetry={() => void refetch()} />}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="gap-5 p-6">
          <h2 className="font-display flex items-center gap-2 text-lg font-medium">
            <UserIcon className="text-primary size-4" />
            Your details
          </h2>

          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              <AvatarImage src={form.avatar || undefined} alt="" />
              <AvatarFallback className="bg-accent text-accent-foreground">
                {initials(form.name || user?.email)}
              </AvatarFallback>
            </Avatar>
            <p className="text-muted-foreground text-sm">
              Paste an image URL below to set your avatar.
            </p>
          </div>

          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              saveProfile.mutate();
            }}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Display name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(event) =>
                    setForm((c) => ({ ...c, name: event.target.value }))
                  }
                  placeholder="Asha Menon"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agency">Agency ID</Label>
                <Input
                  id="agency"
                  value={form.agencyId}
                  onChange={(event) =>
                    setForm((c) => ({ ...c, agencyId: event.target.value }))
                  }
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatar">Avatar URL</Label>
              <Input
                id="avatar"
                type="url"
                value={form.avatar}
                onChange={(event) =>
                  setForm((c) => ({ ...c, avatar: event.target.value }))
                }
                placeholder="https://…"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                rows={4}
                value={form.bio}
                onChange={(event) =>
                  setForm((c) => ({ ...c, bio: event.target.value }))
                }
                placeholder="Where you work, what you look after in a property…"
              />
            </div>

            <Button type="submit" disabled={saveProfile.isPending}>
              <SaveIcon />
              {saveProfile.isPending ? "Saving…" : "Save profile"}
            </Button>
          </form>
        </Card>

        <div className="space-y-6">
          <Card className="gap-5 p-6">
            <h2 className="font-display flex items-center gap-2 text-lg font-medium">
              <GlobeIcon className="text-primary size-4" />
              Locale & currency
            </h2>

            <div className="space-y-2">
              <Label>Language</Label>
              <Select
                value={prefs.locale}
                onValueChange={(value) =>
                  setPrefs((c) => ({ ...c, locale: value }))
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

            <div className="space-y-2">
              <Label>Currency</Label>
              <Select
                value={prefs.currency}
                onValueChange={(value) =>
                  setPrefs((c) => ({ ...c, currency: value }))
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
              variant="outline"
              className="w-full"
              disabled={savePreferences.isPending}
              onClick={() => savePreferences.mutate()}
            >
              {savePreferences.isPending ? "Saving…" : "Save preferences"}
            </Button>
          </Card>

          <Card className="gap-2 p-6">
            <p className="text-muted-foreground text-xs tracking-wider uppercase">
              Account
            </p>
            <p className="truncate text-sm font-medium">{user?.email}</p>
            <Badge variant="muted" className="w-fit">
              {user ? ROLE_LABELS[user.role] : ""}
            </Badge>
            <p className="text-muted-foreground text-xs">
              {user?.verified
                ? "Your account is verified."
                : "Verify with an email code from the sign-in page."}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function ReviewsPage() {
  const { data, isLoading, error, refetch } = useQuery(
    "get|/reviews|page=mine",
    () => reviewApi.mine(),
  );

  const remove = useMutation({
    mutationFn: (id: string) => reviewApi.remove(id),
    successMessage: "Review deleted",
    onSuccess: () => refetch(),
  });

  const reviews = data?.reviews ?? [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl leading-none font-medium tracking-tight">
          My reviews
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Reviews are upserted on the target, so reviewing twice edits your
          earlier one.
        </p>
      </header>

      {isLoading && <LoadingBlock />}
      {error && <ErrorState message={error} onRetry={() => void refetch()} />}

      {!isLoading && !error && reviews.length === 0 && (
        <EmptyState
          icon={StarIcon}
          title="You have not written any reviews"
          description="Open a listing in a building you know and share what it was like."
        />
      )}

      <ul className="space-y-3">
        {reviews.map((review) => (
          <Card key={review._id} className="gap-3 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <RatingStars value={review.rating} />
                <Badge variant="muted">
                  {TARGET_LABELS[review.targetType] ?? review.targetType}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Delete review"
                className="text-destructive hover:bg-destructive/10"
                disabled={remove.isPending}
                onClick={() => remove.mutate(review._id)}
              >
                <Trash2Icon />
              </Button>
            </div>
            {review.body && (
              <p className="text-sm leading-relaxed">{review.body}</p>
            )}
            <p className="text-muted-foreground text-xs">
              {formatRelative(review.createdAt)} ·{" "}
              <span className="font-mono">{review.targetId}</span>
            </p>
          </Card>
        ))}
      </ul>
    </div>
  );
}
