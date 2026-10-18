import { MenuIcon } from "lucide-react";

import { Logo } from "~/components/docs/logo";
import { ThemeToggle } from "~/components/docs/theme";
import { GitHubCluster } from "~/components/docs/github";
import { DocSearch } from "~/components/docs/search-box";
import type { RepoStats } from "~/lib/github";
import type { Section } from "~/content/types";
import { NAV_SECTIONS } from "~/content/nav";

/**
 * The top bar, spanning all three columns — the reactnative.dev pattern.
 *
 *   logo ······················ search │ source · star · fork │ theme
 *
 * Search is right-aligned immediately before the repository status rather than
 * sitting centre-stage: it keeps the wordmark anchored on the left and groups
 * every interactive control into one predictable cluster on the right, which
 * matters most on narrow screens where that cluster is all the room there is.
 *
 * Section navigation lives in the sidebar accordion, not here — one place for
 * navigation, so the two can never disagree about where you are.
 */
export function SiteHeader({
  sections,
  stats,
  onOpenNav,
}: {
  sections: Section[];
  stats: RepoStats | null;
  onOpenNav?: () => void;
}) {
  return (
    <header className="bg-background/85 sticky top-0 z-40 border-b backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-[110rem] items-center gap-2 px-3 sm:gap-4 sm:px-6">
        {/* Left — navigation toggle (mobile) + wordmark */}
        {onOpenNav && (
          <button
            type="button"
            onClick={onOpenNav}
            aria-label="Open navigation"
            className="hover:bg-accent focus-visible:ring-ring -ml-2 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none sm:size-9 lg:hidden"
          >
            <MenuIcon className="size-5" />
          </button>
        )}
        <Logo className="min-w-0" />

        {/* Right — search, then repository status, then appearance */}
        <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
          <DocSearch
            sections={sections}
            className="w-8 shrink-0 sm:w-36 lg:w-64"
          />

          <span
            aria-hidden
            className="bg-border hidden h-5 w-px shrink-0 sm:block"
          />

          <GitHubCluster stats={stats} />
          <ThemeToggle className="size-8 shrink-0 sm:size-9" />
        </div>
      </div>
    </header>
  );
}

/** Breadcrumb above the article title. */
export function Breadcrumbs({ currentSlug }: { currentSlug?: string }) {
  return (
    <div className="text-muted-foreground flex items-center gap-2 text-xs">
      <span>Storybook</span>
      <span>/</span>
      <span className="text-foreground">
        {NAV_SECTIONS.find((s) => s.slug === currentSlug)?.nav ?? "Docs"}
      </span>
    </div>
  );
}
