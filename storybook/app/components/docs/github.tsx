import { StarIcon, GitForkIcon, GithubIcon } from "lucide-react";

import { formatCompact, type RepoStats } from "~/lib/github";
import { REPO_STAR_URL, REPO_URL } from "~/lib/site";

/**
 * The header's repository cluster: source, star and fork.
 *
 * All three share one visual treatment — an icon, a label or a count, and a
 * muted-to-foreground hover — so the Star entry reads as a peer of Fork rather
 * than as a call-to-action button competing with it.
 *
 * Counts come from the root loader, so they are server-rendered and present in
 * the initial HTML. When the GitHub API is unreachable (rate limit, offline
 * build) `stats` is null and the counts are simply omitted.
 */
export function GitHubCluster({ stats }: { stats: RepoStats | null }) {
  return (
    <div className="flex shrink-0 items-center">
      <ClusterLink
        href={REPO_URL}
        title="Source"
        srLabel="View the Tenementary source on GitHub"
      >
        <GithubIcon className="size-4" />
        {/* The word is the first thing to go when the header gets tight. */}
        <span className="hidden min-[420px]:inline">Source</span>
      </ClusterLink>

      <ClusterLink
        href={REPO_STAR_URL}
        title="Star"
        srLabel={
          stats
            ? `Star this repository on GitHub — ${stats.stars.toLocaleString()} stars`
            : "Star this repository on GitHub"
        }
      >
        <StarIcon className="size-4 transition-transform duration-200 group-hover:scale-110" />
        {stats && (
          <span className="tabular-nums">{formatCompact(stats.stars)}</span>
        )}
      </ClusterLink>

      <ClusterLink
        href={`${REPO_URL}/forks`}
        title="Fork"
        srLabel={
          stats
            ? `Fork this repository on GitHub — ${stats.forks.toLocaleString()} forks`
            : "Fork this repository on GitHub"
        }
      >
        <GitForkIcon className="size-4" />
        {stats && stats.forks > 0 && (
          <span className="tabular-nums">{formatCompact(stats.forks)}</span>
        )}
      </ClusterLink>
    </div>
  );
}

function ClusterLink({
  href,
  title,
  srLabel,
  children,
}: {
  href: string;
  title: string;
  srLabel: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      title={title}
      aria-label={srLabel}
      className="text-muted-foreground hover:text-foreground focus-visible:ring-ring group flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2 text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none sm:h-9 sm:px-2.5 sm:text-sm"
    >
      {children}
    </a>
  );
}
