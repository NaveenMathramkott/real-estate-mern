import {
  BadgeCheckIcon,
  MailIcon,
  PhoneIcon,
  ShieldAlertIcon,
  UserCogIcon,
  UsersIcon,
} from "lucide-react";
import * as React from "react";

import {
  EmptyState,
  ErrorState,
  KeyValue,
  LoadingBlock,
  PageHeader,
  Panel,
} from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation } from "@/hooks/use-mutation";
import { useQuery } from "@/hooks/use-query";
import { apiCache } from "@/lib/api-client";
import { dashboardApi } from "@/lib/api";
import { formatRelative, initials } from "@/lib/format";
import { pick, pickList } from "@/lib/safe";
import type { AdminDashboard, User } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function UsersPage() {
  const [search, setSearch] = React.useState("");
  const [selected, setSelected] = React.useState<User | null>(null);

  const { data, error, isLoading, refetch } = useQuery<AdminDashboard>(
    "get|/dashboard/admin|",
    dashboardApi.admin,
  );

  const verify = useMutation({
    mutationFn: ({ id, verified }: { id: string; verified: boolean }) =>
      dashboardApi.verifyUser(id, verified),
    successMessage: "Verification updated",
    invalidate: () => {
      apiCache.invalidate("get|/dashboard", "get|/auth/me");
      void refetch();
    },
  });

  if (isLoading) return <LoadingBlock />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!data) return null;

  const term = search.trim().toLowerCase();
  const filter = (list: User[]) =>
    term
      ? list.filter((u) =>
          [u.email, u.role, u.phone].some((v) =>
            (v ?? "").toLowerCase().includes(term),
          ),
        )
      : list;

  const verifiedUsers = filter(
    pickList<User>(data, "verified", "users", "sample"),
  );
  const unverifiedUsers = filter(
    pickList<User>(data, "unverified", "users", "sample"),
  );

  const total = pick<number>(data, "summary", "totalUsers") ?? 0;
  const verifiedCount = pick<number>(data, "summary", "verifiedUsers") ?? 0;
  const unverifiedCount = pick<number>(data, "summary", "unverifiedUsers") ?? 0;
  const rate = total ? Math.round((verifiedCount / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Verification control for every account on the platform."
        actions={
          <Badge variant="outline" className="h-9 px-3">
            <BadgeCheckIcon className="size-3.5 text-success" />
            {rate}% verified · {unverifiedCount} pending
          </Badge>
        }
      />

      <Panel>
        <Tabs defaultValue="pending">
          <div className="flex flex-col gap-4 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <TabsList>
              <TabsTrigger value="pending">
                Pending
                <Badge variant="warning" className="ml-1">
                  {unverifiedCount}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="approved">
                Verified
                <Badge variant="success" className="ml-1">
                  {verifiedCount}
                </Badge>
              </TabsTrigger>
            </TabsList>
            <div className="relative sm:w-64">
              <UsersIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Filter by email, role or phone"
                className="pl-9"
              />
            </div>
          </div>
          <TabsContent value="pending" className="mt-0">
            <UserTable
              users={unverifiedUsers}
              loading={verify.isPending}
              onVerify={(user, next) =>
                verify.mutate({ id: user._id, verified: next })
              }
              onInspect={setSelected}
            />
          </TabsContent>
          <TabsContent value="approved" className="mt-0">
            <UserTable
              users={verifiedUsers}
              loading={verify.isPending}
              onVerify={(user, next) =>
                verify.mutate({ id: user._id, verified: next })
              }
              onInspect={setSelected}
            />
          </TabsContent>
        </Tabs>
      </Panel>

      <UserDetailDialog
        user={selected}
        onClose={() => setSelected(null)}
        loading={verify.isPending}
        onVerify={(next) => {
          if (!selected) return;
          verify.mutate({ id: selected._id, verified: next });
          setSelected({ ...selected, verified: next });
        }}
      />
    </div>
  );
}

function UserTable({
  users,
  onVerify,
  onInspect,
  loading,
}: {
  users: User[];
  onVerify: (user: User, next: boolean) => void;
  onInspect: (user: User) => void;
  loading: boolean;
}) {
  if (users.length === 0) {
    return (
      <EmptyState
        icon={ShieldAlertIcon}
        title="Nothing in this queue"
        description="Accounts will appear here as soon as they register and need review."
      />
    );
  }

  return (
    <ul className="divide-border divide-y">
      {users.map((user) => (
        <li
          key={user._id}
          className="hover:bg-accent/40 flex flex-col gap-3 px-5 py-4 transition-colors sm:flex-row sm:items-center"
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                user.verified
                  ? "bg-success/15 text-success"
                  : "bg-warning/15 text-warning",
              )}
            >
              {initials(user.email)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.email}</p>
              <p className="text-muted-foreground truncate text-xs">
                {user.phone ?? "No phone"} · joined{" "}
                {formatRelative(user.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant={user.role === "admin" ? "default" : "secondary"}
              className="capitalize"
            >
              {user.role}
            </Badge>
            <Badge variant={user.verified ? "success" : "warning"}>
              {user.verified ? "Verified" : "Pending"}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onInspect(user)}>
              <UserCogIcon className="size-4" />
              Details
            </Button>
            <Button
              size="sm"
              variant={user.verified ? "outline" : "default"}
              disabled={loading}
              onClick={() => onVerify(user, !user.verified)}
            >
              {user.verified ? "Revoke" : "Verify"}
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function UserDetailDialog({
  user,
  onClose,
  onVerify,
  loading,
}: {
  user: User | null;
  onClose: () => void;
  onVerify: (next: boolean) => void;
  loading: boolean;
}) {
  return (
    <Dialog open={Boolean(user)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Account details</DialogTitle>
          <DialogDescription>
            Verification changes take effect immediately across the API.
          </DialogDescription>
        </DialogHeader>

        {user && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 text-primary flex size-14 items-center justify-center rounded-full text-lg font-semibold">
                {initials(user.email)}
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium">{user.email}</p>
                <p className="text-muted-foreground text-sm capitalize">
                  {user.role}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <KeyValue label="Email">
                <span className="flex items-center gap-1.5">
                  <MailIcon className="text-muted-foreground size-3.5" />
                  {user.email}
                </span>
              </KeyValue>
              <KeyValue label="Phone">
                <span className="flex items-center gap-1.5">
                  <PhoneIcon className="text-muted-foreground size-3.5" />
                  {user.phone ?? "—"}
                </span>
              </KeyValue>
              <KeyValue label="Locale">{user.locale ?? "en"}</KeyValue>
              <KeyValue label="Currency">{user.currency ?? "INR"}</KeyValue>
              <KeyValue label="User ID">
                <span className="font-mono text-xs">{user._id}</span>
              </KeyValue>
              <KeyValue label="Status">
                {user.verified ? (
                  <Badge variant="success">Verified</Badge>
                ) : (
                  <Badge variant="warning">Unverified</Badge>
                )}
              </KeyValue>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {user && (
            <Button
              variant={user.verified ? "destructive" : "default"}
              disabled={loading}
              onClick={() => onVerify(!user.verified)}
            >
              {user.verified ? "Revoke verification" : "Verify account"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
