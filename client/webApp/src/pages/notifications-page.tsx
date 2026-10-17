import {
  BellIcon,
  CheckCheckIcon,
  InboxIcon,
  MessageSquareIcon,
  StarIcon,
} from "lucide-react";
import * as React from "react";
import { Link } from "react-router-dom";

import { EmptyState, ErrorState, LoadingBlock } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useMutation } from "@/hooks/use-mutation";
import { useQuery } from "@/hooks/use-query";
import { notificationApi } from "@/lib/api";
import { formatRelative } from "@/lib/format";
import type { AppNotification } from "@/lib/types";
import { cn } from "@/lib/utils";

const TYPE_META: Record<
  string,
  { icon: typeof BellIcon; label: string; to?: string }
> = {
  message: { icon: MessageSquareIcon, label: "Message" },
  inquiry: { icon: InboxIcon, label: "Enquiry" },
  review: { icon: StarIcon, label: "Review" },
};

function metaFor(notification: AppNotification) {
  const payload = notification.payload ?? {};
  const base = TYPE_META[notification.type] ?? {
    icon: BellIcon,
    label: notification.type,
  };
  if (payload.conversationId) {
    return { ...base, to: `/messages/${payload.conversationId}` };
  }
  return base;
}

export default function NotificationsPage() {
  const [unreadOnly, setUnreadOnly] = React.useState(false);

  const { data, isLoading, error, refetch } = useQuery(
    `get|/notifications|unreadOnly=${unreadOnly}|limit=50|page`,
    () => notificationApi.list({ unreadOnly, limit: 50 }),
  );

  const markRead = useMutation({
    mutationFn: (notification: AppNotification) =>
      notificationApi.markRead(notification._id),
  });

  const markAll = useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    successMessage: "All caught up",
  });

  const notifications = data?.notifications ?? [];
  const unread = notifications.filter((item) => !item.readAt).length;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl leading-none font-medium tracking-tight">
            Notifications
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {unread > 0 ? `${unread} unread` : "You are all caught up"}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Switch checked={unreadOnly} onCheckedChange={setUnreadOnly} />
            Unread only
          </label>
          <Button
            variant="outline"
            size="sm"
            disabled={markAll.isPending}
            onClick={() => markAll.mutate()}
          >
            <CheckCheckIcon />
            Mark all read
          </Button>
        </div>
      </header>

      {isLoading && <LoadingBlock />}
      {error && <ErrorState message={error} onRetry={() => void refetch()} />}

      {!isLoading && !error && notifications.length === 0 && (
        <EmptyState
          icon={BellIcon}
          title={unreadOnly ? "No unread notifications" : "No notifications"}
          description="Messages, enquiries and review activity will show up here."
        />
      )}

      <ul className="space-y-2">
        {notifications.map((notification) => {
          const meta = metaFor(notification);
          const Icon = meta.icon;
          const body = (
            <>
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-lg",
                  notification.readAt
                    ? "bg-muted text-muted-foreground"
                    : "bg-accent text-primary",
                )}
              >
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{meta.label}</p>
                  {!notification.readAt && (
                    <span className="bg-primary size-1.5 rounded-full" />
                  )}
                </div>
                {typeof notification.payload?.preview === "string" && (
                  <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">
                    {notification.payload.preview}
                  </p>
                )}
                <p className="text-muted-foreground mt-1 text-xs">
                  {formatRelative(notification.createdAt)}
                </p>
              </div>
            </>
          );

          return (
            <li key={notification._id}>
              {meta.to ? (
                <Link
                  to={meta.to}
                  className="hover:border-primary/30 flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors"
                >
                  {body}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => markRead.mutate(notification)}
                  disabled={Boolean(notification.readAt) || markRead.isPending}
                  className="hover:border-primary/30 flex w-full cursor-pointer items-start gap-3 rounded-xl border p-4 text-left transition-colors disabled:cursor-default"
                >
                  {body}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
