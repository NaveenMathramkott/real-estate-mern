import * as React from "react";
import { Link, useLocation } from "react-router";

import type { Heading } from "~/content/types";
import { cn } from "~/lib/utils";

type TreeNode = { heading: Heading; children: TreeNode[] };

/** Turn the flat heading list into a two-level tree (h2 → its h3 children). */
function buildTree(headings: Heading[]): TreeNode[] {
  const tree: TreeNode[] = [];
  let current: TreeNode | null = null;

  for (const heading of headings) {
    if (heading.level === 2) {
      current = { heading, children: [] };
      tree.push(current);
    } else if (current) {
      current.children.push({ heading, children: [] });
    } else {
      // An h3 before any h2 — treat it as a root so it is never lost.
      current = { heading, children: [] };
      tree.push(current);
    }
  }

  return tree;
}

/**
 * Right column: "On this page".
 *
 * Scroll-spy uses a scroll listener rather than IntersectionObserver alone:
 * the observer stops firing once the last heading scrolls off the top, which
 * leaves the active state stuck on a stale entry in long pages.
 */
export function TableOfContents({
  headings,
  sectionSlug,
  className,
}: {
  headings: Heading[];
  sectionSlug: string;
  className?: string;
}) {
  const { hash } = useLocation();
  const firstId = headings[0]?.id ?? "";
  const [activeId, setActiveId] = React.useState(firstId);

  const tree = React.useMemo(() => buildTree(headings), [headings]);

  React.useEffect(() => {
    if (!headings.length) return;

    function onScroll() {
      // A heading is active once its top edge passes under the sticky header.
      const marker = 140;
      let current = headings[0].id;

      for (const heading of headings) {
        const el = document.getElementById(heading.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= marker) current = heading.id;
        else break;
      }

      // At the very bottom of the page, highlight the final heading.
      const atBottom =
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 8;
      if (atBottom) current = headings[headings.length - 1].id;

      setActiveId(current);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [headings, sectionSlug]);

  // Honour a deep-linked hash on first paint.
  React.useEffect(() => {
    if (!hash) return;
    const id = hash.slice(1);
    if (headings.some((h) => h.id === id)) setActiveId(id);
  }, [hash, headings]);

  if (!headings.length) return null;

  return (
    <nav className={cn("text-sm", className)} aria-label="On this page">
      <p className="text-muted-foreground mb-3 text-[11px] font-semibold tracking-widest uppercase">
        On this page
      </p>

      <ul className="border-border space-y-2 border-l">
        {tree.map((node) => (
          <li key={node.heading.id}>
            <TocLink
              heading={node.heading}
              sectionSlug={sectionSlug}
              active={activeId === node.heading.id}
            />

            {node.children.length > 0 && (
              <ul className="mt-2 space-y-1.5">
                {node.children.map((child) => (
                  <li key={child.heading.id}>
                    <TocLink
                      heading={child.heading}
                      sectionSlug={sectionSlug}
                      active={activeId === child.heading.id}
                      muted
                    />
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

function TocLink({
  heading,
  sectionSlug,
  active,
  muted = false,
}: {
  heading: Heading;
  sectionSlug: string;
  active: boolean;
  muted?: boolean;
}) {
  return (
    <Link
      to={`/docs/${sectionSlug}#${heading.id}`}
      className={cn(
        "-ml-px block border-l py-0.5 pl-3 leading-snug transition-colors",
        muted ? "text-xs" : "text-sm",
        active
          ? "border-primary text-foreground font-medium"
          : "border-border/60 text-muted-foreground hover:border-muted-foreground hover:text-foreground",
      )}
    >
      {heading.text}
    </Link>
  );
}
