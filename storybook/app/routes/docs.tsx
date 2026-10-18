import * as React from "react";
import { useLoaderData, useLocation } from "react-router";
import type { Route } from "./+types/docs";

import { BlockRenderer } from "~/components/docs/blocks";
import { DocsLayout } from "~/components/docs/layout";
import { NAV_SECTIONS } from "~/content/nav";
import { requireSection, SECTIONS } from "~/content/registry";
import { extractHeadings } from "~/content/types";

type Meta = Array<{ title: string } | { name: string; content: string }>;

export function meta({ params }: Route.MetaArgs): Meta {
  const section = params.slug
    ? SECTIONS.find((s) => s.slug === params.slug)
    : undefined;
  if (!section) return [{ title: "Not found · Tenementary Storybook" }];

  return [
    { title: `${section.title} · Tenementary Storybook` },
    { name: "description", content: section.summary },
  ];
}

export function loader({ params }: Route.LoaderArgs) {
  const slug = params.slug;
  if (!slug || !NAV_SECTIONS.some((s) => s.slug === slug)) {
    throw new Response("Section not found", { status: 404 });
  }

  const section = requireSection(slug);

  return {
    slug: section.slug,
    blocks: section.blocks,
    headings: extractHeadings(section.blocks),
  };
}

export default function DocRoute() {
  const { slug, blocks, headings } = useLoaderData<typeof loader>();
  const { hash } = useLocation();

  /*
    Scroll to the hash ourselves. The browser's built-in handling runs before
    lazy images have laid out, so a deep link like /docs/mobile-app#h3-chat
    frequently lands in the wrong place — or nowhere.
  */
  React.useEffect(() => {
    if (!hash) return;

    const id = hash.slice(1);
    const target = document.getElementById(id);
    if (!target) return;

    // Two frames: one for hydration, one for the first image layout pass.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        target.scrollIntoView({ behavior: "instant", block: "start" });
      });
    });
  }, [hash, slug]);

  return (
    <DocsLayout sectionSlug={slug} headings={headings}>
      <div className="mt-8">
        <BlockRenderer blocks={blocks} />
      </div>
    </DocsLayout>
  );
}
