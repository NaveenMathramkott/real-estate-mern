import { PenLineIcon, StarIcon, Trash2Icon } from "lucide-react";
import * as React from "react";

import {
  EmptyState,
  ErrorState,
  LoadingBlock,
  PageHeader,
  Panel,
} from "@/components/common";
import { ConfirmDialog } from "@/features/shared/widgets";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ReviewTargetPicker,
  type ReviewTargetValue,
} from "@/features/reviews/review-target-picker";
import { useMutation } from "@/hooks/use-mutation";
import { useQuery } from "@/hooks/use-query";
import { queryStore } from "@/lib/query-store";
import { reviewApi } from "@/lib/api";
import { formatShortDate } from "@/lib/format";
import type { Review } from "@/lib/types";
import { cn } from "@/lib/utils";
import { pickList } from "@/lib/safe";

const EMPTY_DRAFT: ReviewTargetValue & { body: string } = {
  targetType: "building",
  targetId: "",
  body: "",
};

function Stars({
  value,
  onChange,
  size = "default",
}: {
  value: number;
  onChange?: (next: number) => void;
  size?: "default" | "lg";
}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(star)}
          className={cn(
            onChange && "hover:scale-110 cursor-pointer transition-transform",
            size === "lg" ? "p-0.5" : "p-0",
          )}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
        >
          <StarIcon
            className={cn(
              size === "lg" ? "size-7" : "size-4",
              star <= value
                ? "fill-warning text-warning"
                : "text-muted-foreground/40",
            )}
          />
        </button>
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const { data, error, isLoading, refetch } = useQuery<{ reviews: Review[] }>(
    "get|/reviews|",
    reviewApi.mine,
  );

  const remove = useMutation({
    mutationFn: (id: string) => reviewApi.remove(id),
    successMessage: "Review deleted",
    invalidate: () => {
      queryStore.invalidate("get|/reviews");
    },
  });

  const create = useMutation({
    mutationFn: (payload: {
      targetType: string;
      targetId: string;
      rating: number;
      body?: string;
    }) => reviewApi.create(payload),
    successMessage: "Review saved",
    invalidate: () => {
      queryStore.invalidate("get|/reviews");
    },
  });

  const [open, setOpen] = React.useState(false);
  const [rating, setRating] = React.useState(4);
  const [draft, setDraft] = React.useState(EMPTY_DRAFT);

  // Always open on a blank form, never on the previous submission.
  const openComposer = () => {
    setDraft(EMPTY_DRAFT);
    setRating(4);
    setOpen(true);
  };

  const submitReview = () => {
    void create
      .mutateAsync({
        targetType: draft.targetType,
        targetId: draft.targetId,
        rating,
        body: draft.body || undefined,
      })
      .then(() => setOpen(false));
  };

  const reviews = pickList<Review>(data, "reviews");
  const distribution = reviews.reduce<Record<number, number>>((acc, review) => {
    acc[review.rating] = (acc[review.rating] ?? 0) + 1;
    return acc;
  }, {});
  const average = reviews.length
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reviews"
        description="Reviews you have written. Writing again edits the earlier review rather than duplicating it."
        actions={
          <Button onClick={openComposer}>
            <PenLineIcon className="size-4" />
            Write a review
          </Button>
        }
      />

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : isLoading && !data ? (
        <LoadingBlock />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <Panel title="Your rating average">
            <div className="space-y-5 p-5">
              <div className="text-center">
                <p className="text-4xl font-semibold tabular-nums">
                  {average.toFixed(1)}
                </p>
                <Stars value={Math.round(average)} />
                <p className="text-muted-foreground mt-1 text-xs">
                  {reviews.length} review{reviews.length === 1 ? "" : "s"}{" "}
                  written
                </p>
              </div>
              <div className="space-y-1.5">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = distribution[star] ?? 0;
                  const pct = reviews.length
                    ? (count / reviews.length) * 100
                    : 0;
                  return (
                    <div key={star} className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground w-8">{star}★</span>
                      <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
                        <div
                          className="bg-warning h-full rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-muted-foreground w-6 text-right tabular-nums">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Panel>

          <Panel title="Written reviews" className="lg:col-span-2">
            {reviews.length === 0 ? (
              <EmptyState
                icon={StarIcon}
                title="No reviews written"
                description="Rate a building, area or agent to build trust across the marketplace."
                action={<Button onClick={openComposer}>Write a review</Button>}
              />
            ) : (
              <ul className="divide-border divide-y">
                {reviews.map((review) => (
                  <li
                    key={review._id}
                    className="flex items-start gap-3 px-5 py-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Stars value={review.rating} />
                        <Badge variant="secondary" className="capitalize">
                          {review.targetType}
                        </Badge>
                        <span className="text-muted-foreground font-mono text-[11px]">
                          {review.targetId.slice(-8)}
                        </span>
                      </div>
                      {review.body && (
                        <p className="mt-2 text-sm leading-relaxed">
                          {review.body}
                        </p>
                      )}
                      <p className="text-muted-foreground mt-1.5 text-xs">
                        {formatShortDate(review.createdAt)}
                      </p>
                    </div>
                    <ConfirmDialog
                      title="Delete this review?"
                      description="Authors and admins can delete their own reviews."
                      confirmLabel="Delete"
                      onConfirm={() => remove.mutate(review._id)}
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
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Write a review</DialogTitle>
            <DialogDescription>
              Reviews are unique per target and user, so submitting again edits
              the earlier entry.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <ReviewTargetPicker
              value={draft}
              onChange={(target) =>
                setDraft((prev) => ({ ...prev, ...target }))
              }
            />

            <div className="space-y-1.5">
              <Label>Rating</Label>
              <Stars value={rating} onChange={setRating} size="lg" />
            </div>

            <div className="space-y-1.5">
              <Label>Review</Label>
              <Textarea
                rows={4}
                value={draft.body}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, body: event.target.value }))
                }
                placeholder="Share what stood out about this listing…"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={create.isPending || !draft.targetId}
              onClick={submitReview}
            >
              Submit review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { Stars };
