import { NativeTabs } from "expo-router/unstable-native-tabs";
import * as React from "react";

import { TabBarContext } from "@/context/TabBarContext";
import { notificationApi } from "@/lib/api";
import { useQuery } from "@/hooks/use-query";
import { onSocket } from "@/lib/socket";
import { useAuthStore } from "@/store/auth-store";

/**
 * The signed-in application shell: properties, saved, chats and profile. Every
 * visitor is authenticated before this mounts, so there is no public variant of
 * these tabs.
 *
 * The chats badge is driven by REST on mount plus the socket `notification:new`
 * event, with a slow background sweep as a safety net.
 */
export default function AppTabs() {
  const user = useAuthStore((state) => state.user);
  const [isTabBarHidden, setIsTabBarHidden] = React.useState(false);

  const { data, refetch } = useQuery(
    user ? "get|/notifications|unreadOnly=true|limit=50|badge" : null,
    () => notificationApi.list({ unreadOnly: true, limit: 50 }),
    { staleTime: 30_000 },
  );

  React.useEffect(() => {
    return onSocket("notification:new", () => void refetch());
  }, [refetch]);

  React.useEffect(() => {
    if (!user) return;
    const id = setInterval(() => void refetch(), 120_000);
    return () => clearInterval(id);
  }, [user, refetch]);

  const unread =
    data?.notifications?.filter((item) => !item.readAt).length ?? 0;

  return (
    <TabBarContext.Provider value={{ setIsTabBarHidden }}>
      <NativeTabs
        tintColor="#0E9F6E"
        labelStyle={{ fontSize: 11 }}
        disableTransparentOnScrollEdge
        hidden={isTabBarHidden}
      >
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Label>Properties</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={{ default: "house", selected: "house.fill" }}
            md={{ default: "home", selected: "home_filled" }}
          />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="saved">
          <NativeTabs.Trigger.Label>Saved</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={{ default: "heart", selected: "heart.fill" }}
            md={{ default: "favorite", selected: "favorite" }}
          />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="chats">
          <NativeTabs.Trigger.Label>Chats</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={{
              default: "bubble.left.and.bubble.right",
              selected: "bubble.left.and.bubble.right.fill",
            }}
            md={{ default: "chat", selected: "chat" }}
          />
          {unread > 0 ? (
            <NativeTabs.Trigger.Badge>
              {unread > 9 ? "9+" : String(unread)}
            </NativeTabs.Trigger.Badge>
          ) : null}
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="profile">
          <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={{
              default: "person.crop.circle",
              selected: "person.crop.circle.fill",
            }}
            md={{ default: "account_circle", selected: "account_circle" }}
          />
        </NativeTabs.Trigger>
      </NativeTabs>
    </TabBarContext.Provider>
  );
}
