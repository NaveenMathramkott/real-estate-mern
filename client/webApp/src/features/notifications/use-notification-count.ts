import { notificationApi } from "@/lib/api";
import { useQuery } from "@/hooks/use-query";
import { useAuthStore } from "@/store/auth-store";

/** Sidebar unread badge. Shares a query key with the notifications page, so both update. */
export function useNotificationCount() {
  const user = useAuthStore((s) => s.user);
  const { data } = useQuery(
    user ? "get|/notifications|unreadOnly=true|limit=50|badge" : null,
    () => notificationApi.list({ unreadOnly: true, limit: 50 }),
    { enabled: Boolean(user) },
  );
  return data?.notifications?.length ?? 0;
}
