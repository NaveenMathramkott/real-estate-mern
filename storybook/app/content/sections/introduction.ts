import type { Section } from "~/content/types";

export const INTRODUCTION: Section = {
  slug: "introduction",
  title: "Introduction",
  nav: "Introduction",
  step: "01",
  summary:
    "What Tenementary is, the problem it solves, who it is for, and the complete feature list across every surface.",
  icon: "BookOpen",
  blocks: [
    {
      t: "lead",
      text: "Tenementary is a full-stack real-estate marketplace: a searchable catalogue of properties with a listing detail experience, enquiries, shortlists, messaging and a complete role-based admin console — built as four separate applications on one shared API.",
    },

    {
      t: "callout",
      kind: "info",
      title: "How to read this storybook",
      text: "The five sections follow the order the system was actually built, so each one only assumes what came before it. Read straight through for the full picture, or jump straight to the surface you care about using the sidebar.",
    },

    { t: "h2", text: "What problem it solves" },

    {
      t: "p",
      text: "Property search is still, in most markets, a form-filling exercise. You type a city name into a text box, get a grid of thumbnails, and then spend the next two weeks reconstructing the shape of the market from memory. The things that actually decide whether a home is right for you — how the rent compares to the surrounding street, which buildings nearby have a bad record, how far the commute really is — are either missing or buried.",
    },

    {
      t: "p",
      text: "Tenementary tries to close that gap with three ideas that run through every feature in the codebase:",
    },

    {
      t: "cards",
      cols: 3,
      items: [
        {
          title: "Search that behaves like a map, not a form",
          text: "Draw a polygon on the map, or tell it “within 20 minutes of here”, and it queries MongoDB's geospatial indexes rather than filtering a pre-fetched list. See [Polygon & commute search](/docs/backend#h2-geospatial-search).",
        },
        {
          title: "Context attached to every listing",
          text: "Areas, buildings and agencies are first-class records, not free-text strings. A listing belongs to a building; a building has reviews and an amenity list; an area has live price statistics.",
        },
        {
          title: "One account, four surfaces",
          text: "Buyer, renter, agent, landlord and admin are roles on a single user document. The same session works in the web app, the mobile app and the admin console.",
        },
      ],
    },

    { t: "h2", text: "Who it is for" },

    {
      t: "p",
      text: "Five roles exist on the platform. Three of them are business roles that carry real consequences, and the permission model treats them differently:",
    },

    {
      t: "table",
      columns: ["Role", "What they do", "What the app gives them"],
      rows: [
        [
          "**Buyer**",
          "Shorelists properties to purchase.",
          "Search, shortlist, save searches, enquire, chat, write reviews.",
        ],
        [
          "**Renter**",
          "Looks for a place to rent, on a budget.",
          "Everything the buyer has, plus price-first sorting and rental-only filtering.",
        ],
        [
          "**Agent**",
          "Markets properties on behalf of sellers.",
          "Everything above, **plus** a listing manager, media uploads, an enquiry pipeline and an agent dashboard.",
        ],
        [
          "**Landlord**",
          "Owns and lists properties directly.",
          "Identical to the agent surface — the roles differ in defaults, not capability.",
        ],
        [
          "**Admin**",
          "Operates the platform.",
          "The entire admin console: moderation queues, reference data, analytics and platform-wide search tooling.",
        ],
      ],
    },

    {
      t: "callout",
      kind: "tip",
      title: "Landlord and agent are deliberately near-identical",
      text: 'Both can create, edit, retire and media-manage listings, and both can work an enquiry pipeline. `requireRole("agent", "landlord", "admin")` shows up throughout the API, and the front ends collapse them into a single "lister" capability set. If you are extending the roles, this is the pair to start with.',
    },

    { t: "h2", text: "The four applications" },

    {
      t: "p",
      text: "The repository is a monorepo with four independently runnable applications. They are separate packages on purpose — they deploy separately, they have separate dependency trees, and the admin console is never shipped to the public site.",
    },

    {
      t: "table",
      columns: ["Application", "Path", "Stack", "Who runs it"],
      rows: [
        [
          "**Backend API**",
          "`server/`",
          "Node, Express 4, Mongoose 8, Socket.IO, Swagger",
          "Deployed to a Node host or serverless container",
        ],
        [
          "**Admin panel**",
          "`client/adminPanel/`",
          "Vite 8, React 19, shadcn/ui, Tailwind v4, Recharts",
          "Internal staff",
        ],
        [
          "**Web app**",
          "`client/webApp/`",
          "Vite 8, React 19, React Router 7, Leaflet, Zustand",
          "The public",
        ],
        [
          "**Mobile app**",
          "`client/mobileApp/`",
          "Expo SDK 57, React Native 0.86, Expo Router, gluestack-ui",
          "iOS and Android",
        ],
      ],
    },

    { t: "h2", text: "Feature tour" },

    {
      t: "p",
      text: "Every feature below exists in the shipped code, not in a backlog. Each one links to the section that documents it in full.",
    },

    { t: "h3", text: "Discovery" },

    {
      t: "ul",
      items: [
        "**Multi-facet search** — purpose, type, city, beds, price range, furnishing, amenities and free text, all combinable in one request. See [GET /properties](/docs/backend#h2-properties).",
        "**Polygon search** — draw a shape on the map and get every listing whose point falls inside it, via `$geoIntersects`. See [Geospatial search](/docs/backend#h2-geospatial-search).",
        "**Commute search** — give it an address or coordinates and a travel time; it computes an isochrone radius and returns everything inside it. See [POST /search/commute](/docs/backend#h2-geospatial-search).",
        "**Typeahead** — a single lightweight endpoint that blends area names with live listing addresses. See [GET /search/suggest](/docs/backend#h2-geospatial-search).",
        "**Similar properties** — matched on purpose, type, price within ±20%, beds ±1 and within 5 km. See [GET /properties/:id/similar](/docs/backend#h2-properties).",
        "**Area insights** — live count, average, min, max and median price, broken down by purpose, type, bedroom count and rating. See [GET /areas/:id/insights](/docs/backend#h2-areas-and-buildings).",
      ],
    },

    { t: "h3", text: "Listing experience" },

    {
      t: "ul",
      items: [
        "**Media galleries** — images, video, floor plans and virtual tours, ordered and reorderable by the owner. See [Property media](/docs/backend#h2-property-media).",
        "**Price history** — every price change is recorded, so a listing can show whether it is going up or coming down. See [GET /properties/:id/price-history](/docs/backend#h2-properties).",
        "**Building reviews** — one to five star reviews plus a written body, aggregated into a rating distribution. See [Reviews](/docs/backend#h2-reviews).",
        "**Structured address & location** — GeoJSON `Point` coordinates on every listing, validated before save. See [The property model](/docs/backend#h2-the-property-model).",
      ],
    },

    { t: "h3", text: "Engagement" },

    {
      t: "ul",
      items: [
        "**Shortlists** — favourites, saved with a unique index so adding twice is a no-op. See [Favourites](/docs/backend#h2-favourites).",
        "**Saved searches** — store a filter set and re-run it later, with an alert frequency of off, daily, weekly or instant. See [Saved searches](/docs/backend#h2-saved-searches).",
        "**Enquiries** — a lead pipeline with `new → contacted → closed` states that emits a notification on every transition. See [Enquiries](/docs/backend#h2-enquiries).",
        "**Realtime chat** — Socket.IO with JWT-authenticated handshakes, per-user rooms and per-conversation rooms, plus typing indicators. See [Realtime](/docs/backend#h2-realtime).",
        "**Notifications** — a persisted, readable-at-timestamped feed that both REST and the socket layer write to. See [Notifications](/docs/backend#h2-notifications).",
      ],
    },

    { t: "h3", text: "Operations" },

    {
      t: "ul",
      items: [
        "**Verification queues** — users, properties and agencies each have a verification flag that admins toggle from the dashboard. See [GET /dashboard/admin](/docs/backend#h2-dashboards).",
        "**Reference data management** — areas, buildings and agencies are full CRUD resources with polygon validation and referential-integrity guards. See [Areas & buildings](/docs/backend#h2-areas-and-buildings).",
        "**Live OpenAPI docs** — the server generates and serves a complete OpenAPI 3.0.3 specification at `/api-docs`, assembled from shared component helpers. See [Swagger](/docs/backend#h2-swagger-and-openapi).",
      ],
    },

    { t: "h2", text: "Tech stack at a glance" },

    {
      t: "table",
      columns: ["Layer", "Technology", "Version"],
      rows: [
        ["Runtime", "Node.js", "`>= 20`"],
        ["Server framework", "Express", "`^4.19.2`"],
        ["Database", "MongoDB via Mongoose", "`^8.3.1`"],
        ["Realtime", "Socket.IO", "`^4.8.4`"],
        [
          "Authentication",
          "JWT access + rotating refresh tokens, bcrypt",
          "`^9.0.3`, `^5.1.1`",
        ],
        ["API documentation", "Swagger UI Express", "`^5.0.1`"],
        ["Caching", "Upstash Redis", "`^1.39.0`"],
        ["Media", "Cloudinary", "`^2.11.0`"],
        ["Web build", "Vite", "`^8.3.0`"],
        ["Web UI", "React + React Router", "`^19.2`, `^7.18`"],
        ["Component library", "shadcn/ui on Radix + Tailwind v4", "`—`"],
        ["Maps (web)", "Leaflet + react-leaflet", "`^5.0.0`"],
        ["Maps (mobile)", "react-native-maps", "`^1.27.2`"],
        [
          "Mobile runtime",
          "Expo SDK 57 / React Native",
          "`~57.0.30`, `0.86.3`",
        ],
        ["Mobile UI", "gluestack-ui v5 + UniWind", "`^5.0.15`, `^1.12.2`"],
        ["State", "Zustand", "`^5.0.15`"],
        ["Charts", "Recharts", "`^3.10.1`"],
        ["Language", "TypeScript (all three front ends)", "`~5.9 / ~6.0`"],
      ],
    },

    { t: "h2", text: "A note on the 3D tours" },

    {
      t: "p",
      text: "The original repository README advertised immersive Three.js property tours, and that was accurate for the first generation of this codebase. The current rewrite removed it: there is no `three`, no `@react-three/fiber` and no WebGL scene anywhere in the three front ends.",
    },

    {
      t: "p",
      text: "What replaced it is arguably more useful. Rather than a rendering of the property, the platform now renders the *context* around it — Leaflet on the web, `react-native-maps` on mobile — with polygon, radius and commute search over real MongoDB `2dsphere` indexes. The `tour` media type survives as a slot in the gallery model for future use, but nothing renders it as 3D today.",
    },

    {
      t: "callout",
      kind: "info",
      title: "Why document the discrepancy?",
      text: "Because this documentation describes the code that exists, not the code that once existed. If you follow the README's Three.js badge to this storybook expecting a WebGL walkthrough, you would be confused. The map system is documented instead — it is the more instructive half of the story anyway, because it touches geospatial indexes, Redis caching and polygon validation.",
    },

    { t: "h2", text: "The five sections" },

    {
      t: "cards",
      cols: 1,
      items: [
        {
          title: "01 — Introduction",
          text: "This page. The problem, the roles, the features and the stack.",
          href: "/docs/introduction",
        },
        {
          title: "02 — The Backend",
          text: "The Express service in full: 51 endpoints, 15 Mongoose models, the auth system, the Socket.IO layer, caching, Swagger and the environment contract.",
          href: "/docs/backend",
        },
        {
          title: "03 — Admin Panel",
          text: "The shadcn/ui operations console — 17 screens covering dashboards, moderation, reference data, shortlists, conversations and analytics.",
          href: "/docs/admin-panel",
        },
        {
          title: "04 — Web App",
          text: "The public React 19 site — 16 routes covering search, listing detail, maps, shortlists, enquiries, messaging and listing management.",
          href: "/docs/web-app",
        },
        {
          title: "05 — Mobile App",
          text: "The Expo app — every screen in the tab navigator and the stack, gluestack-ui theming, secure storage and the realtime chat implementation.",
          href: "/docs/mobile-app",
        },
      ],
    },

    { t: "h2", text: "Running it locally" },

    {
      t: "p",
      text: "Four terminals, four commands. Clone the repository, start the API first, then whichever surfaces you want.",
    },

    {
      t: "code",
      lang: "bash",
      title: "Clone and install",
      code: `git clone https://github.com/NaveenMathramkott/Tenementary-property-finder.git
cd Tenementary-property-finder

# The API
cd server && npm install && cp .env.example .env

# The web app
cd ../client/webApp && npm install

# The admin console
cd ../client/adminPanel && npm install

# The mobile app
cd ../client/mobileApp && npm install`,
    },

    {
      t: "code",
      lang: "env",
      title: "server/.env",
      code: `PORT=4000
NODE_ENV=development
MONGODB_URL=mongodb+srv://user:password@cluster.mongodb.net/tenementary

# Origins allowed by CORS — mobile apps send no Origin header
CLIENT_URL=http://localhost:8081
CLIENT_WEB_URL=http://localhost:5173

# Auth
JWT_SECRET_KEY=replace-with-a-long-random-string
JWT_REFRESH_SECRET_KEY=replace-with-a-different-long-random-string
JWT_ACCESS_TIME=15m
JWT_REFRESH_TIME=7d
OTP_SECRET_KEY=replace-with-a-third-random-string

# Media
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Optional cache — everything degrades to a no-op without it
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=`,
    },

    {
      t: "callout",
      kind: "warn",
      title: "CLIENT_URL is the mobile app",
      text: "CORS is an allowlist of exactly two origins: `CLIENT_URL` (the Expo app, served from `exp://` or `http://localhost:8081`) and `CLIENT_WEB_URL` (Vite). Change both if you serve the front ends from different hosts, or every request will fail the preflight.",
    },

    {
      t: "code",
      lang: "bash",
      title: "Start each application",
      code: `# Terminal 1 — the API on :4000
cd server && npm start

# Terminal 2 — the public web app on :5173
cd client/webApp && npm run dev

# Terminal 3 — the admin console on :5174
cd client/adminPanel && npm run dev

# Terminal 4 — the mobile app
cd client/mobileApp && npm start`,
    },

    {
      t: "p",
      text: "With the API running, its live OpenAPI documentation is at `http://localhost:4000/api-docs` and the raw specification at `http://localhost:4000/api-docs.json`. That is worth bookmarking — it is generated from the same code that serves the API, so it never drifts.",
    },

    { t: "h2", text: "Reading the API" },

    {
      t: "p",
      text: "Every endpoint in this documentation is listed with its HTTP method, full path including the `/api/v1` prefix, the authentication it requires and a one-line description. Where a request takes a body, the fields are listed separately with types and whether they are required.",
    },

    {
      t: "code",
      lang: "bash",
      title: "A typical authenticated request",
      code: `# Public — no token needed
curl http://localhost:4000/api/v1/properties?purpose=rent&beds=2&limit=5

# Authenticated — create a shortlist entry
curl -X POST http://localhost:4000/api/v1/favorites \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <accessToken>" \\
  -d '{ "propertyId": "65f0c1a2b3c4d5e6f7a8b9c0" }'`,
    },

    {
      t: "callout",
      kind: "tip",
      title: "Access tokens are short-lived by design",
      text: "An access token lives 15 minutes and arrives in both an `Authorization: Bearer` header and an httpOnly cookie. When it expires the client silently calls `POST /api/v1/auth/refresh`, stores the rotated token and replays the original request. Refresh tokens last 7 days and are capped at 10 per user — see [Authentication](/docs/backend#h2-authentication).",
    },
  ],
};
