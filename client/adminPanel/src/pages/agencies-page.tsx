import {
  LandmarkIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  UsersIcon,
} from "lucide-react";
import * as React from "react";

import {
  EmptyState,
  ErrorState,
  LoadingBlock,
  PageHeader,
  Panel,
} from "@/components/common";
import {
  ConfirmDialog,
  Pagination,
  VerifyToggle,
} from "@/features/shared/widgets";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation } from "@/hooks/use-mutation";
import { useQuery } from "@/hooks/use-query";
import { queryStore } from "@/lib/query-store";
import { formKey } from "@/lib/utils";
import { agencyApi, dashboardApi } from "@/lib/api";
import { formatShortDate } from "@/lib/format";
import { pick, pickList, pickPagination } from "@/lib/safe";
import type { Agency } from "@/lib/types";

type ListResponse = {
  agencies: Agency[];
  page: number;
  pages: number;
  total: number;
};

type AgencyMember = {
  _id: string;
  name?: string;
  avatar?: string;
  userId: string;
};

export default function AgenciesPage() {
  const [page, setPage] = React.useState(1);
  const [verified, setVerified] = React.useState<"all" | "yes" | "no">("all");
  const [editing, setEditing] = React.useState<Agency | "new" | null>(null);
  const [detailFor, setDetailFor] = React.useState<Agency | null>(null);

  const params = {
    page,
    limit: 20,
    verified: verified === "all" ? undefined : verified === "yes",
  };
  const { data, error, isLoading, refetch } = useQuery<ListResponse>(
    `get|/agencies|${JSON.stringify(params)}`,
    () => agencyApi.list(params),
  );

  const invalidate = () => {
    queryStore.invalidate("get|/agencies", "get|/dashboard");
  };

  const verify = useMutation({
    mutationFn: ({ id, next }: { id: string; next: boolean }) =>
      dashboardApi.verifyAgency(id, next),
    successMessage: "Agency verification updated",
    invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => agencyApi.remove(id),
    successMessage: "Agency deleted",
    invalidate,
  });

  const agencies = pickList<Agency>(data, "agencies");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agencies"
        description="Brokerage firms and their verification status."
        actions={
          <Button onClick={() => setEditing("new")}>
            <PlusIcon className="size-4" />
            New agency
          </Button>
        }
      />

      <Panel>
        <div className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-sm">
            Admin-only CRUD. Profiles reference an agency, so deletion is
            blocked with 409 while members exist.
          </p>
          <Select
            value={verified}
            onValueChange={(value) => {
              setVerified(value as typeof verified);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All agencies</SelectItem>
              <SelectItem value="yes">Verified only</SelectItem>
              <SelectItem value="no">Unverified only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : isLoading && !data ? (
          <LoadingBlock />
        ) : agencies.length === 0 ? (
          <EmptyState
            icon={LandmarkIcon}
            title="No agencies registered"
            description="Create the first brokerage to group agents under a firm."
            action={
              <Button onClick={() => setEditing("new")}>
                <PlusIcon className="size-4" />
                Create an agency
              </Button>
            }
          />
        ) : (
          <ul className="divide-border divide-y">
            {agencies.map((agency) => (
              <li
                key={agency._id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center"
              >
                {agency.logo ? (
                  <img
                    src={agency.logo}
                    alt={agency.name}
                    className="size-9 shrink-0 rounded-lg border object-cover"
                  />
                ) : (
                  <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
                    <LandmarkIcon className="size-4" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{agency.name}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {agency.licenseNo ?? "No licence number"} · created{" "}
                    {formatShortDate(agency.createdAt)}
                    {agency.memberCount !== undefined &&
                      ` · ${agency.memberCount} members`}
                  </p>
                </div>
                <VerifyToggle
                  verified={agency.verified}
                  disabled={verify.isPending}
                  onChange={(next) => verify.mutate({ id: agency._id, next })}
                />
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDetailFor(agency)}
                  >
                    <UsersIcon className="size-4" />
                    Members
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing(agency)}
                  >
                    <PencilIcon className="size-4" />
                    Edit
                  </Button>
                  <ConfirmDialog
                    title={`Delete ${agency.name}?`}
                    description="Deletion is blocked with 409 while member profiles still reference this agency."
                    confirmLabel="Delete"
                    onConfirm={() => remove.mutate(agency._id)}
                    trigger={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={remove.isPending}
                      >
                        <Trash2Icon className="size-4" />
                      </Button>
                    }
                  />
                </div>
              </li>
            ))}
          </ul>
        )}

        <Pagination {...pickPagination(data)} onChange={setPage} />
      </Panel>

      {/* Keyed on the selected record so the form remounts with its values. */}
      <AgencyDialog
        key={formKey(editing)}
        state={editing}
        onClose={() => setEditing(null)}
        onSaved={invalidate}
      />
      <AgencyDetailDialog
        agency={detailFor}
        onClose={() => setDetailFor(null)}
      />
    </div>
  );
}

function AgencyDetailDialog({
  agency,
  onClose,
}: {
  agency: Agency | null;
  onClose: () => void;
}) {
  const { data, isLoading, error } = useQuery<{
    agency: Agency;
    members: AgencyMember[];
  }>(
    agency ? `get|/agencies/${agency._id}|` : null,
    () => agencyApi.detail(agency?._id ?? ""),
    { enabled: Boolean(agency) },
  );

  const detail = pick<Agency>(data, "agency") ?? agency;
  const members = pickList<AgencyMember>(data, "members");

  return (
    <Dialog open={Boolean(agency)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{detail?.name ?? agency?.name}</DialogTitle>
          <DialogDescription>
            Agency detail with the member profiles attached to it.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <LoadingBlock className="py-10" />
        ) : error ? (
          <ErrorState message={error} />
        ) : (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <p className="text-muted-foreground text-xs uppercase">
                  Licence number
                </p>
                <p className="font-mono text-xs">
                  {detail?.licenseNo ?? "Not recorded"}
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="text-muted-foreground text-xs uppercase">
                  Verification
                </p>
                <p className="text-sm font-medium">
                  {detail?.verified ? "Verified" : "Unverified"}
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="text-muted-foreground text-xs uppercase">
                  Created
                </p>
                <p className="text-sm font-medium">
                  {formatShortDate(detail?.createdAt)}
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="text-muted-foreground text-xs uppercase">
                  Members
                </p>
                <p className="text-sm font-medium tabular-nums">
                  {members.length}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-muted-foreground text-xs uppercase">
                Member profiles
              </p>
              {members.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No profiles reference this agency yet.
                </p>
              ) : (
                <ul className="divide-border divide-y rounded-lg border">
                  {members.map((member) => (
                    <li
                      key={member._id}
                      className="flex items-center gap-3 px-3 py-2.5"
                    >
                      {member.avatar ? (
                        <img
                          src={member.avatar}
                          alt={member.name ?? "Member"}
                          className="size-8 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full">
                          <UsersIcon className="size-3.5" />
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {member.name ?? "Unnamed profile"}
                        </p>
                        <p className="text-muted-foreground truncate font-mono text-xs">
                          {String(member.userId)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AgencyDialog({
  state,
  onClose,
  onSaved,
}: {
  state: Agency | "new" | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = state === "new";
  const agency = state && state !== "new" ? state : null;
  const [draft, setDraft] = React.useState(() => ({
    name: agency?.name ?? "",
    logo: agency?.logo ?? "",
    licenseNo: agency?.licenseNo ?? "",
  }));

  const save = useMutation({
    mutationFn: (payload: Partial<Agency>) =>
      agency
        ? agencyApi.update(agency._id, payload)
        : agencyApi.create(payload),
    successMessage: agency ? "Agency updated" : "Agency created",
    onSuccess: () => {
      onSaved();
      onClose();
    },
  });

  return (
    <Dialog open={Boolean(state)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isNew ? "Create agency" : `Edit ${agency?.name}`}
          </DialogTitle>
          <DialogDescription>
            The <code className="font-mono">verified</code> flag is controlled
            separately from the verification toggle.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input
              value={draft.name}
              onChange={(event) =>
                setDraft((p) => ({ ...p, name: event.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>Licence number</Label>
            <Input
              value={draft.licenseNo}
              onChange={(event) =>
                setDraft((p) => ({ ...p, licenseNo: event.target.value }))
              }
              placeholder="RERA-UP-2024-001"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Logo URL</Label>
            <Input
              value={draft.logo}
              onChange={(event) =>
                setDraft((p) => ({ ...p, logo: event.target.value }))
              }
              placeholder="https://…"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={save.isPending}
            onClick={() =>
              void save.mutateAsync({
                name: draft.name,
                licenseNo: draft.licenseNo || undefined,
                logo: draft.logo || undefined,
              })
            }
          >
            {isNew ? "Create agency" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
