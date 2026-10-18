import {
  BookOpenIcon,
  LayoutDashboardIcon,
  MonitorIcon,
  ServerIcon,
  SmartphoneIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavSection = {
  slug: string;
  step: string;
  title: string;
  nav: string;
  summary: string;
  icon: LucideIcon;
};

/**
 * The single source of truth for the five-part reading order of the build.
 * Both the sidebar and the homepage section index are generated from it, so a
 * section can never be added to one and forgotten in the other.
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    slug: "introduction",
    step: "01",
    title: "Introduction",
    nav: "Introduction",
    summary:
      "What Tenementary is, the problem it solves, who it is for, and the complete feature list across every surface.",
    icon: BookOpenIcon,
  },
  {
    slug: "backend",
    step: "02",
    title: "The Backend",
    nav: "Backend",
    summary:
      "The Node, Express and MongoDB API: every endpoint, every Mongoose model, the realtime layer and the auth system.",
    icon: ServerIcon,
  },
  {
    slug: "admin-panel",
    step: "03",
    title: "Admin Panel",
    nav: "Admin Panel",
    summary:
      "The internal operations console — dashboards, moderation queues, reference-data management and analytics.",
    icon: LayoutDashboardIcon,
  },
  {
    slug: "web-app",
    step: "04",
    title: "Web App",
    nav: "Web App",
    summary:
      "The public React 19 website: search, listing detail, maps, shortlists, messaging and listing management.",
    icon: MonitorIcon,
  },
  {
    slug: "mobile-app",
    step: "05",
    title: "Mobile App",
    nav: "Mobile App",
    summary:
      "The Expo / React Native app: native tabs, realtime chat, on-device maps and the same feature set in your pocket.",
    icon: SmartphoneIcon,
  },
];

export const NAV_BY_SLUG = new Map(NAV_SECTIONS.map((s) => [s.slug, s]));

export function navFor(slug: string): NavSection {
  const found = NAV_BY_SLUG.get(slug);
  if (!found) throw new Error(`Unknown documentation section: "${slug}"`);
  return found;
}

/** Sequential navigation: previous / next page across the whole book. */
export function neighbours(slug: string) {
  const index = NAV_SECTIONS.findIndex((s) => s.slug === slug);
  return {
    prev: index > 0 ? NAV_SECTIONS[index - 1] : null,
    next:
      index >= 0 && index < NAV_SECTIONS.length - 1
        ? NAV_SECTIONS[index + 1]
        : null,
  };
}
