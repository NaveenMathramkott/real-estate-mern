import {
  BarChart3Icon,
  BellIcon,
  BuildingIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  MapIcon,
  MessageSquareIcon,
  RadarIcon,
  StarIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  to: string;
  icon: LucideIcon;
  end?: boolean;
};

export type NavGroup = { label: string; items: NavItem[] };

export const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", to: "/", icon: LayoutDashboardIcon, end: true },
      { title: "Inquiries", to: "/inquiries", icon: MessageSquareIcon },
    ],
  },
  {
    label: "Marketplace",
    items: [
      { title: "Properties", to: "/properties", icon: BuildingIcon },
      { title: "Search Lab", to: "/search", icon: RadarIcon },
    ],
  },
  {
    label: "Reference Data",
    items: [
      { title: "Users", to: "/users", icon: UsersIcon },
      { title: "Agencies", to: "/agencies", icon: UsersIcon },
      { title: "Areas", to: "/areas", icon: MapIcon },
      { title: "Buildings", to: "/buildings", icon: BuildingIcon },
    ],
  },
  {
    label: "Engagement",
    items: [
      { title: "Reviews", to: "/reviews", icon: StarIcon },
      { title: "Conversations", to: "/conversations", icon: MessageSquareIcon },
      { title: "Notifications", to: "/notifications", icon: BellIcon },
    ],
  },
  {
    label: "System",
    items: [
      { title: "Profile", to: "/profile", icon: FileTextIcon },
      { title: "Analytics", to: "/analytics", icon: BarChart3Icon },
    ],
  },
];
