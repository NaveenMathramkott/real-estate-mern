import type { Section } from "~/content/types";

export const ADMIN_PANEL: Section = {
  slug: "admin-panel",
  title: "Admin Panel",
  nav: "Admin Panel",
  step: "03",
  summary:
    "The internal operations console — dashboards, moderation queues, reference data management and analytics.",
  icon: "LayoutDashboard",
  blocks: [
    {
      t: "lead",
      text: 'The admin panel is a completely separate Vite application built with shadcn/ui. It is never shipped to the public site, it has its own bundle, its own token key and its own indigo-and-slate theme — and it is the only place in the system where `requireRole("admin")` applies.',
    },

    {
      t: "callout",
      kind: "info",
      title: "Screenshots",
      text: "The images on this page are real captures from the running console. File names follow the pattern `admin_panel_<screen>.png` and each one is labelled with what it demonstrates.",
    },

    { t: "h2", text: "Why a separate application" },

    {
      t: "p",
      text: "The admin console could have been more routes inside the web app, and the obvious early decision was not to do that. Four reasons justify the split:",
    },

    {
      t: "ul",
      items: [
        "**Different audience, different bundle.** The public site ships map rendering, Recharts and a large property UI kit to every visitor. None of that is needed to approve a user account.",
        '**Different theme.** The web app uses an ivory-and-emerald palette; the console uses an indigo-and-slate "ops" palette with a full set of sidebar tokens. Sharing one `index.css` would mean shipping both themes to everyone.',
        "**Different token storage.** The web app writes `web:accessToken`; the console writes `tap:accessToken`. A staff session never overwrites a visitor session in the same browser.",
        "**Different release risk.** A broken internal tool should never be able to break the public site.",
      ],
    },

    {
      t: "image",
      src: "/images/admin_panel_dashboard.png",
      caption:
        "The admin dashboard — platform KPIs, a listings bar chart, a role-composition pie chart, verification queues and recent activity, all in one scroll.",
      alt: "Admin panel dashboard showing KPIs, charts and verification queues",
    },

    { t: "h2", text: "Stack and configuration" },

    {
      t: "code",
      lang: "json",
      title: "adminPanel/components.json — the shadcn manifest",
      code: `{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "~/components",
    "utils": "~/lib/utils",
    "ui": "~/components/ui",
    "lib": "~/lib",
    "hooks": "~/hooks"
  },
  "iconLibrary": "lucide"
}`,
    },

    {
      t: "p",
      text: "Because this is a genuine shadcn project, any component can be added at any time with `npx shadcn@latest add <component>` and it will land in `src/components/ui/` styled by the same tokens. The 24 primitives currently present are all generated this way — none were hand-written.",
    },

    {
      t: "table",
      columns: ["Concern", "Choice", "Notes"],
      rows: [
        [
          "Framework",
          "Vite 8 + React 19",
          "`vite.config.ts` also enables Babel and the React Compiler.",
        ],
        [
          "Routing",
          "React Router 7",
          "An explicit route tree in `app-routes.tsx`, every page `React.lazy`.",
        ],
        [
          "Components",
          "shadcn/ui (new-york) on Radix",
          "24 primitives in `components/ui/`.",
        ],
        [
          "Styling",
          "Tailwind CSS v4",
          "CSS-first `@theme` tokens in `index.css`. No `tailwind.config.js`.",
        ],
        [
          "Icons",
          "lucide-react",
          "The one icon library, matching `iconLibrary` in the manifest.",
        ],
        [
          "Charts",
          "Recharts",
          "`BarChart`, `PieChart` and `AreaChart` across three pages.",
        ],
        [
          "Maps",
          "Leaflet + react-leaflet",
          "Point and polygon pickers in the listing and area editors.",
        ],
        ["State", "Zustand", "Three stores: auth, toasts and UI preferences."],
        ["HTTP", "axios", "The same wrapper as the web app and mobile app."],
        ["Language", "TypeScript", "Strict mode."],
      ],
    },

    { t: "h3", text: "Theme tokens" },

    {
      t: "code",
      lang: "css",
      title: "src/index.css — the console palette",
      code: `:root {
  --primary: oklch(0.52 0.19 268);          /* indigo, not emerald */
  --sidebar: oklch(0.99 0.002 260);
  --sidebar-accent: oklch(0.95 0.015 268);
  --sidebar-border: oklch(0.92 0.006 260);
}

.dark {
  --primary: oklch(0.68 0.16 268);
  --sidebar: oklch(0.19 0.015 268);
  /* … the rest of the console token set */
}`,
    },

    {
      t: "p",
      text: "The 192-line `index.css` is a sibling of the web app's 381-line file, and the difference in size tells you most of what differs between the two: the console carries a full `--sidebar-*` token family because its navigation is a persistent, collapsible, labelled sidebar rather than a marketing header.",
    },

    { t: "h2", text: "Application shell" },

    {
      t: "p",
      text: "Every authenticated route renders inside `AppShell`, which is a three-part composition: a collapsible `Sidebar`, a `Topbar` with global search and a notification bell, and the scrolling page region.",
    },

    {
      t: "code",
      lang: "bash",
      title: "src/components/layout/",
      code: `layout/
├── app-shell.tsx   Collapsible sidebar + topbar + content region
├── sidebar.tsx     SidebarContent — renders navGroups
├── topbar.tsx      Global suggest search, notification bell, theme, user menu
└── nav-items.ts    The navigation model, grouped
`,
    },

    { t: "h3", text: "Navigation model" },

    {
      t: "p",
      text: "The navigation is data, not markup. `nav-items.ts` exports an array of groups, and `SidebarContent` maps over it. Adding a page is a one-line data change.",
    },

    {
      t: "table",
      columns: ["Group", "Items"],
      rows: [
        ["**Overview**", "Dashboard, Inquiries"],
        ["**Marketplace**", "Properties, Search Lab"],
        ["**Reference Data**", "Users, Agencies, Areas, Buildings"],
        ["**Engagement**", "Reviews, Shortlists, Conversations, Notifications"],
        ["**System**", "Profile, Analytics"],
      ],
    },

    { t: "h3", text: "The topbar's three jobs" },

    {
      t: "ul",
      items: [
        "**Global search** — a combobox wired to `searchApi.suggest`, so an admin can jump from a typed address to a listing without leaving the screen.",
        "**Notification bell** — polls `notificationApi.list({ limit: 8 })` and shows an unread dot. Deliberately polling rather than socket-based: the console has no realtime dependency at all.",
        "**Theme toggle and user menu** — the toggle writes to `useUiStore` and toggles `.dark` on `<html>`; the menu exposes the current profile and sign-out.",
      ],
    },

    { t: "h2", text: "Routing and guards" },

    {
      t: "code",
      lang: "tsx",
      title: "src/app-routes.tsx",
      code: `export default function App() {
  return (
    <Routes>
      {/* Public — the only route reachable without a session. */}
      <Route path="/login" element={<LoginPage />} />

      {/* Everything else sits behind RequireAuth, inside the shell. */}
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/properties" element={<PropertiesPage />} />
          <Route path="/properties/:id" element={<PropertyDetailPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/agencies" element={<AgenciesPage />} />
          <Route path="/areas" element={<AreasPage />} />
          <Route path="/buildings" element={<BuildingsPage />} />
          <Route path="/inquiries" element={<InquiriesPage />} />
          <Route path="/conversations" element={<ConversationsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/shortlists" element={<ShortlistsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}`,
    },

    {
      t: "p",
      text: 'Note the difference from the public web app: there is no `RequireRole` in the console, because every route in it is admin-only. The guard that matters is `requireRole("admin")` on the server — a non-admin who reaches `/admin` gets past the client guard and is refused at the API on the first call.',
    },

    { t: "h2", text: "Every screen" },

    {
      t: "table",
      columns: ["Route", "Screen", "What it does", "APIs"],
      rows: [
        [
          "`/`",
          "Dashboard",
          "Platform KPIs, listing composition charts, verification queues for users, properties and agencies, recent activity.",
          "`dashboardApi.admin()`",
        ],
        [
          "`/properties`",
          "Properties",
          "The main listings table with filtering, a `LocationField` map picker, create-listing dialog, verification toggles and pagination.",
          "`propertyApi.search`, `propertyApi.create`, `dashboardApi.verifyProperty`",
        ],
        [
          "`/properties/:id`",
          "Property detail",
          "The full editor — 1,201 lines. Basic info, media reordering, a price-history `AreaChart`, similar listings, reviews, verification and a test-enquiry form.",
          "`propertyApi.*`, `dashboardApi.verifyProperty`",
        ],
        [
          "`/search`",
          "Search Lab",
          "A developer-facing playground for the three search endpoints, with tabs for suggest, polygon and commute. Ships with a sample Connaught Ring polygon.",
          "`searchApi.suggest`, `searchApi.polygon`, `searchApi.commute`",
        ],
        [
          "`/users`",
          "Users",
          "The user list and verification queue, plus a profile detail dialog.",
          "`dashboardApi.admin`, `dashboardApi.verifyUser`, `profileApi.of`",
        ],
        [
          "`/agencies`",
          "Agencies",
          "Full CRUD over agencies, with the verification toggle.",
          "`agencyApi.*`, `dashboardApi.verifyAgency`",
        ],
        [
          "`/areas`",
          "Areas",
          "Area CRUD with a polygon `LocationField` and an inline price-distribution bar.",
          "`areaApi.*`",
        ],
        [
          "`/buildings`",
          "Buildings",
          "Building CRUD with point location, amenities and review management.",
          "`buildingApi.*`",
        ],
        [
          "`/inquiries`",
          "Inquiries",
          "Every lead on the platform with the status stepper.",
          "`inquiryApi.list`, `inquiryApi.setStatus`",
        ],
        [
          "`/conversations`",
          "Conversations",
          "A read-oriented chat browser. Manual send over REST — the console has no socket.",
          "`conversationApi.*`",
        ],
        [
          "`/notifications`",
          "Notifications",
          "The platform notification feed with mark-read controls.",
          "`notificationApi.*`",
        ],
        [
          "`/reviews`",
          "Reviews",
          "Create and delete reviews against any target via `ReviewTargetPicker`.",
          "`reviewApi.*`",
        ],
        [
          "`/shortlists`",
          "Shortlists",
          "Two tabs — favourites and saved searches — with a listing picker for creating searches.",
          "`favoriteApi.*`, `savedSearchApi.*`, `propertyApi.search`",
        ],
        [
          "`/analytics`",
          "Analytics",
          "Three tabs: composition, verification and pricing trends, all from the admin dashboard payload plus a sampled listing query.",
          "`dashboardApi.admin`, `propertyApi.search`",
        ],
        [
          "`/profile`",
          "Profile",
          "Edit profile and preferences, plus a connectivity button that calls `authApi.health()`.",
          "`profileApi.*`, `authApi.me`, `authApi.health`",
        ],
        [
          "`/login`",
          "Login",
          "Password and OTP sign-in, with the demo accounts listed.",
          "`authApi.login`, `authApi.requestOtp`, `authApi.verifyOtp`",
        ],
      ],
    },

    { t: "h3", text: "Dashboard" },

    {
      t: "p",
      text: "Everything on this screen comes from one call. `GET /dashboard/admin` returns platform totals, users grouped by role, three verification queues and closed-deal value, and the page composes them into stat tiles, two Recharts visualisations and three actionable queues.",
    },

    {
      t: "image",
      src: "/images/admin_panel_dashboard.png",
      caption:
        "The dashboard. Stat tiles across the top, a listings-by-type bar chart and a role-composition pie chart beneath, then the verification queues where staff spend most of their time.",
      alt: "Admin dashboard with KPI tiles, charts and verification queues",
    },

    { t: "h3", text: "Properties" },

    {
      t: "p",
      text: "The operational heart of the console. A filterable, paginated table of every listing on the platform, with the ability to create a listing on behalf of a user, verify one, or open it in the full editor.",
    },

    {
      t: "image",
      src: "/images/admin_panel_properties.png",
      caption:
        "The properties screen — filterable table, bulk actions and the create-listing dialog with its map-based location picker.",
      alt: "Admin properties list with filters and create dialog",
    },

    {
      t: "p",
      text: "At 931 lines it is the second-largest screen in the console. The bulk of that is the create-listing dialog, which has to validate on the client every field the Mongoose schema validates on the server — an enum of five property types, a purpose enum, a required GeoJSON point and a non-negative price.",
    },

    { t: "h3", text: "The `LocationField`" },

    {
      t: "p",
      text: "Three screens need coordinates, and all three share one component in `features/shared/location-field.tsx`. It operates in two modes and supports three input styles:",
    },

    {
      t: "ul",
      items: [
        "**Map picker** — click the map to set a point, or switch to polygon mode and click vertices. The ring is closed automatically and stored as `[lng, lat]` pairs.",
        "**Numeric entry** — separate longitude and latitude fields, for when you already know the coordinates.",
        "**Pasted link** — paste a Google Maps URL and the coordinates are extracted from it. This is the feature that saves the most time in practice.",
      ],
    },

    { t: "h3", text: "Property detail" },

    {
      t: "p",
      text: "The 1,201-line editor is the largest single file in any of the three front ends. It covers basic information, media upload and reordering, price history, similar listings, building reviews, verification and a self-service enquiry form for testing the lead flow.",
    },

    {
      t: "callout",
      kind: "info",
      title: "Why one file is so large",
      text: "It is a route-level editor that composes roughly eleven independent concerns — each media row, each price-history point, each similar listing, each review — and each of those has its own mutation and its own invalidation target. Splitting it would have meant a dozen prop-drilling layers for state that only this route uses. If you extend it, extract the *sections* first, not the primitives.",
    },

    { t: "h3", text: "Search Lab" },

    {
      t: "p",
      text: "The one screen that is not really an admin screen. It exposes the three geospatial endpoints as a developer tool, with a tab per mode and the raw JSON response printed below the input.",
    },

    {
      t: "cards",
      cols: 3,
      items: [
        {
          title: "Suggest",
          text: "Typeahead against `GET /search/suggest`. The same endpoint the topbar search uses.",
        },
        {
          title: "Polygon",
          text: "Editable vertices with a hard-coded sample ring preloaded, so the tab is useful immediately.",
        },
        {
          title: "Commute",
          text: "Address or coordinates plus minutes and speed, posting to `/search/commute`.",
        },
      ],
    },

    { t: "h3", text: "Shortlists" },

    {
      t: "p",
      text: "Two tabs over one screen. The favourites tab lists shortlisted properties and can add or remove them. The saved searches tab creates a search from a picked set of listings and runs a saved search to preview its live results.",
    },

    {
      t: "callout",
      kind: "warn",
      title: "There is no `GET /api/v1/users`",
      text: "The users screen is not backed by a users endpoint — it reads the verification queue out of `GET /dashboard/admin` and writes through `PATCH /dashboard/admin/users/:id/verify`. That is an unusual shape, and it means the console can approve and review accounts but cannot paginate or search the full user base. If you need real user administration, that endpoint has to be built first.",
    },

    { t: "h3", text: "Conversations" },

    {
      t: "image",
      src: "/images/admin_panel_conversations.png",
      caption:
        "The conversations browser — a thread list beside a message transcript. Sending is manual: there is no socket connection in the admin app, so a message is only delivered when someone presses send.",
      alt: "Admin panel conversations thread browser",
    },

    {
      t: "p",
      text: "This screen exists for moderation and dispute resolution — an operator needs to be able to read what two users said, which is a legitimate reason for it to be read-capable. Writing is included because testing the lead flow end to end sometimes requires it.",
    },

    { t: "h3", text: "Analytics" },

    {
      t: "p",
      text: 'Three tabs, and a candid note about their data sources. Composition and verification come entirely from the admin dashboard payload. Pricing does not: it runs a separate `propertyApi.search({ limit: 100, purpose: "rent" })` query and charts the result.',
    },

    {
      t: "image",
      src: "/images/admin_panel_analytics.png",
      caption:
        "The analytics screen — a composition tab charting how the listing base is split, a verification tab tracking the moderation queue, and a pricing tab plotting rent against time.",
      alt: "Admin panel analytics charts for composition, verification and pricing",
    },

    {
      t: "callout",
      kind: "warn",
      title: "The pricing tab charts a sample, not the market",
      text: "It plots a 100-listing sample of rental listings, not an aggregate over the whole table. That is fine for a visual trend and misleading for any decision made on the numbers. A real pricing chart wants a server-side aggregation endpoint, in the same spirit as `getAreaInsights`.",
    },

    { t: "h2", text: "State management" },

    {
      t: "p",
      text: "Three Zustand stores. Two of them — auth and toasts — are near-identical copies of the web app's stores; only the token key and the role typing differ.",
    },

    {
      t: "table",
      columns: ["Store", "Holds", "Persisted?"],
      rows: [
        [
          "`auth-store`",
          "`user`, `status`, `error`, `otpEmail` and the `login`, `loginWithOtp`, `sendOtp`, `register`, `logout`, `bootstrap` actions.",
          "Access token under `tap:accessToken`",
        ],
        [
          "`ui-store`",
          "`theme`, `sidebarCollapsed`, `mobileNavOpen`. Seeds `theme` from `prefers-color-scheme` and applies `.dark` to `<html>`.",
          "yes — `tap:theme`, `tap:sidebar`",
        ],
        ["`toast-store`", "Up to four toasts with `push` and `dismiss`.", "no"],
      ],
    },

    { t: "h3", text: "Server state: `queryStore` and `apiCache`" },

    {
      t: "p",
      text: "Rather than pulling in React Query, all three front ends share a hand-rolled pair: an in-memory TTL cache for GET responses and a `useSyncExternalStore`-based observable registry for query status.",
    },

    {
      t: "code",
      lang: "ts",
      title: "src/lib/query-store.ts",
      code: `export const queryStore = {
  subscribe(listener) { /* … */ },
  snapshot(key) { /* … */ },
  age(key) { /* ms since last success */ },

  // Prefix-based invalidation: "get|/properties" invalidates
  // every query whose key starts with that string, so a single
  // mutation can refresh a list and its detail view at once.
  invalidate(...prefixes: string[]) { /* … */ },

  resetAll() { /* … */ },
};`,
    },

    {
      t: "p",
      text: "The API layer mirrors this with `useQuery` and `useMutation` hooks. A query deduplicates by key, serves from cache while fresh, and revalidates in the background — which is why navigating between two admin pages that share a listing rarely shows a spinner twice.",
    },

    { t: "h2", text: "Shared components" },

    {
      t: "p",
      text: "Beyond the 24 shadcn primitives, three feature modules are specific to the console:",
    },

    {
      t: "table",
      columns: ["File", "Exports", "Purpose"],
      rows: [
        [
          "`features/shared/widgets.tsx`",
          "`StatCard`, `Pagination`, `ConfirmDialog`, `VerifyToggle`, `CountBar`, `MeterRow`",
          "The recurring patterns: KPI tiles, paging, destructive-action confirmation and the verification switch.",
        ],
        [
          "`features/shared/location-field.tsx`",
          "`MapPicker`, `LocationField`",
          "Point and polygon entry, with the three input modes described above.",
        ],
        [
          "`features/reviews/review-target-picker.tsx`",
          "`ReviewTargetPicker`, `ReviewTargetValue`",
          "Chooses a review target across buildings, areas and properties.",
        ],
      ],
    },

    {
      t: "p",
      text: "`features/shared/status-badge.tsx` provides `StatusBadge`, the single component that maps the five listing statuses — `draft`, `active`, `rented`, `sold`, `expired` — to a consistent colour. It appears in the table, the detail editor and the analytics views, so a listing never changes colour between screens.",
    },

    { t: "h2", text: "Authentication in the console" },

    {
      t: "code",
      lang: "ts",
      title: "src/store/auth-store.ts",
      code: `// The console's token lives under its own key so it never collides
// with a visitor session in the same browser.
const ACCESS_TOKEN_KEY = "tap:accessToken";

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  status: "idle",
  error: null,
  otpEmail: null,

  bootstrap: async () => {
    set({ status: "loading" });
    try {
      // Raced against a 10s timeout so a dead API does not hang the shell.
      const user = await withTimeout(authApi.me(), 10_000);
      set({ user, status: "authenticated" });
    } catch {
      set({ user: null, status: "unauthenticated" });
    }
  },

  logout: async () => {
    await authApi.logout().catch(() => {});
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    apiCache.clear();
    queryStore.resetAll();
    set({ user: null, status: "unauthenticated" });
  },
}));`,
    },

    {
      t: "p",
      text: "The 10-second race during `bootstrap` is worth noting: it is the difference between the console showing a spinner and showing a usable error page when the API is down. The web app does the same thing.",
    },

    { t: "h3", text: "Token refresh" },

    {
      t: "p",
      text: 'Shared behaviour from `lib/api-client.ts`. On a 401 the axios interceptor fires a single-flight `POST /auth/refresh`, stores the rotated access token and replays the original request exactly once. A `refreshUnavailable` latch stops a dead API from causing a refresh storm, and `setUnauthorizedHandler` clears the session and raises a "Session expired" toast.',
    },

    { t: "h2", text: "Running the console" },

    {
      t: "code",
      lang: "bash",
      title: "Terminals",
      code: `# The API must be running first
cd server && npm start

# Then the console
cd client/adminPanel
cp .env.example .env
npm run dev`,
    },

    {
      t: "code",
      lang: "env",
      title: "adminPanel/.env",
      code: `VITE_API_URL=http://localhost:4000/api/v1
VITE_API_DEBUG=false`,
    },

    {
      t: "callout",
      kind: "tip",
      title: "Signing in",
      text: 'The console needs an account with `role: "admin"`. Registration never offers that role — `SELECTABLE_ROLES` on both the web app and the mobile app is `buyer`, `renter`, `agent`, `landlord`. Promote an account directly in the database, or seed one, before first run.',
    },

    {
      t: "p",
      text: "Next: the public web app — the same API seen through the visitor's experience.",
    },
  ],
};
