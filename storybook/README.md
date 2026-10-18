# Tenementary Storybook

Complete build documentation for **Tenementary**, a full-stack real-estate marketplace.

Five sections, written in build order:

| #   | Section                                                                    | Covers                                                                   |
| --- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| 01  | [Introduction](https://tenementary-storybook.vercel.app/docs/introduction) | The problem, the roles, the feature tour, the stack, local setup         |
| 02  | [The Backend](https://tenementary-storybook.vercel.app/docs/backend)       | 51 REST endpoints, 15 Mongoose models, auth, Socket.IO, caching, OpenAPI |
| 03  | [Admin Panel](https://tenementary-storybook.vercel.app/docs/admin-panel)   | The shadcn/ui operations console — 17 screens                            |
| 04  | [Web App](https://tenementary-storybook.vercel.app/docs/web-app)           | The public React 19 site — 16 routes                                     |
| 05  | [Mobile App](https://tenementary-storybook.vercel.app/docs/mobile-app)     | The Expo / React Native app — every screen                               |

It documents the open-source repository at
[NaveenMathramkott/Tenementary-property-finder](https://github.com/NaveenMathramkott/Tenementary-property-finder).

---

## Tech stack

| Concern   | Choice                                               |
| --------- | ---------------------------------------------------- |
| Framework | React Router 7 in **framework mode** (SSR)           |
| Build     | Vite 6                                               |
| UI        | shadcn/ui primitives on Radix                        |
| Styling   | Tailwind CSS v4 (CSS-first, no `tailwind.config.js`) |
| Language  | TypeScript, strict                                   |
| Icons     | lucide-react                                         |
| Hosting   | Vercel                                               |

## Getting started

```bash
npm install
npm run dev
```

The dev server runs at <http://localhost:5173>.

### Scripts

| Script              | Purpose                                   |
| ------------------- | ----------------------------------------- |
| `npm run dev`       | Start the dev server with HMR             |
| `npm run build`     | Production build into `build/`            |
| `npm start`         | Serve the production build                |
| `npm run typecheck` | Generate route types, then `tsc --noEmit` |
| `npm run lint`      | ESLint                                    |

## Deploying to Vercel

The free Hobby tier is enough — this is a small, mostly-static site.

**Via the CLI**

```bash
npm i -g vercel
vercel          # first time: link the project, confirm the framework preset
vercel --prod   # deploy
```

**Via the dashboard**

1. Push this directory to a Git repository.
2. In Vercel, choose **Add New → Project** and import that repository.
3. Set **Root Directory** to the folder containing this `package.json`.
4. Everything else is detected. `vercel.json` pins the framework, build
   command and output directory, and adds cache headers for `/assets` and
   `/images`.

If you move this into a monorepo, set **Root Directory** to `storybook/` so
Vercel installs the right package.

### Deploying anywhere else

`npm run build` produces:

- `build/client/` — static assets, servable from any CDN or static host
- `build/server/index.js` — the SSR entry

For a purely static host, add a `prerender` list to `react-router.config.ts`
so all five pages are emitted as HTML at build time.

---

## How the content is organised

Documentation pages are **data, not markup**. Each section is a typed `Section`
object in `app/content/sections/`, made of `Block`s:

```ts
export const BACKEND: Section = {
  slug: "backend",
  title: "The Backend",
  step: "02",
  summary: "…",
  blocks: [
    { t: "h2", text: "Architecture" },
    { t: "p", text: "…" },
    { t: "code", lang: "js", title: "server/server.js", code: "…" },
    { t: "endpoints", items: [ /* method, path, description, auth */ ] },
    { t: "table", columns: […], rows: [[…]] },
  ],
};
```

Available block types: `p`, `lead`, `h2`, `h3`, `ul`, `ol`, `code`, `table`,
`cards`, `image`, `screenshotGrid`, `callout`, `steps`, `fields`, `endpoints`,
`hr`, `spacer`.

### Adding a section

1. Create `app/content/sections/my-section.ts` exporting a `Section`.
2. Register it in `app/content/registry.ts`.
3. Add a `NavSection` entry in `app/content/nav.ts` — the sidebar, the homepage
   index, the previous/next links and the sitemap all derive from that list, so
   one entry covers every surface.

The table of contents is **generated from the headings**, so a new section gets a
working TOC and scroll-spy with no extra work.

### Images

Every screenshot uses one frame, one caption style and one vertical rhythm, and
— most importantly — **one left edge, flush with the body text**. Earlier
versions broke wide images out of the column with a negative margin and centred
phone shots, which produced three different left edges down one page and read
as an untidy list.

```ts
{ t: "image", src: "/images/admin_panel_dashboard.png", caption: "…", size: "wide" }
{ t: "image", src: "/images/mobile_app_login.png",      caption: "…", size: "phone" }
```

`wide` fills the content column. `phone` uses the identical frame and left edge
but a handset width (19rem), so a 1206 × 2622 portrait capture does not dominate
the page. There is no third option on purpose.

### Vertical rhythm

Every block-level element — code, tables, screenshots, callouts, cards,
endpoint lists, field lists and steps — uses `my-7`. Prose uses `my-4` and the
lead `my-5`. One number for blocks means spacing cannot drift between block
types as content is added.

### Inline markup

Prose supports `` `code` ``, `**bold**`, `*italic*` and `[links](url)`. Internal
links use the router; external ones open in a new tab.

## Layout

The layout follows [reactnative.dev](https://reactnative.dev): a **full-width
sticky header** above a **three-column documentation area**.

```
┌──────────────────────────────────────────────────────────────────┐
│ logo ───────────  search (⌘K) │ Source  ★2  ⑂ │ ☾ │ ← sticky
├──────────────┬────────────────────────────┬──────────────────────┤
│ Sidebar      │ Article                    │ On this page         │
│ Accordion    │ The content                │ Scroll-spy TOC       │
│ of sections  │                            │ + GitHub card        │
└──────────────┴────────────────────────────┴──────────────────────┘
```

The sidebar and TOC scroll independently. Below `lg` the sidebar collapses into
a drawer behind a hamburger; below `xl` the TOC is dropped. On phones the
search collapses to an icon and the GitHub entries drop their labels, so the
header never overflows.

Press <kbd>/</kbd> or <kbd>⌘K</kbd> anywhere to search — it indexes every
section and heading client-side.

### Sidebar accordion

The five sections are a Radix accordion, and **the whole row is the trigger** —
there is no separate chevron button. Clicking a section both navigates to it and
toggles its contents, so the sidebar reads as one control per section rather
than a link with a decoration bolted on.

The section currently being read is always open and auto-opens on navigation, so
the reader never has to expand anything to see where they are. Each expanded
section lists its top-level headings; sub-headings live in the right-hand TOC,
which is why they are not duplicated here.

Because the row is a `<button>` rather than a link, the five section URLs are
still reachable as real anchors from the homepage section index, so nothing is
lost to crawlers or to "open in new tab".

## Dark by default

Dark is the default theme — the product's own identity is an "Ivory & Emerald"
dark-first scheme. The `prefers-color-scheme` media query is deliberately **not**
consulted; only an explicit choice in the theme toggle (persisted to
`localStorage["storybook:theme"]`) overrides it. A small inline script applies
the class before first paint, so there is no flash of the wrong theme.

## GitHub integration

The header's Star button and repository statistics come from the GitHub REST
API, fetched **server-side in the root loader** so the numbers are in the initial
HTML.

The header shows exactly three things: **source**, **star** and **fork**.

| File                             | Role                                                            |
| -------------------------------- | --------------------------------------------------------------- |
| `app/lib/github.server.ts`       | The fetch, a 1-hour module-scope cache, and a 4s timeout        |
| `app/lib/github.ts`              | The `RepoStats` type and the compact number formatter           |
| `app/components/docs/github.tsx` | The Source, Star and Fork entries — one shared visual treatment |

Two details worth knowing:

- **It fails silently.** A rate limit, a timeout or an offline build yields
  `repoStats: null`; the Star button still renders, just without a count. The
  failure is cached too, so a rate limit cannot cause a retry storm.
  The unauthenticated API allows 60 requests per hour per IP, which the one-hour
  cache comfortably absorbs. If you expect more traffic, add a `GITHUB_TOKEN`
  environment variable and send it as a bearer token.

## Theming

Light and dark are both built in. Tokens live in `app/app.css` as OKLCH values
declared with Tailwind v4's `@theme inline`. The palette intentionally mirrors
the product's "Ivory & Emerald" identity so the docs feel like part of the same
family. A small inline script in `<head>` applies the stored theme before first
paint, so there is no flash of the wrong colours.

## Licence and attribution

This documentation was written to be read, copied and adapted for teaching.
Free to use.

It documents the open-source **Tenementary** project by
[NaveenMathramkott](https://github.com/NaveenMathramkott), whose original code is
licensed under the ISC licence. Product names, screenshots and code excerpts
remain the property of their respective authors. This storybook is not affiliated
with or endorsed by the upstream project.
