import { CheckCircle2Icon, InboxIcon, PhoneIcon } from "lucide-react";
import * as React from "react";
import { Link } from "react-router-dom";

import {
  EmptyState,
  ErrorState,
  LoadingBlock,
  PageHeader,
  Panel,
} from "@/components/common";
import { StatusBadge } from "@/features/shared/status-badge";
import { CountBar } from "@/features/shared/widgets";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation } from "@/hooks/use-mutation";
import { useQuery } from "@/hooks/use-query";
import { apiCache } from "@/lib/api-client";
import { inquiryApi } from "@/lib/api";
import { INQUIRY_STATUSES } from "@/lib/constants";
import { formatCurrency, formatDateTime, formatRelative } from "@/lib/format";
import type { Inquiry, InquiryStatus, Property } from "@/lib/types";
import { pickList } from "@/lib/safe";

function asProperty(value: Inquiry["propertyId"]): Property | null {
  return value && typeof value === "object" ? (value as Property) : null;
}

function asUser(value: Inquiry["userId"]) {
  if (!value) return null;
  return typeof value === "object" ? value : null;
}

export default function InquiriesPage() {
  const { data, error, isLoading, refetch } = useQuery<{
    inquiries: Inquiry[];
  }>("get|/inquiries|", inquiryApi.list);

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: InquiryStatus }) =>
      inquiryApi.setStatus(id, status),
    successMessage: "Inquiry updated",
    invalidate: () => {
      apiCache.invalidate("get|/inquiries");
      void refetch();
    },
  });

  const [filter, setFilter] = React.useState<"all" | InquiryStatus>("all");
  const inquiries = pickList<Inquiry>(data, "inquiries");
  const visible =
    filter === "all" ? inquiries : inquiries.filter((i) => i.status === filter);

  const counts = inquiries.reduce<Record<string, number>>((acc, item) => {
    acc[item.status] = (acc[item.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inquiries"
        description="Leads routed to agents and landlords. Status changes notify the inquirer."
      />

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : isLoading ? (
        <LoadingBlock />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <Panel title="Pipeline" className="lg:col-span-1">
            <div className="space-y-5 p-5">
              <CountBar
                items={INQUIRY_STATUSES.map((status) => ({
                  label: status,
                  value: counts[status] ?? 0,
                }))}
                emptyLabel="No inquiries yet"
              />
              <Select
                value={filter}
                onValueChange={(value) => setFilter(value as typeof filter)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All inquiries</SelectItem>
                  {INQUIRY_STATUSES.map((status) => (
                    <SelectItem
                      key={status}
                      value={status}
                      className="capitalize"
                    >
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Panel>

          <Panel className="lg:col-span-2">
            {visible.length === 0 ? (
              <EmptyState
                icon={InboxIcon}
                title="Nothing in the inbox"
                description="Inquiries appear here once a buyer enquires about one of your listings."
              />
            ) : (
              <ul className="divide-border divide-y">
                {visible.map((inquiry) => {
                  const property = asProperty(inquiry.propertyId);
                  const user = asUser(inquiry.userId);
                  return (
                    <li key={inquiry._id} className="space-y-3 px-5 py-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-medium">
                              {user?.email ?? "Registered user"}
                            </p>
                            <StatusBadge value={inquiry.status} />
                          </div>
                          {property && (
                            <Link
                              to={`/properties/${property._id}`}
                              className="text-primary mt-0.5 block truncate text-xs hover:underline"
                            >
                              {property.title} ·{" "}
                              {formatCurrency(
                                property.price,
                                property.currency,
                                true,
                              )}
                            </Link>
                          )}
                        </div>
                        <span className="text-muted-foreground text-xs">
                          {formatRelative(inquiry.createdAt)}
                        </span>
                      </div>

                      <div className="bg-muted/50 rounded-lg border px-3 py-2">
                        <p className="text-sm leading-relaxed">
                          {inquiry.message}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Select
                          value={inquiry.status}
                          onValueChange={(value) =>
                            setStatus.mutate({
                              id: inquiry._id,
                              status: value as InquiryStatus,
                            })
                          }
                          disabled={setStatus.isPending}
                        >
                          <SelectTrigger size="sm" className="w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {INQUIRY_STATUSES.map((status) => (
                              <SelectItem
                                key={status}
                                value={status}
                                className="capitalize"
                              >
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {inquiry.status === "new" && (
                          <Buttonish
                            icon={PhoneIcon}
                            label="Mark contacted"
                            onClick={() =>
                              setStatus.mutate({
                                id: inquiry._id,
                                status: "contacted",
                              })
                            }
                          />
                        )}
                        {inquiry.status !== "closed" && (
                          <Buttonish
                            icon={CheckCircle2Icon}
                            label="Close"
                            onClick={() =>
                              setStatus.mutate({
                                id: inquiry._id,
                                status: "closed",
                              })
                            }
                          />
                        )}
                        <span className="text-muted-foreground ml-auto text-xs">
                          {formatDateTime(inquiry.createdAt)}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>
      )}
    </div>
  );
}

function Buttonish({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-muted-foreground hover:bg-accent inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors"
    >
      <Icon className="size-3.5" />
      {label}
    </button>
  );
}
