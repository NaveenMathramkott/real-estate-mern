import type { Section } from "~/content/types";

export const WEB_APP: Section = {
  slug: "web-app",
  title: "Web App",
  nav: "Web App",
  step: "04",
  summary:
    "The public React 19 website: search, listing detail, maps, shortlists, messaging and the listing management flow.",
  icon: "Monitor",
  blocks: [
    {
      t: "lead",
      text: "The web app is the public face of Tenementary: a Vite 8 and React 19 single-page application using React Router 7, Tailwind v4 and a shadcn/ui component kit. It shares its entire data layer with the admin console and the mobile app.",
    },

    { t: "h2", text: "At a glance" },

    {
      t: "table",
      columns: ["Concern", "Choice"],
      rows: [
        [
          "Framework",
          "Vite 8 + React 19 with the React Compiler enabled via Babel",
        ],
        [
          "Routing",
          "React Router 7 — an explicit route tree in `src/app-routes.tsx`",
        ],
        ["Components", "shadcn/ui on Radix — 27 primitives"],
        [
          "Styling",
          'Tailwind CSS v4, CSS-first `@theme` tokens, "Ivory & Emerald" palette',
        ],
        ["Maps", "Leaflet + `react-leaflet`, including polygon drawing"],
        ["Charts", "Recharts"],
        ["State", "Zustand — four stores plus a server-state registry"],
        ["HTTP", "axios with silent token refresh and a TTL cache"],
        ["Language", "TypeScript, strict"],
      ],
    },

    { t: "h2", text: "Project structure" },

    {
      t: "code",
      lang: "bash",
      title: "client/webApp/src/",
      code: `src/
├── main.tsx              Entry
├── App.tsx               BrowserRouter → ErrorBoundary → TooltipProvider → Toaster
├── app-routes.tsx        The route tree, guards and layouts
├── index.css             381 lines of Tailwind v4 theme tokens
│
├── pages/                16 files — one per route (plus two routes sharing a file)
├── components/
│   ├── common.tsx        Spinner, EmptyState, ErrorState, Pagination, RatingStars, …
│   ├── error-boundary.tsx
│   ├── layout/           app-layout, public-layout, site-header, site-footer, logo
│   ├── home/             hero.tsx — Hero + ListingMarquee
│   ├── property/         property-card, property-cover, property-gallery, property-map
│   ├── search/           filter-panel, hero-search, property-results
│   └── ui/               27 shadcn primitives
│
├── features/
│   ├── listings/         listing-form.tsx, media-manager.tsx
│   ├── notifications/    use-notification-count.ts
│   ├── property-images.ts
│   └── property-type-icon.tsx
│
├── hooks/                use-query, use-mutation, use-favorite-action, …
├── lib/                  api.ts, api-client.ts, api-cache.ts, query-store.ts, …
└── store/                auth, favorites, property-details, search, toast
`,
    },

    { t: "h2", text: "Routing and layouts" },

    {
      t: "p",
      text: "Two layouts divide the application. `PublicLayout` is the marketing chrome — a transparent, frosted sticky header and a large footer. `AppLayout` is the application chrome, wrapped in `RequireAuth`: a sidebar on desktop that becomes a sheet on mobile, plus a compact footer.",
    },

    {
      t: "code",
      lang: "tsx",
      title: "src/app-routes.tsx — the shape of the tree",
      code: `<Routes>
  {/* ─── public ─────────────────────────────────────────────── */}
  <Route element={<PublicLayout />}>
    <Route path="/" element={<HomePage />} />
    <Route path="/search" element={<SearchPage />} />
    <Route path="/properties/:id" element={<PropertyDetailPage />} />
    <Route path="/areas" element={<AreasPage />} />
    <Route path="/areas/:id" element={<AreaDetailPage />} />
    <Route path="/buildings" element={<BuildingsPage />} />
    <Route path="/buildings/:id" element={<BuildingDetailPage />} />
    <Route path="/agencies" element={<AgenciesPage />} />
    <Route path="/agencies/:id" element={<AgencyDetailPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
  </Route>

  {/* ─── authenticated ──────────────────────────────────────── */}
  <Route element={<RequireAuth />}>
    <Route element={<AppLayout />}>
      <Route index element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<DashboardPage />} />

      {/* Shared by every consumer role. */}
      <Route path="/saved" element={<SavedPage />} />
      <Route path="/saved-searches" element={<SavedSearchesPage />} />
      <Route path="/messages" element={<MessagesPage />} />
      <Route path="/messages/:id" element={<MessagesPage />} />
      <Route path="/notifications" element={<NotificationsPage />} />
      <Route path="/reviews" element={<ReviewsPage />} />
      <Route path="/profile" element={<ProfilePage />} />

      {/* Lister roles only. */}
      <Route element={<RequireRole roles={LISTER_ROLES} />}>
        <Route path="/listings" element={<ListingsPage />} />
        <Route path="/listings/new" element={<ListingEditorPage />} />
        <Route path="/listings/:id/edit" element={<ListingEditorPage />} />
        <Route path="/listings/:id/media" element={<ListingMediaPage />} />
        <Route path="/inquiries" element={<InquiriesPage />} />
      </Route>
    </Route>
  </Route>

  <Route path="*" element={<NotFoundPage />} />
</Routes>`,
    },

    { t: "h3", text: "The guards" },

    {
      t: "table",
      columns: ["Guard", "Behaviour"],
      rows: [
        [
          "`RequireAuth`",
          "Redirects to `/login`, stashing the intended destination in `location.state.from` so login can return you there.",
        ],
        [
          "`RequireRole`",
          "Redirects to `/dashboard` when the user lacks the role. Used only for the lister routes.",
        ],
        [
          "`ShortlistLoader`",
          "Loads favourites once per session and hydrates the favourites store, so the heart icon is correct before any list has loaded.",
        ],
      ],
    },

    {
      t: "callout",
      kind: "tip",
      title: "Where the role boundary actually sits",
      text: '`LISTER_ROLES` is `["agent", "landlord", "admin"]` and it gates five routes. But the real enforcement is server-side — `POST /api/v1/properties` carries `requireRole("agent", "landlord", "admin")`. The client guard is a navigation convenience; hiding a route you still cannot call is presentation, not security.',
    },

    { t: "h2", text: "The home page" },

    {
      t: "p",
      text: "A marketing page that is nonetheless almost entirely driven by live data. The hero builds a pointer-parallax collage from real listings, the marquee is a continuously scrolling strip of the newest arrivals, and the neighbourhood cards each fetch their own live price insights.",
    },

    {
      t: "image",
      src: "/images/web_app_home_page.png",
      caption:
        "The home page. A hero with a live listing collage, a horizontally scrolling marquee of the newest properties, and an intent picker that deep-links into search pre-filtered for rent or buy.",
      alt: "Tenementary home page hero and listing sections",
    },

    { t: "h3", text: "The parallax hero" },

    {
      t: "p",
      text: '`components/home/hero.tsx` is the most unusual piece of front-end code in the project. It renders a handful of real listings as absolutely-positioned cards, tracks the pointer across the container and translates each card by a different multiple of the pointer offset. It also renders a miniature "draw-on-map" illustration that nods at the polygon search without being interactive.',
    },

    {
      t: "callout",
      kind: "info",
      title: "Performance note",
      text: "The parallax is driven by CSS transforms, not layout properties, and the cards are `pointer-events-none` so they never intercept clicks. That keeps it on the compositor thread. It is also the one place the home page does synchronous work during render, which is why the listings come from `useQuery` with a stable key and fall back to a seeded gradient while loading.",
    },

    { t: "h2", text: "Search" },

    {
      t: "p",
      text: "The largest single surface in the app — `pages/search-page.tsx` is 767 lines — and the most interesting. It has to reconcile four representations of the same result set: a results grid, a Leaflet map, a split view, and the URL query string.",
    },

    {
      t: "image",
      src: "/images/web_app_properties.png",
      caption:
        "The search page with the filter panel open. Facets combine freely — purpose, type, price band, bedrooms, furnishing, amenities and city — and every change is reflected in the URL so a search is shareable.",
      alt: "Search page with filters and results grid",
    },

    { t: "h3", text: "URL as state" },

    {
      t: "p",
      text: "Filters live in a persisted Zustand store *and* in the query string. `filtersToParams` serialises the store into `useSearchParams` on every change, so a URL is always a complete description of the current search. That makes every search shareable and bookmarkable, and it is why the back button behaves correctly.",
    },

    {
      t: "code",
      lang: "ts",
      title: "src/store/search-store.ts",
      code: `export const EMPTY_FILTERS: SearchFilters = {
  purpose: undefined,   // "rent" | "buy"
  type: [],             // multi-select
  city: "",
  beds: "",
  priceMin: "",
  priceMax: "",
  furnished: [],
  amenities: [],
  q: "",
  polygon: undefined,
  lat: undefined,
  lng: undefined,
  radius: undefined,
};

// Persisted so a returning visitor gets their last search back.
export const useSearchStore = create<SearchStore>()(
  persist(
    (set) => ({
      filters: EMPTY_FILTERS,
      view: "list",           // "list" | "map" | "split"
      setFilter: (key, value) =>
        set((s) => ({ filters: { ...s.filters, [key]: value } })),
      toggleArrayFilter: (key, value) =>
        set((s) => {
          const current = s.filters[key] ?? [];
          const next = current.includes(value)
            ? current.filter((v) => v !== value)
            : [...current, value];
          return { filters: { ...s.filters, [key]: next } };
        }),
      reset: () => set({ filters: EMPTY_FILTERS }),
      setView: (view) => set({ view }),
    }),
    { name: "web:search" },
  ),
);`,
    },

    { t: "h3", text: "The three views" },

    {
      t: "cards",
      cols: 3,
      items: [
        {
          title: "List",
          text: "The default. A responsive card grid with active-filter chips, a sort menu and pagination.",
        },
        {
          title: "Map",
          text: "Full-bleed Leaflet with price-pill markers. Clicking a marker opens the listing.",
        },
        {
          title: "Split",
          text: "Both at once — the layout the search page was really designed around.",
        },
      ],
    },

    { t: "h3", text: "Commute mode" },

    {
      t: "p",
      text: "Activating commute mode swaps the filter panel for an address-or-coordinate input plus a travel time and an assumed speed. Submitting calls `searchApi.commute` and replaces the current result set with the returned listings.",
    },

    {
      t: "callout",
      kind: "info",
      title: "Straight-line, labelled as such",
      text: "The server computes `radiusMetres = minutes / 60 * speedKph * 1000` and searches a circle. There is no routing engine behind it. The control is labelled with the assumed speed so nobody reads the result as a real commute time — see [Commute search](/docs/backend#h2-geospatial-search).",
    },

    { t: "h3", text: "Drawing a polygon" },

    {
      t: "p",
      text: "The map component supports a draw mode. Clicking vertices builds a ring, which is passed to `searchApi.polygon`. The same `PropertyMap` component is reused on the property detail page, where drawing updates the surrounding-area view instead.",
    },

    { t: "h3", text: "Saving a search" },

    {
      t: "p",
      text: "A dialog offers to save the current filter set. It writes to `savedSearchApi.create`, and the new search appears immediately on `/saved-searches`. The server re-validates the filters through the same `buildPropertyFilter` used by the list endpoint, so a saved search cannot encode a filter that would fail when run.",
    },

    { t: "h2", text: "Property detail" },

    {
      t: "p",
      text: "743 lines and the most important page in the product. It answers every question a prospective tenant or buyer has, in one scroll.",
    },

    { t: "h3", text: "The gallery" },

    {
      t: "p",
      text: "`PropertyGallery` is tabbed across the four media types the schema allows — `image`, `video`, `floorplan`, `tour` — via a `MEDIA_TABS` constant. The largest image is the hero, thumbnails sit beneath it, and the whole thing is keyboard navigable.",
    },

    { t: "h3", text: "Price history" },

    {
      t: "p",
      text: "Any listing whose price has changed has a `priceHistory` document for each change. The page fetches them and renders a trend indicator — an arrow and a percentage beside the current price — so a renter can tell at a glance whether a landlord is about to raise the rent or has been holding it steady.",
    },

    { t: "h3", text: "Everything else on the page" },

    {
      t: "ul",
      items: [
        "**`PropertySpecStrip`** — beds, baths, area, floor and furnishing in one dense row.",
        "**`PropertyMap`** — the location, with a static variant for when the map is incidental.",
        "**Reviews** — the building's reviews, with a `StarPicker` for writing one.",
        "**Similar homes** — from `propertyApi.similar`, the ±20% price and 5 km match described in the backend section.",
        "**Enquiry form** — posts to `propertyApi.inquire`, routing to the listing's agent.",
        "**Message the agent** — creates or reuses a conversation via `conversationApi.create`, then routes to `/messages/:id`.",
        "**Favourite and share** — the heart toggles optimistically and rolls back on failure.",
      ],
    },

    { t: "h2", text: "Dashboards" },

    {
      t: "p",
      text: "One page serves every role, and it asks the server which dashboard it should be: `dashboardApi.generic()` hits `GET /api/v1/dashboard`, which dispatches on the token's role. The client never branches on role to decide *what data* to fetch — only to decide what to *render*.",
    },

    {
      t: "image",
      src: "/images/web_app_dashboard.png",
      caption:
        "A signed-in dashboard. Stat tiles, the value of your shortlist, links to saved searches and messages, and — for listers — your own listings and your enquiry pipeline.",
      alt: "Web app dashboard with stats, shortlist value and listings",
    },

    {
      t: "p",
      text: 'The four Zustand stores feeding it are covered below; the notable pattern here is that the lister panels appear only for `agent`, `landlord` and `admin`, and the copy changes with the role — a buyer sees "Your shortlist", an agent sees "Your portfolio value".',
    },

    { t: "h2", text: "Listings, enquiries and messaging" },

    { t: "h3", text: "Listing management" },

    {
      t: "p",
      text: "Three routes share two components. `/listings` shows everything the user owns with an inline status dropdown and a delete action that retires the listing. `/listings/new` and `/listings/:id/edit` both render `features/listings/listing-form.tsx`, which validates on the client everything the Mongoose schema validates on the server.",
    },

    {
      t: "p",
      text: "`/listings/:id/media` is a dedicated media manager: upload by hosted URL, remove, and drag to reorder. Reordering calls `propertyApi.reorderMedia`, which validates that every media id belongs to the property before running the `bulkWrite`.",
    },

    { t: "h3", text: "The enquiry pipeline" },

    {
      t: "p",
      text: '`/inquiries` is the lister\'s view of the three-state pipeline, drawn as a linear stepper: `new → contacted → closed`. Each transition posts to `inquiryApi.setStatus`, and the server notifies the enquirer on every change. A "Message" action starts a conversation with the person who enquired.',
    },

    { t: "h3", text: "Messages" },

    {
      t: "p",
      text: "`/messages` is a two-pane layout: a conversation list beside a thread. It uses `conversationApi` over **REST only** — no socket connection, despite `socket.io-client` being present in `package.json` as an unused dependency.",
    },

    {
      t: "callout",
      kind: "warn",
      title: "The web chat is not realtime",
      text: "Messages arrive when the thread is opened or when the page is manually refreshed. Typing indicators, live delivery and push are mobile-only features. `socket.io-client` is declared in the web app's `package.json` but never imported anywhere in `src/` — a leftover from an earlier iteration. See [Realtime in the mobile app](/docs/mobile-app#h3-conversation).",
    },

    {
      t: "p",
      text: "Opening a thread marks it read via `conversationApi.markRead`. Message history paginates backwards with the `before` cursor, which is what lets an old thread stay usable without loading its entire history on every open.",
    },

    { t: "h2", text: "State management" },

    {
      t: "table",
      columns: ["Store", "Purpose", "Persisted?"],
      rows: [
        [
          "`auth-store`",
          "Session, bootstrap, password and OTP login, registration, logout.",
          "access token under `web:accessToken`",
        ],
        [
          "`favorites-store`",
          "`ids`, `status`, `error`, `pending`. `toggle` is optimistic and rolls back on failure.",
          "no — refetched per session by `ShortlistLoader`",
        ],
        [
          "`search-store`",
          "The filter set and the current view mode.",
          "yes — `web:search`",
        ],
        [
          "`property-details-store`",
          "Caches resolved listing details keyed by id, so a shortlist card can render fully without a request.",
          "no",
        ],
        ["`toast-store`", "Up to four toasts.", "no"],
      ],
    },

    { t: "h3", text: "The optimistic favourite toggle" },

    {
      t: "code",
      lang: "ts",
      title: "src/store/favorites-store.ts",
      code: `toggle: async (propertyId) => {
  const { ids } = get();
  const wasFavorite = ids.includes(propertyId);

  // 1. Flip locally so the heart responds instantly.
  set({ ids: wasFavorite
    ? ids.filter((id) => id !== propertyId)
    : [...ids, propertyId],
    pending: [...get().pending, propertyId] });

  try {
    // 2. Reconcile with the server.
    wasFavorite
      ? await favoriteApi.removeByBody(propertyId)
      : await favoriteApi.add(propertyId);
  } catch (error) {
    // 3. Roll back, and invalidate so the server stays the truth.
    set({ ids, error: (error as Error).message });
    queryStore.invalidate("get|/favorites");
  } finally {
    set({ pending: get().pending.filter((id) => id !== propertyId) });
  },
}`,
    },

    { t: "h3", text: "Server state" },

    {
      t: "p",
      text: "Server state is not in a store you manage by hand. `lib/query-store.ts` and `lib/api-cache.ts` provide the machinery, and `useQuery`/`useMutation` are the React bindings:",
    },

    {
      t: "ul",
      items: [
        "**`apiCache`** — an in-memory TTL cache for GET responses, with request deduplication so two components asking for the same URL at the same time produce one network call.",
        '**`queryStore`** — an observable registry of query status built on `useSyncExternalStore`, with prefix-based invalidation. `queryStore.invalidate("get|/properties")` after a mutation refreshes every listing list and detail view at once.',
        "**`withFreshCache`** — serves the cached value immediately and revalidates in the background, which is why navigating between two pages that share data shows no spinner.",
        "**`useMutation`** — wraps the write, handles the invalidation set and exposes pending and error state.",
      ],
    },

    {
      t: "callout",
      kind: "tip",
      title: "Why not React Query?",
      text: "A deliberate choice for a zero-dependency core. The three front ends share byte-identical copies of `api-client.ts`, `api-cache.ts` and `query-store.ts`, so the data layer can be reasoned about by reading ~400 lines rather than configuring a library. The cost is that none of React Query's devtools and cache introspection are available.",
    },

    { t: "h2", text: "The API client" },

    {
      t: "code",
      lang: "ts",
      title: "src/lib/api-client.ts — silent refresh",
      code: `let refreshPromise: Promise<string> | null = null;
let refreshUnavailable = false;

api.interceptors.response.use(undefined, async (error) => {
  const original = error.config;

  // A network failure is not an auth problem.
  if (!error.response || error.response.status !== 401 || refreshUnavailable) {
    throw toApiError(error);
  }

  // Single-flight: concurrent 401s share one refresh, not N.
  refreshPromise ??= api
    .post("/auth/refresh", undefined, { withCredentials: true })
    .then((r) => {
      const token = r.data.data.accessToken;
      setAccessToken(token);
      return token;
    })
    .catch((err) => {
      refreshUnavailable = true;   // stop the storm
      unauthorizedHandler?.();
      throw err;
    })
    .finally(() => {
      refreshPromise = null;
    });

  const token = await refreshPromise;

  // Replay the original request exactly once.
  original.headers.Authorization = \`Bearer \${token}\`;
  return api(original);
});`,
    },

    {
      t: "p",
      text: "Three details make this correct rather than merely functional. The single-flight promise stops a burst of parallel 401s from firing N refreshes. The latch stops a dead API from causing an unbounded retry loop. And `original` carries a `_retried` guard in the request layer so a replayed request that fails again does not re-enter the interceptor.",
    },

    { t: "h3", text: "API surface" },

    {
      t: "p",
      text: "`lib/api.ts` exports fifteen typed endpoint groups. Each is a thin named-function wrapper over the axios client — `propertyApi.search`, `conversationApi.send`, `savedSearchApi.run` and so on — which is why every call site in the app names its operation rather than repeating a URL.",
    },

    {
      t: "code",
      lang: "ts",
      title: "A representative group",
      code: `export const propertyApi = {
  search: (query: PropertyQuery) =>
    request<PropertyPage>({ method: "GET", url: "/properties", params: query }),

  detail: (id: string) =>
    request<Property>({ method: "GET", url: \`/properties/\${id}\` }),

  create: (body: PropertyInput) =>
    request<Property>({ method: "POST", url: "/properties", data: body }),

  update: (id: string, body: Partial<PropertyInput>) =>
    request<Property>({ method: "PATCH", url: \`/properties/\${id}\`, data: body }),

  remove: (id: string) =>
    request({ method: "DELETE", url: \`/properties/\${id}\` }),

  inquire: (id: string, message: string) =>
    request<Inquiry>({ method: "POST", url: \`/properties/\${id}/inquire\`, data: { message } }),

  addMedia: (id: string, body: MediaInput) =>
    request({ method: "POST", url: \`/properties/\${id}/media\`, data: body }),

  reorderMedia: (id: string, order: string[]) =>
    request({ method: "PATCH", url: \`/properties/\${id}/media/reorder\`, data: { order } }),

  priceHistory: (id: string) =>
    request<PriceHistory[]>({ method: "GET", url: \`/properties/\${id}/price-history\` }),

  similar: (id: string) =>
    request<Property[]>({ method: "GET", url: \`/properties/\${id}/similar\` }),

  reviews: (id: string) =>
    request<Review[]>({ method: "GET", url: \`/properties/\${id}/reviews\` }),
};`,
    },

    { t: "h2", text: "Components" },

    {
      t: "p",
      text: "Beyond the shadcn primitives, four feature modules carry most of the product.",
    },

    {
      t: "table",
      columns: ["Component", "Purpose"],
      rows: [
        [
          "`property/property-card.tsx`",
          "`PropertyCard` for grids and `PropertyRow` for dense lists, plus the shared `FavoriteButton` that dispatches the optimistic toggle.",
        ],
        [
          "`property/property-cover.tsx`",
          "`PropertyCover` — lazy-loads via `IntersectionObserver` and falls back to a deterministic seeded gradient, so a listing without photos still looks intentional.",
        ],
        [
          "`property/property-gallery.tsx`",
          "The tabbed media gallery and `PropertySpecStrip`.",
        ],
        [
          "`property/property-map.tsx`",
          "Leaflet with polygon drawing, search-this-area and a `StaticMap` variant.",
        ],
        [
          "`search/filter-panel.tsx`",
          "`FilterPanel` — a sheet on mobile, a tabbed sidebar on desktop.",
        ],
        [
          "`search/hero-search.tsx`",
          "`HeroSearch` — the autocomplete over `GET /search/suggest`.",
        ],
        [
          "`search/property-results.tsx`",
          "`ActiveFilterChips`, `SortMenu`, `ViewToggle`, `PropertyResultsGrid`, `ResultCount`.",
        ],
      ],
    },

    {
      t: "callout",
      kind: "info",
      title: "The seeded gradient",
      text: "`features/property-images.ts` exports `placeholderArt`, which derives a gradient from a hash of the property id. The result is stable for a given listing — it does not change on re-render or between sessions — which makes a photo-less listing look designed rather than broken. It is a small touch that does a lot of work for free.",
    },

    { t: "h2", text: "Styling" },

    {
      t: "p",
      text: "Tailwind v4 with no `tailwind.config.js` at all. The entire theme is declared in CSS with `@theme inline` over OKLCH colour values, and dark mode is a class-based custom variant.",
    },

    {
      t: "code",
      lang: "css",
      title: "src/index.css — the web app palette",
      code: `@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

:root {
  --radius: 0.65rem;

  --background: oklch(0.995 0.004 106);        /* ivory */
  --foreground: oklch(0.21 0.02 160);

  --primary: oklch(0.56 0.115 166);            /* emerald */
  --primary-foreground: oklch(0.99 0.01 160);

  --gold: oklch(0.76 0.13 82);                 /* accent detail */
  --surface-soft: oklch(0.975 0.006 160);

  --chart-1: oklch(0.56 0.115 166);
  --chart-2: oklch(0.7 0.14 60);
  /* … through --chart-5 */
}

.dark {
  --background: oklch(0.17 0.014 165);
  --primary: oklch(0.72 0.14 168);
  /* … the dark overrides */
}`,
    },

    {
      t: "p",
      text: "OKLCH is used throughout because it is perceptually uniform — a given lightness step looks the same across hues, which is not true of HSL. That is why the emerald primary reads correctly against both the ivory background and its dark counterpart without manual re-tuning.",
    },

    { t: "h2", text: "Environment" },

    {
      t: "code",
      lang: "env",
      title: "webApp/.env",
      code: `VITE_API_URL=http://localhost:4000/api/v1
VITE_API_DEBUG=false`,
    },

    {
      t: "callout",
      kind: "warn",
      title: "The README's variable names are stale",
      text: "The root `README.md` documents `REACT_APP_PUBLIC_URL` and `REACT_APP_CLOUDINARY_URL` from the CRA generation of this project. The current Vite apps read `VITE_API_URL`. Only Vite-prefixed variables are exposed to the client, and anything you need in the browser must be added to that allowlist explicitly.",
    },

    { t: "h2", text: "Running the web app" },

    {
      t: "code",
      lang: "bash",
      title: "Terminals",
      code: `# The API must be running
cd server && npm start

# The web app
cd client/webApp
echo "VITE_API_URL=http://localhost:4000/api/v1" > .env
npm run dev`,
    },

    {
      t: "callout",
      kind: "info",
      title: "Demo accounts",
      text: "The login screen lists four ready-made accounts — `buyer@example.com`, `renter@example.com`, `agent@example.com` and `landlord@example.com` — so you can walk every role's experience without creating anything. Registering is restricted to those four roles; `admin` is never offered in any public signup form.",
    },

    { t: "p", text: "Next: the same product in your pocket." },
  ],
};
