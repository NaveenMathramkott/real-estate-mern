import { TabList, TabSlot, TabTrigger, Tabs } from "expo-router/ui";
import { StyleSheet } from "react-native";

import { useTheme } from "@/theme";

/**
 * Web fallback for the native tab bar — native tabs have no system bar in the
 * browser, so the web build uses headless tabs with the same route names.
 */
export default function AppTabs() {
  const theme = useTheme();

  return (
    <Tabs>
      <TabSlot />
      <TabList
        style={[
          styles.bar,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <TabTrigger name="index" href="/" style={styles.tab}>
          Properties
        </TabTrigger>
        <TabTrigger name="saved" href="/saved" style={styles.tab}>
          Saved
        </TabTrigger>
        <TabTrigger name="chats" href="/chats" style={styles.tab}>
          Chats
        </TabTrigger>
        <TabTrigger name="profile" href="/profile" style={styles.tab}>
          Profile
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tab: { flex: 1, alignItems: "center", paddingVertical: 6, fontSize: 13 },
});
