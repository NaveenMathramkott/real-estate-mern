import type { Section } from "~/content/types";

import { ADMIN_PANEL } from "~/content/sections/admin-panel";
import { BACKEND } from "~/content/sections/backend";
import { INTRODUCTION } from "~/content/sections/introduction";
import { MOBILE_APP } from "~/content/sections/mobile-app";
import { WEB_APP } from "~/content/sections/web-app";

/**
 * Every documentation section in reading order. The sidebar, the homepage index
 * and the sitemap are all generated from this list.
 */
export const SECTIONS: Section[] = [
  INTRODUCTION,
  BACKEND,
  ADMIN_PANEL,
  WEB_APP,
  MOBILE_APP,
];

const REGISTRY = new Map(SECTIONS.map((section) => [section.slug, section]));

export function getSection(slug: string): Section | undefined {
  return REGISTRY.get(slug);
}

export function requireSection(slug: string): Section {
  const section = REGISTRY.get(slug);
  if (!section) throw new Response("Not Found", { status: 404 });
  return section;
}
