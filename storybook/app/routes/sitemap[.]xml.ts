import type { Route } from "./+types/sitemap[.]xml";
import { SECTIONS } from "~/content/registry";

/**
 * A hand-generated sitemap. The site has six pages, so enumerating them is
 * simpler and more reliable than deriving the list from the route config.
 */
export function loader({ request }: Route.LoaderArgs) {
  const origin = new URL(request.url).origin;

  const urls = [
    { loc: `${origin}/`, priority: "1.0", changefreq: "weekly" },
    ...SECTIONS.map((section, index) => ({
      loc: `${origin}/docs/${section.slug}`,
      priority: index === 0 ? "0.9" : "0.8",
      changefreq: "monthly",
    })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${url.loc}</loc>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>
`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
