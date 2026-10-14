import { ArrowRightIcon, CheckIcon, InboxIcon, MailIcon } from "lucide-react";
import * as React from "react";
import { Link } from "react-router-dom";

import { EmptyState, ErrorState, LoadingBlock } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMutation } from "@/hooks/use-mutation";
import { useQuery } from "@/hooks/use-query";
import { conversationApi, inquiryApi } from "@/lib/api";
import { formatRelative } from "@/lib/format";
import type { Inquiry, InquiryStatus, Property } from "@/lib/types";
import { cn } from "@/lib/utils";

const FLOW: InquiryStatus[] = ["new", "contacted", "closed"];

/** `propertyId` arrives populated on some routes and as a bare id on others. */
function asProperty(value: Inquiry["propertyId"]): Property | null {
  return typeof value === "string" ? null : value;
}

/** Always renders something — the id, whether it arrived bare or populated. */
function idOf(value: Inquiry["propertyId"]): string {
  return typeof value === "string" ? value : (value?._id ?? "unknown");
}

const STATUS_VARIANT: Record<InquiryStatus, "default" | "warning" | "muted"> = {
  new: "default",
  contacted: "warning",
  closed: "muted",
};

export default function InquiriesPage() {
  const { data, isLoading, error, refetch } = useQuery("get|/inquiries", () =>
    inquiryApi.list(),
  );
  const inquiries = data?.inquiries ?? [];

  const setStatus = useMutation({
    mutationFn: ({
      inquiry,
      status,
    }: {
      inquiry: Inquiry;
      status: InquiryStatus;
    }) => inquiryApi.setStatus(inquiry._id, status),
  });

  const startChat = useMutation({
    mutationFn: (inquiry: Inquiry) => {
      const userId =
        typeof inquiry.userId === "string"
          ? inquiry.userId
          : inquiry.userId._id;
      const propertyId =
        typeof inquiry.propertyId === "string"
          ? inquiry.propertyId
          : inquiry.propertyId._id;
      return conversationApi.create({ participantId: userId, propertyId });
    },
    onSuccess: (data) => {
      window.location.href = `/messages/${data.conversation._id}`;
    },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl leading-none font-medium tracking-tight">
          Enquiries
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Leads addressed to you. Moving the status notifies the person who
          enquired.
        </p>
      </header>

      {isLoading && <LoadingBlock />}
      {error && <ErrorState message={error} onRetry={() => void refetch()} />}

      {!isLoading && !error && inquiries.length === 0 && (
        <EmptyState
          icon={InboxIcon}
          title="No enquiries yet"
          description="When someone enquires on one of your listings it lands here with its status."
          action={
            <Button asChild>
              <Link to="/listings">Review your listings</Link>
            </Button>
          }
        />
      )}

      <ul className="space-y-3">
        {inquiries.map((inquiry) => (
          <InquiryRow
            key={inquiry._id}
            inquiry={inquiry}
            onStatus={(status) => setStatus.mutate({ inquiry, status })}
            onChat={() => startChat.mutate(inquiry)}
            busy={setStatus.isPending || startChat.isPending}
          />
        ))}
      </ul>
    </div>
  );
}

function InquiryRow({
  inquiry,
  onStatus,
  onChat,
  busy,
}: {
  inquiry: Inquiry;
  onStatus: (status: InquiryStatus) => void;
  onChat: () => void;
  busy: boolean;
}) {
  const property = asProperty(inquiry.propertyId);
  const requester = typeof inquiry.userId === "string" ? null : inquiry.userId;
  const currentIndex = FLOW.indexOf(inquiry.status);

  return (
    <Card className="gap-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{requester?.email ?? "Enquiry"}</p>
            <Badge
              variant={STATUS_VARIANT[inquiry.status]}
              className="capitalize"
            >
              {inquiry.status}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            on{" "}
            {property ? (
              <Link
                to={`/properties/${property._id}`}
                className="text-primary hover:underline"
              >
                {property.title}
              </Link>
            ) : (
              <span className="font-mono">
                property {idOf(inquiry.propertyId)}
              </span>
            )}{" "}
            · {formatRelative(inquiry.createdAt)}
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={onChat} disabled={busy}>
          <MailIcon />
          Reply
        </Button>
      </div>

      <blockquote className="bg-surface-soft rounded-lg border-l-2 border-primary/40 p-3 text-sm leading-relaxed">
        {inquiry.message}
      </blockquote>

      {/* Linear stepper — the API only accepts the three documented statuses. */}
      <div className="flex flex-wrap items-center gap-1.5">
        {FLOW.map((status, index) => (
          <React.Fragment key={status}>
            {index > 0 && (
              <ArrowRightIcon className="text-muted-foreground size-3" />
            )}
            <button
              type="button"
              disabled={busy}
              onClick={() => onStatus(status)}
              className={cn(
                "flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-all disabled:cursor-not-allowed",
                inquiry.status === status
                  ? "border-primary bg-primary text-primary-foreground"
                  : index <= currentIndex
                    ? "hover:border-primary/40 hover:bg-accent/50"
                    : "text-muted-foreground hover:bg-accent/40",
              )}
            >
              {index < currentIndex && <CheckIcon className="size-3" />}
              {status}
            </button>
          </React.Fragment>
        ))}
      </div>
    </Card>
  );
}
