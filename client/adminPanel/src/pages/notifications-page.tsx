import { BellIcon, CheckCheckIcon, MailOpenIcon } from "lucide-react";
import * as React from "react";

import {
  EmptyState,
  ErrorState,
  LoadingBlock,
  PageHeader,
  Panel,
} from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useMutation } from "@/hooks/use-mutation";
import { useQuery } from "@/hooks/use-query";
import { queryStore } from "@/lib/query-store";
import { notificationApi } from "@/lib/api";
import { formatDateTime, formatRelative } from "@/lib/format";
import type { AppNotification } from "@/lib/types";
import { cn } from "@/lib/utils";
import { pickList } from "@/lib/safe";

const TYPE_TONE: Record<string, string> = {
  message: "bg-primary/10 text-primary",
  inquiry: "bg-warning/15 text-warning",
  verification: "bg-success/12 text-success",
  alert: "bg-destructive/10 text-destructive",
};

export default function NotificationsPage() {
  const [unreadOnly, setUnreadOnly] = React.useState(false);
  const [limit, setLimit] = React.useState(50);

  const params = { unreadOnly: unreadOnly || undefined, limit };
  const { data, error, isLoading, refetch } = useQuery<{
    notifications: AppNotification[];
  }>(`get|/notifications|${JSON.stringify(params)}`, () =>
    notificationApi.list(params),
  );

  const invalidate = () => {
    queryStore.invalidate("get|/notifications");
  };

  const markRead = useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    invalidate,
  });

  const markAll = useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    successMessage: "All notifications marked as read",
    invalidate,
  });

  const items = pickList<AppNotification>(data, "notifications");
  const unread = items.filter((item) => !item.readAt).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Message, inquiry and verification events delivered to your account."
        actions={
          <Button
            variant="outline"
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending || unread === 0}
          >
            <CheckCheckIcon className="size-4" />
            Mark all read
          </Button>
        }
      />

      <Panel>
        <div className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex cursor-pointer items-center gap-2">
            <Switch checked={unreadOnly} onCheckedChange={setUnreadOnly} />
            <span className="text-sm font-medium">Unread only</span>
            {unread > 0 && <Badge variant="destructive">{unread}</Badge>}
          </label>
          <Select
            value={String(limit)}
            onValueChange={(value) => setLimit(Number(value))}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[20, 50, 100].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size} results
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : isLoading && !data ? (
          <LoadingBlock />
        ) : items.length === 0 ? (
          <EmptyState
            icon={unreadOnly ? MailOpenIcon : BellIcon}
            title={unreadOnly ? "Nothing unread" : "No notifications yet"}
            description="Events appear here as conversations, inquiries and verifications happen."
          />
        ) : (
          <ul className="divide-border divide-y">
            {items.map((item) => (
              <li
                key={item._id}
                className={cn(
                  "flex items-start gap-3 px-5 py-4 transition-colors",
                  !item.readAt && "bg-primary/[0.04]",
                )}
              >
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg",
                    TYPE_TONE[item.type] ?? "bg-muted text-muted-foreground",
                  )}
                >
                  <BellIcon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium capitalize">
                      {item.type}
                    </p>
                    {!item.readAt && <Badge variant="default">New</Badge>}
                  </div>
                  {item.payload?.preview && (
                    <p className="text-muted-foreground mt-0.5 truncate text-sm">
                      {item.payload.preview}
                    </p>
                  )}
                  <p className="text-muted-foreground mt-1 text-xs">
                    {formatDateTime(item.createdAt)} ·{" "}
                    {formatRelative(item.createdAt)}
                  </p>
                </div>
                {!item.readAt && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={markRead.isPending}
                    onClick={() => markRead.mutate(item._id)}
                  >
                    Mark read
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
