import {
  Building2Icon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react";
import * as React from "react";
import { Link, useNavigate } from "react-router-dom";

import { EmptyState, ErrorState, LoadingBlock } from "@/components/common";
import { PropertyTypeIcon } from "@/features/property-type-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuthStore } from "@/store/auth-store";
import { useMutation } from "@/hooks/use-mutation";
import { useQuery } from "@/hooks/use-query";
import { propertyApi } from "@/lib/api";
import { PROPERTY_STATUSES, propertyTypeLabel } from "@/lib/constants";
import {
  bedsLabel,
  formatCurrency,
  formatListingPrice,
  formatRelative,
  idOf,
} from "@/lib/format";
import type { Property, PropertyStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_VARIANT: Record<
  string,
  "success" | "warning" | "muted" | "outline" | "destructive"
> = {
  active: "success",
  rented: "warning",
  sold: "outline",
  draft: "muted",
  expired: "destructive",
};

/** The agent dashboard lists everything; management filters to the caller's own. */
export function ListingTable({ rows }: { rows: Property[] }) {
  const [pendingDelete, setPendingDelete] = React.useState<Property | null>(
    null,
  );

  const remove = useMutation({
    mutationFn: (property: Property) => propertyApi.remove(property._id),
    successMessage: "Listing expired",
    onSuccess: () => setPendingDelete(null),
  });

  const changeStatus = useMutation({
    mutationFn: ({
      property,
      status,
    }: {
      property: Property;
      status: string;
    }) => propertyApi.update(property._id, { status } as Partial<Property>),
  });

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Building2Icon}
        title="No listings here yet"
        description="Create a listing and it will show up with its enquiries and media."
        action={
          <Button asChild>
            <Link to="/listings/new">
              <PlusIcon />
              New listing
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <>
      <div className="space-y-3">
        {rows.map((property) => (
          <Card key={property._id} className="gap-4 p-4">
            <div className="flex flex-wrap items-start gap-4">
              <span className="bg-muted text-muted-foreground flex size-12 shrink-0 items-center justify-center rounded-xl">
                <PropertyTypeIcon type={property.type} className="size-5" />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to={`/properties/${property._id}`}
                    className="font-medium transition-colors hover:text-primary"
                  >
                    {property.title}
                  </Link>
                  <Badge
                    variant={STATUS_VARIANT[property.status] ?? "muted"}
                    className="capitalize"
                  >
                    {property.status}
                  </Badge>
                  {property.verifiedAt && (
                    <Badge variant="success">Verified</Badge>
                  )}
                </div>
                <p className="text-muted-foreground mt-1 truncate text-xs">
                  {property.address} · {propertyTypeLabel(property.type)} ·{" "}
                  {property.purpose === "rent" ? "Rent" : "Sale"}
                </p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {bedsLabel(property.beds)} ·{" "}
                  {formatCurrency(property.price, property.currency, true)} ·
                  updated {formatRelative(property.updatedAt)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-display text-lg leading-none font-medium tabular">
                  {formatListingPrice(
                    property.price,
                    property.currency,
                    property.purpose,
                  )}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm" aria-label="Actions">
                      <MoreHorizontalIcon />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem asChild>
                      <Link to={`/properties/${property._id}`}>
                        <SearchIcon className="size-4" />
                        View listing
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={`/listings/${property._id}/edit`}>
                        <PencilIcon className="size-4" />
                        Edit details
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={`/listings/${property._id}/media`}>
                        <PlusIcon className="size-4" />
                        Manage media
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() => setPendingDelete(property)}
                    >
                      <Trash2Icon className="size-4" />
                      Expire listing
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 border-t pt-3">
              <span className="text-muted-foreground mr-1 text-xs">
                Set status
              </span>
              {PROPERTY_STATUSES.filter(
                (status) => status !== property.status,
              ).map((status) => (
                <button
                  key={status}
                  type="button"
                  disabled={changeStatus.isPending}
                  onClick={() =>
                    changeStatus.mutate({
                      property,
                      status: status as PropertyStatus,
                    })
                  }
                  className="hover:bg-accent cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-medium capitalize transition-colors disabled:opacity-50"
                >
                  {status}
                </button>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open: boolean) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Expire this listing?</AlertDialogTitle>
            <AlertDialogDescription>
              Deleting sets the status to <strong>expired</strong>. The record
              is preserved, so it stays visible in your history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pendingDelete && remove.mutate(pendingDelete)}
            >
              Expire listing
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function ListingsPage() {
  const navigate = useNavigate();
  const [term, setTerm] = React.useState("");
  const [status, setStatus] = React.useState<string>("all");

  const { data, isLoading, error, refetch } = useQuery(
    "get|/properties|scope=mine|limit=100",
    () => propertyApi.search({ limit: 100 }),
  );

  // The search endpoint has no owner filter, so ownership is narrowed client
  // side against the caller's id before the status/term filters apply.
  const user = useAuthStore((s) => s.user);

  const rows = React.useMemo(() => {
    let list = data?.properties ?? [];
    if (user) {
      const owned = list.filter(
        (property) =>
          idOf(property.ownerId) === user._id ||
          idOf(property.agentId) === user._id,
      );
      // If nothing matched, the page is a management view for a new account —
      // showing everything helps rather than hiding the state.
      if (owned.length > 0) list = owned;
    }
    if (status !== "all") list = list.filter((p) => p.status === status);
    if (term.trim()) {
      const needle = term.toLowerCase();
      list = list.filter(
        (property) =>
          property.title.toLowerCase().includes(needle) ||
          (property.address ?? "").toLowerCase().includes(needle),
      );
    }
    return list;
  }, [data, user, status, term]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl leading-none font-medium tracking-tight">
            My listings
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Properties you own or are assigned as the agent.
          </p>
        </div>
        <Button onClick={() => navigate("/listings/new")}>
          <PlusIcon />
          New listing
        </Button>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Search by title or address"
          className="max-w-xs"
        />
        <div className="scrollbar-none flex gap-1.5 overflow-x-auto">
          {["all", ...PROPERTY_STATUSES].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setStatus(option)}
              className={cn(
                "shrink-0 cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-all",
                status === option
                  ? "border-primary bg-primary text-primary-foreground"
                  : "hover:border-primary/30 hover:bg-accent/50",
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <LoadingBlock />}
      {error && <ErrorState message={error} onRetry={() => void refetch()} />}
      {!isLoading && !error && <ListingTable rows={rows} />}
    </div>
  );
}
