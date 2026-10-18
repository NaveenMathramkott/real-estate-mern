import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import type { LinksFunction } from "react-router";

import { ThemeScript } from "~/components/docs/theme";
import { getRepoStats } from "~/lib/github.server";
import { REPO_SLUG } from "~/lib/site";
import stylesheet from "~/app.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
  { rel: "icon", href: "/favicon.png", type: "image/png" },
  { rel: "preconnect", href: "https://api.github.com" },
];

/**
 * Repository statistics for the header. Available to every route through
 * `useRouteLoaderData("root")`. Cached for an hour in module scope and allowed
 * to fail silently, so the site renders normally without network access.
 */
export async function loader() {
  return { repoStats: await getRepoStats(REPO_SLUG) };
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0e9f6e" />
        <ThemeScript />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: { error: unknown }) {
  let title = "Something went wrong";
  let detail = "An unexpected error occurred while rendering this page.";
  let status = 500;

  if (isRouteErrorResponse(error)) {
    status = error.status;
    title = error.status === 404 ? "Page not found" : error.statusText;
    detail =
      error.status === 404
        ? "We could not find the page you were looking for. It may have been moved or renamed."
        : error.data || detail;
  } else if (error instanceof Error) {
    detail = error.message;
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="text-primary font-mono text-sm tracking-widest uppercase">
          Error {status}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
          {detail}
        </p>
        <a
          href="/"
          className="bg-primary text-primary-foreground hover:bg-primary/90 mt-8 inline-flex h-10 items-center rounded-md px-5 text-sm font-medium"
        >
          Back to the overview
        </a>
      </div>
    </div>
  );
}
