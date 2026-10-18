import * as React from "react";
import { Link, useLocation, useRouteLoaderData } from "react-router";
import { XIcon } from "lucide-react";

import { Logo } from "~/components/docs/logo";
import { DocsSidebar } from "~/components/docs/sidebar";
import { SiteHeader, Breadcrumbs } from "~/components/docs/site-header";
import { TableOfContents } from "~/components/docs/toc";
import type { Heading } from "~/content/types";
import { NAV_SECTIONS, navFor } from "~/content/nav";
import { SECTIONS } from "~/content/registry";
import { REPO_URL } from "~/lib/site";
import type { loader as rootLoader } from "~/root";

/**
 * The documentation layout, following reactnative.dev:
 *
 *   ┌───────────────────────────────────────────────────────────────┐
 *   │  header — logo · search · section links · GitHub · theme      │  ← full width
 *   ├──────────────┬────────────────────────────┬───────────────────┤
 *   │  Sidebar     │  Article                   │  On this page     │
 *   │  (the book)  │  (the content)             │  (page TOC)       │
 *   └──────────────┴────────────────────────────┴───────────────────┘
 *
 * The header is sticky and spans all three columns, so search and the
 * repository status stay reachable at any scroll depth. The sidebar and TOC
 * scroll independently so the article keeps a comfortable measure.
 */
export function DocsLayout({
  children,
  sectionSlug,
  headings,
}: {
  children: React.ReactNode;
  sectionSlug: string;
  headings: Heading[];
}) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { pathname } = useLocation();
  const meta = navFor(sectionSlug);
  const rootData = useRouteLoaderData<typeof rootLoader>("root");

  // Close the drawer on navigation.
  React.useEffect(() => setMobileOpen(false), [pathname]);

  // Lock body scroll while the drawer is open.
  React.useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    /*
      `overflow-x-clip` (not `hidden`) stops a wide table or code block from
      creating horizontal page scroll at narrow widths, while still letting the
      inner `overflow-x-auto` regions scroll normally. Unlike `hidden`, it does
      not create a scroll container, so the sticky header keeps working.
    */
    <div className="bg-background min-h-screen overflow-x-clip">
      <SiteHeader
        sections={SECTIONS}
        stats={rootData?.repoStats ?? null}
        onOpenNav={() => setMobileOpen(true)}
      />

      {/* ------------------------------ mobile drawer --------------------------- */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 cursor-default bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="bg-sidebar relative h-full w-[min(20rem,86vw)] border-r shadow-2xl">
            <div className="flex h-16 items-center justify-between px-4">
              <Logo />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation"
                className="hover:bg-sidebar-accent cursor-pointer rounded-md p-1.5"
              >
                <XIcon className="size-4" />
              </button>
            </div>
            <div className="h-[calc(100%-4rem)]">
              <DocsSidebar
                sections={SECTIONS}
                currentSlug={sectionSlug}
                onNavigate={() => setMobileOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto flex w-full max-w-[110rem]">
        {/* ------------------------------ left column --------------------------- */}
        <aside className="border-border scroll-slim sticky top-16 hidden h-[calc(100vh-4rem)] w-72 shrink-0 border-r lg:block xl:w-80">
          <DocsSidebar sections={SECTIONS} currentSlug={sectionSlug} />
        </aside>

        {/* ------------------------------ centre column ------------------------- */}
        <main className="min-w-0 flex-1">
          <article className="mx-auto w-full max-w-4xl px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
            <SectionHeader sectionSlug={sectionSlug} />
            {children}
          </article>

          <PageFooter sectionSlug={sectionSlug} />
        </main>

        {/* ------------------------------- right column ------------------------- */}
        <aside className="border-border scroll-slim sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 overflow-y-auto border-l px-6 py-10 xl:block">
          <TableOfContents sectionSlug={sectionSlug} headings={headings} />
          <GithubCard />
        </aside>
      </div>

      <span className="sr-only">{meta.title}</span>
    </div>
  );
}

function SectionHeader({ sectionSlug }: { sectionSlug: string }) {
  const meta = navFor(sectionSlug);
  const Icon = meta.icon;

  return (
    <header className="mb-2">
      <Breadcrumbs currentSlug={sectionSlug} />
      <div className="mt-4 flex items-center gap-3">
        <span className="bg-primary/10 text-primary border-primary/20 flex size-10 items-center justify-center rounded-lg border">
          <Icon className="size-5" />
        </span>
        <div>
          <p className="text-muted-foreground font-mono text-[0.7rem] tracking-[0.2em] uppercase">
            Section {meta.step}
          </p>
          <h1 className="text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
            {meta.title}
          </h1>
        </div>
      </div>
    </header>
  );
}

function PageFooter({ sectionSlug }: { sectionSlug: string }) {
  const index = NAV_SECTIONS.findIndex((s) => s.slug === sectionSlug);
  const prev = index > 0 ? NAV_SECTIONS[index - 1] : null;
  const next = index < NAV_SECTIONS.length - 1 ? NAV_SECTIONS[index + 1] : null;

  return (
    <footer className="border-border mx-auto w-full max-w-4xl border-t px-5 py-10 sm:px-8 lg:px-10">
      <div className="grid gap-3 sm:grid-cols-2">
        {prev ? (
          <Link
            to={`/docs/${prev.slug}`}
            className="group hover:border-primary/50 rounded-lg border p-4 transition-colors"
          >
            <p className="text-muted-foreground text-[11px] tracking-widest uppercase">
              ← Previous
            </p>
            <p className="mt-1 font-medium group-hover:text-primary">
              {prev.title}
            </p>
          </Link>
        ) : (
          <Link
            to="/"
            className="group hover:border-primary/50 rounded-lg border p-4 transition-colors"
          >
            <p className="text-muted-foreground text-[11px] tracking-widest uppercase">
              ← Back to
            </p>
            <p className="mt-1 font-medium group-hover:text-primary">
              Overview
            </p>
          </Link>
        )}

        {next && (
          <Link
            to={`/docs/${next.slug}`}
            className="group hover:border-primary/50 rounded-lg border p-4 text-right transition-colors sm:col-start-2"
          >
            <p className="text-muted-foreground text-[11px] tracking-widest uppercase">
              Next →
            </p>
            <p className="mt-1 font-medium group-hover:text-primary">
              {next.title}
            </p>
          </Link>
        )}
      </div>
    </footer>
  );
}

function GithubCard() {
  return (
    <a
      href={REPO_URL}
      target="_blank"
      rel="noreferrer noopener"
      className="hover:border-primary/50 mt-8 block rounded-lg border p-3.5 transition-colors"
    >
      <p className="text-sm font-medium">Source on GitHub</p>
      <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
        Read the real code behind every section of this documentation.
      </p>
    </a>
  );
}
