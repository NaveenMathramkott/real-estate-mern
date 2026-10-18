/**
 * Repository statistics for the header.
 *
 * Fetched on the server so the values are in the initial HTML (good for SEO and
 * for the first paint), cached in module scope to stay well inside the GitHub
 * API's 60-requests-per-hour unauthenticated limit, and allowed to fail quietly
 * — a rate-limited or offline build simply renders the header without counts.
 */

import type { RepoStats } from "~/lib/github";

export type { RepoStats };

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// Survives between invocations on a long-lived Node server (Vercel functions,
// react-router-serve). Resets per cold start, which is harmless.
let cache: { value: RepoStats | null; fetchedAt: number } | null = null;

export async function getRepoStats(repo: string): Promise<RepoStats | null> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.value;
  }

  try {
    const response = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "tenementary-storybook",
      },
      signal: AbortSignal.timeout(4000),
    });

    if (!response.ok) {
      // Cache the failure too, so a rate limit does not cause a retry storm.
      cache = { value: null, fetchedAt: Date.now() };
      return null;
    }

    const json = (await response.json()) as Record<string, unknown>;

    const value: RepoStats = {
      stars: count(json.stargazers_count),
      forks: count(json.forks_count),
    };

    cache = { value, fetchedAt: Date.now() };
    return value;
  } catch {
    cache = { value: null, fetchedAt: Date.now() };
    return null;
  }
}

function count(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
