import { Link, useRouteLoaderData } from "react-router";
import type { Route } from "./+types/home";
import type { loader as rootLoader } from "~/root";
import { ArrowRightIcon, StarIcon } from "lucide-react";

import { Logo } from "~/components/docs/logo";
import { ThemeToggle } from "~/components/docs/theme";
import { GitHubCluster } from "~/components/docs/github";
import { DocSearch } from "~/components/docs/search-box";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { NAV_SECTIONS } from "~/content/nav";
import { SECTIONS } from "~/content/registry";
import { REPO_URL, REPO_STAR_URL } from "~/lib/site";

type Meta = Array<{ title: string } | { name: string; content: string }>;

export function meta(): Meta {
  return [
    { title: "Tenementary Storybook — the complete full-stack build" },
    {
      name: "description",
      content:
        "A complete, section-by-section guide to building Tenementary: a MERN real-estate platform with an Express API, a shadcn admin console, a React 19 web app and an Expo mobile app.",
    },
  ];
}

const STATS = [
  { value: "51", label: "REST endpoints" },
  { value: "15", label: "Mongoose models" },
  { value: "45", label: "Screens & pages" },
  { value: "4", label: "Applications" },
];

const SURFACES = [
  {
    name: "Express + MongoDB API",
    detail:
      "50 documented endpoints, JWT auth with rotation, Socket.IO chat, geospatial search.",
    accent: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  },
  {
    name: "shadcn/ui admin console",
    detail:
      "Moderation queues, reference data, analytics and platform-wide search tooling.",
    accent: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
  },
  {
    name: "React 19 web app",
    detail:
      "Search, maps, listing detail, shortlists, enquiries and realtime-ready messaging.",
    accent: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  {
    name: "Expo mobile app",
    detail:
      "Native tabs, on-device maps, secure token storage and live Socket.IO chat.",
    accent: "bg-amber-500/10 text-amber-800 dark:text-amber-300",
  },
];

export default function Home() {
  const first = NAV_SECTIONS[0];
  const { repoStats: stats } = useRouteLoaderData<typeof rootLoader>("root")!;

  return (
    <div className="bg-background min-h-screen">
      {/* --------------------------------- header -------------------------------- */}
      <header className="bg-background/85 sticky top-0 z-40 border-b backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-2 px-4 sm:gap-4 sm:px-8">
          <Logo />
          <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
            <DocSearch
              sections={SECTIONS}
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

      {/* ---------------------------------- hero --------------------------------- */}
      <section className="relative overflow-hidden border-b">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 0%, color-mix(in oklch, var(--primary) 22%, transparent), transparent 45%), radial-gradient(circle at 85% 10%, color-mix(in oklch, var(--gold) 18%, transparent), transparent 40%)",
          }}
        />
        <div className="relative mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
          <Badge variant="secondary" className="mb-6">
            <span className="bg-primary mr-1.5 inline-block size-1.5 rounded-full" />
            Open source · free for learning
          </Badge>

          <h1 className="max-w-3xl text-4xl leading-[1.08] font-semibold tracking-tight text-balance sm:text-6xl">
            The complete build of{" "}
            <span className="text-primary">Tenementary Full Stack App</span>
          </h1>

          <p className="text-muted-foreground mt-6 max-w-2xl text-lg leading-relaxed text-pretty sm:text-xl">
            A real-estate marketplace built as four separate applications on one
            shared API. This storybook walks the entire system in the order it
            was actually built — the backend, then the admin console, then the
            public web app, then the mobile app — with every endpoint, model,
            screen and design decision documented as it exists in the code.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link to={`/docs/${first.slug}`}>
                Read the documentation
                <ArrowRightIcon />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href={REPO_STAR_URL} target="_blank" rel="noreferrer noopener">
                <StarIcon />
                Star on GitHub
              </a>
            </Button>
          </div>

          <dl className="mt-16 grid max-w-2xl grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <dt className="text-3xl font-semibold tracking-tight">
                  {stat.value}
                </dt>
                <dd className="text-muted-foreground mt-1 text-sm">
                  {stat.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* -------------------------------- sections ------------------------------- */}
      <section className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Read it in build order
        </h2>
        <p className="text-muted-foreground mt-3 max-w-2xl leading-relaxed">
          Each section stands on its own, but together they tell the whole story
          of how a database schema grows into a shipped product.
        </p>

        <ol className="mt-10 space-y-3">
          {NAV_SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <li key={section.slug}>
                <Link
                  to={`/docs/${section.slug}`}
                  className="group hover:border-primary/50 flex items-start gap-4 rounded-xl border bg-card p-5 transition-all sm:gap-6 sm:p-6"
                >
                  <span className="bg-muted text-muted-foreground font-mono hidden size-12 shrink-0 items-center justify-center rounded-lg text-sm font-semibold sm:flex">
                    {section.step}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2.5">
                      <Icon className="text-primary size-4.5 shrink-0" />
                      <span className="text-lg font-semibold tracking-tight">
                        {section.title}
                      </span>
                    </span>
                    <span className="text-muted-foreground mt-2 block text-sm leading-relaxed">
                      {section.summary}
                    </span>
                  </span>

                  <ArrowRightIcon className="text-muted-foreground group-hover:text-primary mt-1 size-4 shrink-0 transition-transform group-hover:translate-x-1" />
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      {/* -------------------------------- surfaces ------------------------------- */}
      <section className="border-t bg-muted/30">
        <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Four applications, one API
          </h2>
          <p className="text-muted-foreground mt-3 max-w-2xl leading-relaxed">
            Everything in Tenementary talks to the same Express service. The
            three front ends share an identical data layer — the same axios
            client, the same caches and the same Zustand stores — and differ
            only where the platform genuinely demands it.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {SURFACES.map((surface) => (
              <div key={surface.name} className="bg-card rounded-xl border p-5">
                <span
                  className={`inline-block rounded-md px-2 py-0.5 font-mono text-[11px] ${surface.accent}`}
                >
                  application
                </span>
                <p className="mt-3 font-semibold tracking-tight">
                  {surface.name}
                </p>
                <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                  {surface.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------- footer -------------------------------- */}
      <footer className="border-t">
        <div className="text-muted-foreground mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-10 text-sm sm:flex-row sm:items-center sm:px-8">
          <p>
            Tenementary Storybook — built for learning, free to use and adapt.
          </p>
          <div className="flex items-center gap-4 sm:ml-auto">
            <Link to={`/docs/${first.slug}`} className="hover:text-foreground">
              Introduction
            </Link>
            <a
              href={REPO_STAR_URL}
              target="_blank"
              rel="noreferrer noopener"
              className="hover:text-foreground"
            >
              Star the repo
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
