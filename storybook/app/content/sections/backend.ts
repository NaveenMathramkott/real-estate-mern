import type { Section } from "~/content/types";

export const BACKEND: Section = {
  slug: "backend",
  title: "The Backend",
  nav: "Backend",
  step: "02",
  summary:
    "The Node, Express and MongoDB API: every endpoint, every Mongoose model, the realtime layer and the auth system.",
  icon: "Server",
  blocks: [
    {
      t: "lead",
      text: "The API is a single Express service. It owns authentication, the 15 Mongoose models, 51 REST endpoints, a Socket.IO gateway and a generated OpenAPI specification. All three front ends are clients of this one service — none of them talks to MongoDB directly.",
    },

    {
      t: "callout",
      kind: "info",
      title: "Everything below is verifiable",
      text: "The service publishes its own OpenAPI document at `/api-docs.json`. Every endpoint, field name, enum value and index described here matches that specification, which is generated from the same code that serves the requests.",
    },

    { t: "h2", text: "Architecture" },

    {
      t: "p",
      text: "`server/server.js` is the only entry point, and it wires the application together in a deliberate order. Each step depends on the one before it:",
    },

    {
      t: "code",
      lang: "js",
      title: "server/server.js",
      code: `import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import http from "node:http";

import { connectDB } from "./config/db.js";
import { API_PREFIX, swaggerDocument } from "./config/swagger/index.js";
import { initSocket } from "./config/socket.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

import authRoute from "./routes/authRoute.js";
import propertyRoute from "./routes/propertyRoute.js";
// …one import per router

const app = express();
const server = http.createServer(app);

// 1. Database first — every controller assumes a live connection.
await connectDB();

// 2. CORS against exactly two origins, credentials enabled for the cookie.
app.use(
  cors({
    origin: [process.env.CLIENT_URL, process.env.CLIENT_WEB_URL],
    credentials: true,
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

// 3. A coarse global ceiling; the auth router adds its own tighter limiter.
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 1000,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

// 4. The generated OpenAPI document and its UI.
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get("/api-docs.json", (_req, res) => res.json(swaggerDocument));

app.get(\`\${API_PREFIX}/health\`, (_req, res) =>
  res.json({ success: true, status: "ok" }),
);

// 5. Every router hangs off the versioned prefix.
app.use(\`\${API_PREFIX}/auth\`, authRoute);
app.use(\`\${API_PREFIX}/properties\`, propertyRoute);
// …and so on for the remaining thirteen resources

// 6. Realtime shares the HTTP server so one port serves both protocols.
initSocket(server, process.env.CLIENT_URL);

// 7. 404, then the error handler — order matters, this pair must be last.
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(\`Server is running at port \${PORT}\`));`,
    },

    {
      t: "p",
      text: "Three decisions in that file are worth calling out, because they explain most of the behaviour you will see elsewhere in the codebase.",
    },

    { t: "h3", text: "The API prefix is versioned and centralised" },

    {
      t: "p",
      text: "`API_PREFIX` lives in `config/swagger/index.js` and is imported by both the route mounts and the OpenAPI server URL. Because the prefix is baked into the spec's `servers` array, every path in the Swagger document is written *without* it — `/properties`, not `/api/v1/properties`. Adding a prefix here would not require touching a single route.",
    },

    { t: "h3", text: "Socket.IO attaches to the same HTTP server" },

    {
      t: "p",
      text: "`initSocket(server, ...)` receives the `http.Server` created on line two, not a fresh listener. That means the API and the WebSocket gateway share port 4000 — one port to open, one origin to allowlist, no second deployment.",
    },

    { t: "h3", text: "The error handler is registered last" },

    {
      t: "p",
      text: "`notFound` runs after every route, so unmatched paths fall through to it rather than Express's default HTML error page. `errorHandler` sits behind it and therefore catches errors thrown from the 404 handler too. Both return JSON, which is what the front ends' axios client expects on every code path.",
    },

    { t: "h2", text: "Project structure" },

    {
      t: "p",
      text: "Sixty JavaScript files across eight directories, roughly 7,100 lines of hand-written code. The layout follows a conventional Express split, with configuration lifted out because it is genuinely shared between the HTTP and Socket layers.",
    },

    {
      t: "code",
      lang: "bash",
      title: "server/",
      code: `server/
├── server.js                  Entry point — middleware, mounts, Socket.IO
├── apiDoc.md                  Hand-maintained prose companion to the spec
│
├── config/
│   ├── db.js                  Mongoose connection
│   ├── cloudinary.js          Media upload + the derived transform
│   ├── redis.js               Upstash client that degrades to null
│   ├── socket.js              Socket.IO server, rooms, events
│   └── swagger/
│       ├── index.js           API_PREFIX + the assembled document
│       ├── components.js      Shared response + param schemas
│       ├── schemas.js         Mongoose schemas as OpenAPI schemas
│       └── paths.*.js         Paths split by domain (core, admin, search, …)
│
├── controllers/               One file per resource domain
├── models/                    15 Mongoose schemas
├── routes/                    14 routers — path, middleware, handler
├── middleware/
│   └── errorMiddleware.js     notFound + errorHandler
└── utils/
    ├── authUtils.js           Hashing, tokens, OTP, requireSignIn, requireRole
    ├── errorUtils.js          statusFromError / errorResponse
    ├── attachImages.js        One batched media query per list response
    └── geoUtils.js            Polygon validation, self-intersection detection`,
    },

    {
      t: "table",
      columns: ["Directory", "Files", "Lines", "Responsibility"],
      rows: [
        [
          "`controllers/`",
          "13",
          "3,185",
          "Request parsing, authorisation checks, database work, response shaping.",
        ],
        [
          "`config/`",
          "8",
          "2,528",
          "Database, media, cache, realtime and the OpenAPI document — everything shared.",
        ],
        [
          "`models/`",
          "15",
          "557",
          "Mongoose schemas, indexes and virtuals. The shape of the data.",
        ],
        [
          "`routes/`",
          "14",
          "399",
          "Path, middleware chain and handler binding. Kept deliberately thin.",
        ],
        ["`middleware/`", "1", "35", "The 404 and the terminal error handler."],
        [
          "`utils/`",
          "4",
          "324",
          "Cross-cutting helpers: auth primitives, error mapping, image batching, geometry.",
        ],
      ],
      caption:
        "Rough line counts by directory, excluding `node_modules`, `package*.json` and `apiDoc.md`.",
    },

    {
      t: "callout",
      kind: "tip",
      title: "Why routes are so thin",
      text: "A route file contains exactly three kinds of line: a path, a middleware chain and a handler name. Every decision — who may call this, what a valid body is, what the response looks like — lives in the controller. That is why the whole API surface fits in `apiDoc.md` at 839 lines despite being 51 endpoints.",
    },

    { t: "h2", text: "Authentication" },

    {
      t: "p",
      text: "The system issues a **token pair** on login and registration: a short-lived access token and a long-lived refresh token. Both are delivered twice — signed into the response body *and* set as httpOnly cookies — so browser clients get CSRF protection from the cookie while the mobile app reads the body field and stores it in the OS keychain.",
    },

    { t: "h3", text: "The pair" },

    {
      t: "table",
      columns: ["Token", "Lifetime", "Payload", "Secret"],
      rows: [
        [
          "**Access**",
          "15 minutes (`JWT_ACCESS_TIME`)",
          "`{ id, role }`",
          "`JWT_SECRET_KEY`",
        ],
        [
          "**Refresh**",
          "7 days (`JWT_REFRESH_TIME`)",
          "`{ id, jti }`",
          "`JWT_REFRESH_SECRET_KEY`",
        ],
      ],
    },

    {
      t: "p",
      text: "The refresh token's `jti` is a `crypto.randomUUID()`. It is hashed nowhere but it *is* stored: every issued refresh token is pushed into `user.refreshTokens` and the array is capped with `$slice: -10`, so a user can hold at most ten live sessions.",
    },

    { t: "h3", text: "Cookie policy" },

    {
      t: "code",
      lang: "js",
      title: "controllers/authController.js",
      code: `function cookieOptions(maxAgeMs) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: maxAgeMs,
  };
}

// Both cookies are set on every issue — header and cookie in lockstep.
res.cookie("refreshToken", refresh.token, cookieOptions(REFRESH_TTL));
res.cookie("accessToken", access.token, cookieOptions(ACCESS_TTL));`,
    },

    { t: "h3", text: "Rotation and reuse detection" },

    {
      t: "p",
      text: "Every call to `POST /auth/refresh` issues a *new* pair and removes the presented token from the user document. If a token that is not currently in `refreshTokens` is presented, the system treats it as a stolen-token replay: it clears **all** refresh tokens for that user and responds `403`, forcing a fresh login. This is the standard mitigation for refresh token theft.",
    },

    { t: "h3", text: "Email one-time passwords" },

    {
      t: "p",
      text: "The OTP flow exists as an alternative to a password. A six-digit code is generated with `crypto.randomInt`, hashed with SHA-256 together with `OTP_SECRET_KEY`, and stored in Redis under `otp:<email>` with a ten-minute TTL. Attempt counters live alongside it under `otp-attempts:<email>` and cap at five.",
    },

    {
      t: "callout",
      kind: "warn",
      title: "There is no email transport",
      text: "No SMTP client is configured anywhere in the repository. When Redis is unconfigured, `requestOtp` logs the code to the console instead of mailing it. That is a development affordance, not a feature — wire up a real transport before calling this production-ready.",
    },

    { t: "h3", text: "Guarding a request" },

    {
      t: "code",
      lang: "js",
      title: "utils/authUtils.js",
      code: `export function requireSignIn(req, res, next) {
  const header = req.headers.authorization;
  const bearer = header?.startsWith("Bearer ") ? header.slice(7) : null;
  const token = req.cookies?.accessToken || bearer;

  if (!token) {
    return res.status(401).json({ success: false, message: "Access denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch {
    return res.status(403).json({ success: false, message: "Invalid token" });
  }
}`,
    },

    {
      t: "p",
      text: 'Note the split status codes: a *missing* token is `401` and a *malformed or expired* one is `403`. The front ends rely on this — the axios interceptor treats `401` as "refresh me" and only clears the session on `403`.',
    },

    { t: "h3", text: "Endpoints" },

    {
      t: "endpoints",
      items: [
        {
          method: "POST",
          path: "/api/v1/auth/register",
          description:
            "Create a user, hash the password with bcrypt, optionally create a profile, issue the token pair.",
          auth: "authLimiter",
        },
        {
          method: "POST",
          path: "/api/v1/auth/login",
          description: "Verify an email and password, issue the token pair.",
          auth: "authLimiter",
        },
        {
          method: "POST",
          path: "/api/v1/auth/refresh",
          description:
            "Rotate the refresh token from the cookie or body; clears all tokens on reuse.",
          auth: "cookie / body",
        },
        {
          method: "POST",
          path: "/api/v1/auth/logout",
          description:
            "Remove the presented refresh token from the user and clear both cookies.",
          auth: "— (cookie)",
        },
        {
          method: "POST",
          path: "/api/v1/auth/otp",
          description:
            "Generate and store a six-digit OTP hashed in Redis under a ten-minute TTL.",
          auth: "authLimiter",
        },
        {
          method: "POST",
          path: "/api/v1/auth/otp/verify",
          description:
            "Check the OTP (max 5 attempts), set `verified`, issue the token pair.",
          auth: "authLimiter",
        },
        {
          method: "GET",
          path: "/api/v1/auth/me",
          description:
            "Return the current user with the password hash and refresh tokens removed.",
          auth: "requireSignIn",
        },
      ],
    },

    {
      t: "callout",
      kind: "info",
      title: "Rate limiting is layered",
      text: "A global limiter allows 1,000 requests per 15 minutes. The auth router adds `authLimiter` at 20 requests per 15 minutes on register, login and the OTP routes, because those are the credential-stuffing surface. The search router adds `searchLimiter` at 60 requests per 60 seconds, since its polygon and commute endpoints are the most expensive queries in the system.",
    },

    { t: "h2", text: "Roles and permissions" },

    {
      t: "p",
      text: "`requireRole(...roles)` is a self-authenticating middleware: it runs `requireSignIn` internally and then compares `req.userRole` against the allowlist. There is no permission matrix — capability is entirely a function of role, and role lives on the token.",
    },

    {
      t: "code",
      lang: "js",
      title: "utils/authUtils.js",
      code: `export function requireRole(...roles) {
  return async (req, res, next) => {
    requireSignIn(req, res, () => {
      if (!roles.includes(req.userRole)) {
        return res.status(403).json({ success: false, message: "Not authorized!" });
      }
      next();
    });
  };
}`,
    },

    {
      t: "table",
      columns: ["Capability", "Endpoint", "Required role"],
      rows: [
        [
          "Browse and search listings",
          "`GET /properties`, `POST /search/*`",
          "*anyone*",
        ],
        [
          "Favourite, save searches, enquire, chat, review",
          "favourites, saved-searches, inquiries, conversations, reviews",
          "`requireSignIn`",
        ],
        [
          "Create a listing",
          "`POST /properties`",
          "`agent`, `landlord`, `admin`",
        ],
        [
          "Edit or retire a listing",
          "`PATCH`/`DELETE /properties/:id`",
          "owner, listing agent, or `admin`",
        ],
        [
          "Manage listing media",
          "`/properties/:id/media*`",
          "owner, listing agent, or `admin`",
        ],
        [
          "Work the enquiry pipeline",
          "`GET /inquiries`, `PATCH /inquiries/:id/status`",
          "`agent`, `landlord`, `admin`",
        ],
        [
          "Read the role dashboard",
          "`GET /dashboard/*`",
          "matches the dashboard",
        ],
        [
          "Verify users, properties, agencies",
          "`PATCH /dashboard/admin/*/verify`",
          "`admin`",
        ],
        [
          "Create areas, buildings, agencies",
          "`POST /areas`, `/buildings`, `/agencies`",
          "`admin`",
        ],
        ["Edit your own profile", "`/profiles/me`", "`requireSignIn`"],
      ],
    },

    { t: "h3", text: "Ownership checks" },

    {
      t: "p",
      text: "Route-level role checks are necessary but not sufficient for listings, because an agent may legitimately edit their *own* listings and not others. A private `assertCanEditProperty(req, res)` helper runs after `requireSignIn` on every listing mutation and admits the request only when the caller is the owner, the assigned agent, or an admin.",
    },

    {
      t: "code",
      lang: "js",
      title: "controllers/propertyController.js",
      code: `async function assertCanEditProperty(req, res) {
  const property = await propertyModel.findById(req.params.id);
  if (!property) {
    res.status(404).json({ success: false, message: "Property not found" });
    return false;
  }

  const isOwner = property.ownerId.toString() === req.userId;
  const isAgent = property.agentId?.toString() === req.userId;
  const isAdmin = req.userRole === "admin";

  if (!isOwner && !isAgent && !isAdmin) {
    res.status(403).json({ success: false, message: "Not authorized!" });
    return false;
  }

  return true;
}`,
    },

    {
      t: "callout",
      kind: "warn",
      title: "Listings are never hard-deleted",
      text: '`DELETE /properties/:id` sets `status` to `"expired"` and clears the cached similar-properties key. Nothing is removed from the collection, so historical price data, enquiries and conversations stay intact and resolvable. The same is true of the delete buttons in the front ends — they retire a listing, they do not erase it.',
    },

    { t: "h2", text: "Health check" },

    {
      t: "endpoints",
      items: [
        {
          method: "GET",
          path: "/api/v1/health",
          description:
            'Liveness probe. Returns `{ success: true, status: "ok" }` with no authentication.',
          auth: "public",
        },
      ],
    },

    {
      t: "p",
      text: "This is the one route that is not in the OpenAPI `paths` object. It is registered directly in `server.js` rather than through a router, because it must answer even if a database-backed router were misconfigured. The admin console's profile page surfaces a connectivity button that calls it.",
    },

    { t: "h2", text: "Properties" },

    {
      t: "p",
      text: "The largest and most heavily used resource. One filter builder — `buildPropertyFilter(query)` — is shared by the list endpoint, the saved-search validator and the polygon handler, so a saved search can never encode a filter the list endpoint would reject.",
    },

    { t: "h3", text: "The filter builder" },

    {
      t: "code",
      lang: "js",
      title: "controllers/propertyController.js",
      code: `function buildPropertyFilter(query) {
  const filter = { status: "active" };

  if (query.purpose) filter.purpose = query.purpose;

  if (query.type) {
    // Comma-separated types become an $in
    filter.type = { $in: String(query.type).split(",") };
  }

  if (query.city) {
    filter.address = { $regex: query.city, $options: "i" };
  }

  if (query.beds) filter.beds = { $gte: Number(query.beds) };

  if (query.priceMin || query.priceMax) {
    filter.price = {};
    if (query.priceMin) filter.price.$gte = Number(query.priceMin);
    if (query.priceMax) filter.price.$lte = Number(query.priceMax);
  }

  if (query.furnished) {
    filter.furnished = { $in: String(query.furnished).split(",") };
  }

  if (query.amenities) {
    filter.amenities = { $all: String(query.amenities).split(",") };
  }

  if (query.polygon) {
    const ring = JSON.parse(query.polygon);
    if (!Array.isArray(ring) || ring.length < 3) {
      throw Object.assign(new Error("Polygon needs at least 3 points"), {
        statusCode: 400,
      });
    }
    // MongoDB requires an explicitly closed ring.
    const closed =
      ring[0][0] === ring[ring.length - 1][0] &&
      ring[0][1] === ring[ring.length - 1][1]
        ? ring
        : [...ring, ring[0]];

    filter.location = {
      $geoIntersects: { $geometry: { type: "Polygon", coordinates: [closed] } },
    };
  }

  if (query.lat && query.lng && query.radius) {
    filter.location = {
      $near: {
        $geometry: { type: "Point", coordinates: [Number(query.lng), Number(query.lat)] },
        $maxDistance: Number(query.radius) * 1000,
      },
    };
  }

  if (query.q) filter.$text = { $search: query.q };

  return filter;
}`,
    },

    {
      t: "p",
      text: "Two behaviours in there are worth noting. **Status is always `active`** — an expired or sold listing never appears in a search, and the only way to see one is to know its id. And **the polygon ring is closed automatically**, so the front ends can send an open path of points and still produce valid GeoJSON.",
    },

    { t: "h3", text: "Endpoints" },

    {
      t: "endpoints",
      items: [
        {
          method: "GET",
          path: "/api/v1/properties",
          description:
            "Paginated, multi-facet search. Attaches `images[]` and a `thumbnail` to each result.",
          auth: "public",
        },
        {
          method: "GET",
          path: "/api/v1/properties/:id",
          description:
            "One listing with owner, agent and building populated, and media ordered by `order`.",
          auth: "public",
        },
        {
          method: "GET",
          path: "/api/v1/properties/:id/price-history",
          description: "Price change records for the listing, newest first.",
          auth: "public",
        },
        {
          method: "GET",
          path: "/api/v1/properties/:id/similar",
          description:
            "Same purpose and type, price within ±20%, beds ±1, within 5 km. Cached in Redis.",
          auth: "public",
        },
        {
          method: "GET",
          path: "/api/v1/properties/:id/reviews",
          description:
            "Reviews of the listing's *building*, not the listing itself.",
          auth: "public",
        },
        {
          method: "POST",
          path: "/api/v1/properties/:id/inquire",
          description:
            "Create an enquiry routed to the listing's `agentId`, falling back to `ownerId`.",
          auth: "requireSignIn",
        },
        {
          method: "POST",
          path: "/api/v1/properties",
          description:
            "Create a listing. The agent is set automatically for agent, landlord and admin roles.",
          auth: "lister roles",
        },
        {
          method: "PATCH",
          path: "/api/v1/properties/:id",
          description:
            "Update a listing. A price change writes a `priceHistory` document.",
          auth: "owner / agent / admin",
        },
        {
          method: "DELETE",
          path: "/api/v1/properties/:id",
          description:
            "Soft delete — sets `status` to `expired` and clears the similar cache.",
          auth: "owner / agent / admin",
        },
      ],
    },

    { t: "h3", text: "Query parameters" },

    {
      t: "table",
      columns: ["Parameter", "Type", "Effect"],
      rows: [
        ["`purpose`", "string", "`rent` or `buy`. Exact match."],
        [
          "`type`",
          "csv",
          "One or more of `apartment`, `villa`, `plot`, `commercial`, `farmhouse`. Becomes `$in`.",
        ],
        ["`city`", "string", "Case-insensitive regex against `address`."],
        ["`beds`", "number", "`beds >= value`."],
        ["`priceMin` / `priceMax`", "number", "Inclusive price bounds."],
        [
          "`furnished`",
          "csv",
          "One or more of `unfurnished`, `semi-furnished`, `furnished`.",
        ],
        [
          "`amenities`",
          "csv",
          "`$all` — every listed amenity must be present.",
        ],
        [
          "`q`",
          "string",
          "Full-text search over the `title`, `description` and `address` index.",
        ],
        [
          "`lat` / `lng` / `radius`",
          "number",
          "Radius search in kilometres, using `$near`.",
        ],
        [
          "`polygon`",
          "JSON string",
          "A ring of `[lng, lat]` pairs; `$geoIntersects`.",
        ],
        ["`page`", "number", "1-based. Default `1`."],
        ["`limit`", "number", "Default `20`, capped at `100`."],
        [
          "`sort`",
          "string",
          "`createdAt: -1` by default; a `q` search sorts by text score instead.",
        ],
      ],
    },

    { t: "h3", text: "Pagination and counting" },

    {
      t: "p",
      text: "Responses carry a consistent envelope: `{ success, count, page, totalPages, data }`. Computing `totalPages` requires a second query, and that query cannot reuse a `$near` sort — `$near` is illegal in `$geoWithin`. The controller rewrites `$near` into `$geoWithin` with `$centerSphere` and an explicit earth radius of `6,378,100` metres for the count only.",
    },

    {
      t: "code",
      lang: "js",
      title: "controllers/propertyController.js",
      code: `// The count query cannot use $near, so it is rewritten.
if (filter.location?.$near) {
  const { $near } = filter.location;
  countFilter.location = {
    $geoWithin: {
      $centerSphere: [$near.$geometry.coordinates, $near.$maxDistance / 6378100],
    },
  };
}

const total = await propertyModel.countDocuments(countFilter);
const totalPages = Math.ceil(total / limit);`,
    },

    {
      t: "callout",
      kind: "tip",
      title: "Images are batched, not per-property",
      text: 'A naive implementation would issue one media query per row. `utils/attachImages.js` instead runs a single `propertyMediaModel.find({ propertyId: { $in: ids }, type: "image" })`, spreads each document into a plain object, and attaches an `images[]` array plus a `thumbnail`. One extra query per page, regardless of page size.',
    },

    { t: "h2", text: "Property media" },

    {
      t: "p",
      text: "Images, video, floor plans and virtual tours live in a separate `propertyMedia` collection rather than as an array on the property document. That separation is what makes reordering a `bulkWrite` of a few hundred documents rather than a rewrite of the whole listing, and it keeps the property document small enough to stay in the working set during a paginated search.",
    },

    {
      t: "endpoints",
      items: [
        {
          method: "POST",
          path: "/api/v1/properties/:id/media",
          description:
            "Attach media. Accepts a hosted `url`, or a Cloudinary upload from `req.file.buffer`.",
          auth: "owner / agent / admin",
        },
        {
          method: "PATCH",
          path: "/api/v1/properties/:id/media/reorder",
          description:
            "Bulk-rewrite `order` from an array of media ids; validates that every id belongs to the property.",
          auth: "owner / agent / admin",
        },
        {
          method: "DELETE",
          path: "/api/v1/properties/:id/media/:mediaId",
          description: "Delete one media document, scoped to the property.",
          auth: "owner / agent / admin",
        },
      ],
    },

    {
      t: "code",
      lang: "js",
      title: "controllers/propertyController.js",
      code: `// Reorder is validated before it is trusted.
const ids = Array.isArray(req.body.order) ? req.body.order : [];
const owned = await propertyMediaModel
  .find({ propertyId: req.params.id, _id: { $in: ids } })
  .select("_id");

if (owned.length !== ids.length) {
  return res.status(400).json({
    success: false,
    message: "One or more media ids do not belong to this property",
  });
}

await propertyMediaModel.bulkWrite(
  ids.map((mediaId, index) => ({
    updateOne: {
      filter: { _id: mediaId },
      update: { $set: { order: index } },
    },
  })),
);`,
    },

    {
      t: "callout",
      kind: "warn",
      title: "Multipart upload is not wired up",
      text: "`addPropertyMedia` reads `req.file.buffer`, but no multer middleware is registered anywhere in the service. In practice the working path is posting a hosted `url` directly — which is exactly what all three front ends do. The Cloudinary branch is dead code until a multipart parser is added.",
    },

    { t: "h2", text: "Geospatial search" },

    {
      t: "p",
      text: "Three endpoints sit on their own router under `/search`, behind a 60-per-minute limiter because they are the most expensive queries in the system. Two of the three write to Redis.",
    },

    {
      t: "endpoints",
      items: [
        {
          method: "GET",
          path: "/api/v1/search/suggest",
          description:
            "Typeahead: 5 matching areas plus 8 active listings whose address matches.",
          auth: "public",
        },
        {
          method: "POST",
          path: "/api/v1/search/polygon",
          description:
            "Every active listing inside a drawn closed ring, with aggregate stats. Cached 120s.",
          auth: "public",
        },
        {
          method: "POST",
          path: "/api/v1/search/commute",
          description:
            "Straight-line isochrone search from a coordinate. Cached 300s.",
          auth: "public",
        },
      ],
    },

    { t: "h3", text: "Polygon" },

    {
      t: "p",
      text: "The web app lets you draw a shape on a Leaflet map. The ring arrives as an array of `[lng, lat]` pairs and is matched with `$geoIntersects` against the `location` field — a `2dsphere` index — which is a much cheaper operation than fetching candidates and testing point-in-polygon in JavaScript.",
    },

    {
      t: "code",
      lang: "js",
      title: "POST /api/v1/search/polygon",
      code: `{
  "polygon": [
    [72.8340, 18.9380],
    [72.8440, 18.9380],
    [72.8440, 18.9480],
    [72.8340, 18.9480],
    [72.8340, 18.9380]
  ],
  "limit": 100
}`,
    },

    {
      t: "p",
      text: 'The response pairs the listings with a small stats object — count, average, minimum and maximum price inside the shape — so the UI can show "12 properties · avg 41,200" above the results grid.',
    },

    { t: "h3", text: "Commute" },

    {
      t: "p",
      text: "There is no routing engine and no traffic data. The commute search is honest about being an approximation: it converts a travel time into a straight-line radius and searches inside that circle.",
    },

    {
      t: "code",
      lang: "js",
      title: "controllers/searchController.js",
      code: `const minutes = Number(req.body.minutes) || 30;
const speedKph = Number(req.body.speedKph) || 30;

// Straight-line radius in metres.
const radiusMetres = (minutes / 60) * speedKph * 1000;

const properties = await propertyModel.find({
  status: "active",
  location: {
    $near: {
      $geometry: {
        type: "Point",
        coordinates: [Number(req.body.lng), Number(req.body.lat)],
      },
      $maxDistance: radiusMetres,
    },
  },
})
  .limit(limit);`,
    },

    {
      t: "callout",
      kind: "info",
      title: "Straight-line, and the UI says so",
      text: "The commute control in the web search page labels the mode explicitly and defaults to 30 minutes at 30 km/h. A real deployment would swap `searchCommute` for a call to a routing provider and keep the response shape identical — the filter builder and the map component would not need to change.",
    },

    { t: "h3", text: "Caching" },

    {
      t: "p",
      text: "Polygon results cache for 120 seconds and commute results for 300, both keyed on a hash of the request body. Area insights cache for 600. Because `config/redis.js` returns `null` when the Upstash credentials are absent and every cache operation is guarded, the entire caching layer disappears cleanly in development — no code branches, no warnings, just no cache.",
    },

    {
      t: "code",
      lang: "js",
      title: "config/redis.js",
      code: `const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

export const cache = {
  async get(key) {
    if (!redis) return null;
    try {
      return await redis.get(key);
    } catch {
      return null; // A cache failure must never fail the request.
    }
  },
  async set(key, value, ttlSeconds = 300) {
    if (!redis) return;
    try {
      await redis.set(key, value, { ex: ttlSeconds });
    } catch {
      /* no-op */
    }
  },
  async del(key) {
    if (!redis) return;
    try {
      await redis.del(key);
    } catch {
      /* no-op */
    }
  },
};`,
    },

    { t: "h2", text: "Favourites" },

    {
      t: "p",
      text: "A shortlist. The `favorite` collection carries a **unique compound index** on `(userId, propertyId)`, which is what makes the add operation idempotent: `addFavorite` upserts, so double-tapping the heart never produces a duplicate and never throws a 409.",
    },

    {
      t: "endpoints",
      items: [
        {
          method: "GET",
          path: "/api/v1/favorites",
          description:
            "The user's shortlist, with each property fully populated plus building name and batched images.",
          auth: "requireSignIn",
        },
        {
          method: "POST",
          path: "/api/v1/favorites",
          description: "Add a property. Idempotent upsert on the unique index.",
          auth: "requireSignIn",
        },
        {
          method: "DELETE",
          path: "/api/v1/favorites",
          description: "Remove by `propertyId` in the body.",
          auth: "requireSignIn",
        },
        {
          method: "DELETE",
          path: "/api/v1/favorites/:propertyId",
          description: "Remove by path parameter.",
          auth: "requireSignIn",
        },
      ],
    },

    {
      t: "fields",
      items: [
        {
          name: "propertyId",
          type: "ObjectId",
          required: true,
          description: "The listing to shortlist.",
        },
      ],
    },

    {
      t: "callout",
      kind: "info",
      title: "Why `.lean()` here",
      text: "`getFavorites` runs `.lean()` so the attached `images` array and `thumbnail` survive Mongoose's strict-mode hydration. Without it, spreading a hydrated document into a new object silently drops fields that are not in the schema — which is exactly the failure mode this endpoint had to work around.",
    },

    { t: "h2", text: "Saved searches" },

    {
      t: "p",
      text: "A saved search stores a raw filter object plus an alert frequency. Its most interesting property is that `addSavedSearch` runs the submitted `filters` object through the same `buildPropertyFilter` used by the list endpoint. A saved search can therefore never encode a filter that the search endpoint would reject — invalid polygons and malformed price bounds fail at save time with the same 400 the search would have returned.",
    },

    {
      t: "endpoints",
      items: [
        {
          method: "GET",
          path: "/api/v1/saved-searches",
          description: "All saved searches for the user, newest first.",
          auth: "requireSignIn",
        },
        {
          method: "POST",
          path: "/api/v1/saved-searches",
          description:
            "Create one. `filters` is validated through `buildPropertyFilter`.",
          auth: "requireSignIn",
        },
        {
          method: "DELETE",
          path: "/api/v1/saved-searches/:id",
          description: "Delete one. Owner-scoped.",
          auth: "requireSignIn",
        },
        {
          method: "GET",
          path: "/api/v1/saved-searches/:id/results",
          description:
            "Live preview of the stored search, capped at 50 results, and stamps `lastRunAt`.",
          auth: "requireSignIn",
        },
      ],
    },

    {
      t: "fields",
      items: [
        {
          name: "filters",
          type: "object",
          required: true,
          description:
            "The filter set. Validated by `buildPropertyFilter` before it is stored.",
        },
        {
          name: "alertFrequency",
          type: "enum",
          default: "`daily`",
          description:
            "`off`, `daily`, `weekly` or `instant`. Stored for a future alerting worker; nothing currently consumes it.",
        },
      ],
    },

    { t: "h2", text: "Enquiries" },

    {
      t: "p",
      text: "The lead pipeline. An enquiry is created from a listing, routed to whoever is responsible for it, and moved through three states by the receiving agent.",
    },

    {
      t: "endpoints",
      items: [
        {
          method: "GET",
          path: "/api/v1/inquiries",
          description:
            "Enquiries where `agentId` is the caller. Optional `?status=` filter.",
          auth: "lister roles",
        },
        {
          method: "PATCH",
          path: "/api/v1/inquiries/:id/status",
          description:
            "Move to `new`, `contacted` or `closed`. Emits an `inquiry-status` notification to the enquirer.",
          auth: "lister roles",
        },
      ],
    },

    {
      t: "fields",
      items: [
        {
          name: "message",
          type: "string",
          required: true,
          description: "The enquirer's message. Trimmed, non-empty.",
        },
      ],
    },

    {
      t: "code",
      lang: "js",
      title: "controllers/propertyController.js — createInquiry",
      code: `// The listing decides who receives the lead.
const agentId = property.agentId || property.ownerId;

const inquiry = await inquiryModel.create({
  propertyId: property._id,
  userId: req.userId,
  agentId,
  message,
  status: "new",
});

await notificationModel.create({
  userId: agentId,
  type: "inquiry",
  payload: {
    inquiryId: inquiry._id,
    propertyId: property._id,
    propertyTitle: property.title,
  },
});`,
    },

    {
      t: "p",
      text: "The status transition is the interesting half. Every change writes a notification back to the person who enquired, which is what makes the enquiry pipeline visible from the consumer side rather than only inside the admin console.",
    },

    { t: "h2", text: "Conversations" },

    {
      t: "p",
      text: "One-to-one threads, optionally attached to a listing. Creating a conversation is idempotent: if a two-party thread already exists it is returned with `existing: true` rather than creating a duplicate.",
    },

    {
      t: "endpoints",
      items: [
        {
          method: "GET",
          path: "/api/v1/conversations",
          description:
            "The user's threads sorted by `lastMessageAt`, with participants and listing populated.",
          auth: "requireSignIn",
        },
        {
          method: "POST",
          path: "/api/v1/conversations",
          description: "Open or reuse a thread. Blocks self-conversations.",
          auth: "requireSignIn",
        },
        {
          method: "GET",
          path: "/api/v1/conversations/:id",
          description: "Thread detail. Rejects non-participants.",
          auth: "participant",
        },
        {
          method: "GET",
          path: "/api/v1/conversations/:id/messages",
          description:
            "Cursor pagination via `?before=<ISO date>`, default 50, max 200. Returned oldest-first.",
          auth: "participant",
        },
        {
          method: "POST",
          path: "/api/v1/conversations/:id/messages",
          description:
            "Persist, bump `lastMessageAt`, emit `message:new` and `notification:new`.",
          auth: "participant",
        },
        {
          method: "POST",
          path: "/api/v1/conversations/:id/read",
          description: "Set `readAt` on every unread inbound message.",
          auth: "participant",
        },
      ],
    },

    {
      t: "callout",
      kind: "tip",
      title: "REST and socket sends are symmetric",
      text: "The REST `sendMessage` and the socket `message:send` handler do the same three things — persist, bump, emit — through a shared `deliverMessage(message, conversation)` helper. That is why the web app, which polls over REST, and the mobile app, which uses the socket, see identical message ordering and identical notifications.",
    },

    { t: "h3", text: "Participant checking" },

    {
      t: "code",
      lang: "js",
      title: "controllers/conversationController.js",
      code: `function isParticipant(conversation, userId) {
  // participants may be raw ids or already populated documents depending
  // on which query produced this object.
  return conversation.participants.some((participant) => {
    const id = participant?._id
      ? participant._id.toString()   // populated
      : participant.toString();      // raw ObjectId
    return id === userId;
  });
}`,
    },

    { t: "h2", text: "Realtime" },

    {
      t: "p",
      text: "Socket.IO shares the Express HTTP server. Every handshake is JWT-verified before a connection is accepted, and two kinds of room keep delivery targeted.",
    },

    { t: "h3", text: "Rooms" },

    {
      t: "table",
      columns: ["Room", "Joined", "Receives"],
      rows: [
        [
          "`<userId>`",
          "Automatically on every connection",
          "Notifications addressed to that user, from any device.",
        ],
        [
          "`conversation:<id>`",
          "`conversation:join`",
          "`message:new` and `typing` for that thread only.",
        ],
      ],
    },

    { t: "h3", text: "Client to server" },

    {
      t: "table",
      columns: ["Event", "Payload", "Effect"],
      rows: [
        [
          "`message:send`",
          "`{ conversationId, body, attachments }`",
          "Verifies participation, persists, bumps `lastMessageAt`, emits to the conversation room, creates a notification for every other participant and emits `notification:new` to their user room. Acknowledged via a callback.",
        ],
        [
          "`conversation:join`",
          "`conversationId`",
          "Joins the thread room so subsequent messages arrive.",
        ],
        ["`conversation:leave`", "`conversationId`", "Leaves the thread room."],
        [
          "`typing`",
          "`conversationId`",
          "Relays `{ userId, conversationId }` to the thread room.",
        ],
      ],
    },

    { t: "h3", text: "Server to client" },

    {
      t: "table",
      columns: ["Event", "Payload", "Meaning"],
      rows: [
        [
          "`message:new`",
          "The message document",
          "A message was posted in a room this socket has joined.",
        ],
        [
          "`notification:new`",
          "The notification document",
          "This user has a new notification on this or another device.",
        ],
        [
          "`typing`",
          "`{ userId, conversationId }`",
          "Someone is composing in that thread.",
        ],
      ],
    },

    {
      t: "code",
      lang: "js",
      title: "config/socket.js",
      code: `const io = new Server(httpServer, {
  cors: { origin: clientOrigin, credentials: true },
});

// The handshake is the only place a socket can be trusted.
io.use((socket, next) => {
  const token =
    socket.handshake.auth?.token ||
    socket.headers.authorization?.replace("Bearer ", "");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    socket.userId = decoded.id;
    socket.userRole = decoded.role;
    next();
  } catch {
    next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  // A personal room for notifications, on every connection.
  socket.join(socket.userId);

  socket.on("message:send", async (payload, ack) => {
    // verify, persist, bump, emit …
    ack?.({ ok: true, message: created });
  });

  socket.on("typing", (conversationId) => {
    socket.to(\`conversation:\${conversationId}\`).emit("typing", {
      userId: socket.userId,
      conversationId,
    });
  });
});`,
    },

    {
      t: "callout",
      kind: "info",
      title: "`getIo()` is how controllers reach the socket",
      text: "The module keeps a reference to the `io` instance and exports `getIo()`. Without it, a REST controller would have no way to emit — the Socket.IO server and the Express app are constructed independently and only share an HTTP server. Every emit from a controller goes through that accessor.",
    },

    {
      t: "callout",
      kind: "warn",
      title: "Only the mobile app is realtime",
      text: "The mobile app subscribes to `message:new` and `typing`. The web app and the admin console declare or omit `socket.io-client` but both operate over REST — the web message page fetches and polls, and the admin conversations page is manual. If you are studying realtime behaviour, read it in the mobile app section.",
    },

    { t: "h2", text: "Notifications" },

    {
      t: "p",
      text: "A persisted feed with a `readAt` timestamp rather than a boolean, so an unread count is a single indexed query. Notifications are written by four different flows: new enquiry, enquiry status change, new message, and OTP issuance.",
    },

    {
      t: "endpoints",
      items: [
        {
          method: "GET",
          path: "/api/v1/notifications",
          description:
            "The user's feed. `?unreadOnly=true` and `?limit=` (default 30, max 100).",
          auth: "requireSignIn",
        },
        {
          method: "PATCH",
          path: "/api/v1/notifications/:id/read",
          description: "Set `readAt`, scoped to the owner.",
          auth: "requireSignIn",
        },
        {
          method: "PATCH",
          path: "/api/v1/notifications/read-all",
          description:
            "`updateMany` across the user's notifications; returns `modifiedCount`.",
          auth: "requireSignIn",
        },
      ],
    },

    {
      t: "p",
      text: "The index `{ userId: 1, readAt: 1, createdAt: -1 }` covers all three access patterns at once: a user's feed, an unread-only filter, and the unread count badge that every one of the three front ends polls.",
    },

    { t: "h2", text: "Areas and buildings" },

    {
      t: "p",
      text: "The reference data layer. Areas carry a GeoJSON polygon boundary; buildings carry a point location, a developer, a build year and an amenity list. Both are read publicly and written only by admins.",
    },

    {
      t: "endpoints",
      items: [
        {
          method: "GET",
          path: "/api/v1/areas",
          description:
            "Paginated. `?city=` and `?name=` regex filters; selects `name`, `city` and `boundary`.",
          auth: "public",
        },
        {
          method: "GET",
          path: "/api/v1/areas/:id",
          description: "One area.",
          auth: "public",
        },
        {
          method: "GET",
          path: "/api/v1/areas/:id/insights",
          description:
            "Geo aggregates over the properties inside the boundary. Cached 600s, `cached: true` on a hit.",
          auth: "public",
        },
        {
          method: "POST",
          path: "/api/v1/areas",
          description:
            "Create. Requires `name`, `city` and `boundary.coordinates`; runs `validatePolygon`.",
          auth: "`admin`",
        },
        {
          method: "PATCH",
          path: "/api/v1/areas/:id",
          description:
            "Partial update; re-validates the polygon and clears the insights cache key.",
          auth: "`admin`",
        },
        {
          method: "DELETE",
          path: "/api/v1/areas/:id",
          description: "Delete, or `409` if any review references the area.",
          auth: "`admin`",
        },
        {
          method: "GET",
          path: "/api/v1/buildings",
          description: "Paginated. `?name=` and `?developer=` regex filters.",
          auth: "public",
        },
        {
          method: "GET",
          path: "/api/v1/buildings/:id",
          description:
            "Building plus up to 20 active listings in a projection.",
          auth: "public",
        },
        {
          method: "GET",
          path: "/api/v1/buildings/:id/reviews",
          description:
            "Paginated reviews with `avgRating` and a 1–5 `distribution`.",
          auth: "public",
        },
        {
          method: "POST",
          path: "/api/v1/buildings",
          description: "Create. Requires `name` and `location.coordinates`.",
          auth: "`admin`",
        },
        {
          method: "PATCH",
          path: "/api/v1/buildings/:id",
          description:
            "Partial update of `name`, `developer`, `yearBuilt`, `amenities`, `location`.",
          auth: "`admin`",
        },
        {
          method: "DELETE",
          path: "/api/v1/buildings/:id",
          description: "Delete, or `409` if properties reference it.",
          auth: "`admin`",
        },
      ],
    },

    { t: "h3", text: "Polygon validation" },

    {
      t: "p",
      text: "An admin draws a neighbourhood boundary on a Leaflet map. That ring can easily be malformed — unclosed, self-intersecting, or with a repeated vertex — and MongoDB will happily store any of it and then return wrong answers forever. `utils/geoUtils.js` rejects all three cases before the write.",
    },

    {
      t: "code",
      lang: "js",
      title: "utils/geoUtils.js",
      code: `export function validatePolygon(boundary) {
  const ring = boundary?.coordinates?.[0];
  if (!Array.isArray(ring) || ring.length < 4) {
    return { ok: false, message: "A polygon needs at least 4 points (closed ring)" };
  }

  if (!samePoint(ring[0], ring[ring.length - 1])) {
    return { ok: false, message: "The polygon ring must be closed" };
  }

  // A self-intersecting ring (a "bow tie") produces nonsense for $geoIntersects.
  if (findSelfIntersection(ring)) {
    return { ok: false, message: "The polygon must not intersect itself" };
  }

  // A zero-area ring would silently match nothing.
  if (Math.abs(signedArea(ring)) < EPSILON) {
    return { ok: false, message: "The polygon must enclose a non-zero area" };
  }

  return { ok: true, value: boundary };
}`,
    },

    {
      t: "p",
      text: "The self-intersection test is the standard segment-pair check: for every pair of non-adjacent edges, test whether they properly cross. The shoelace formula provides the area guard, so a degenerate ring that technically closes but encloses nothing is also rejected.",
    },

    { t: "h3", text: "Area insights" },

    {
      t: "p",
      text: "The most interesting aggregate in the API. It runs every property inside the boundary through an aggregation pipeline and returns count, average, minimum, maximum and median price, plus breakdowns by purpose, type, bedroom count and average rating.",
    },

    {
      t: "callout",
      kind: "warn",
      title: "Median is computed by hand",
      text: '`$median` is an Atlas-only accumulator and will throw on a plain MongoDB server. The controller works around it by pulling `distinct("price")` from the match, sorting the array in JavaScript and taking the middle element. It is correct and portable, but it is not cheap — which is part of why the result is cached for ten minutes.',
    },

    { t: "h2", text: "Agencies and profiles" },

    {
      t: "p",
      text: "An agency is a broker or developer with a `verified` flag; a profile is the public-facing identity attached to a user document. Both live in `controllers/agencyController.js` — the split is historical rather than logical, and worth knowing if you go looking for `profileController.js` and do not find it.",
    },

    {
      t: "endpoints",
      items: [
        {
          method: "GET",
          path: "/api/v1/agencies",
          description: "Paginated. `?verified=true|false`.",
          auth: "public",
        },
        {
          method: "GET",
          path: "/api/v1/agencies/:id",
          description:
            "Agency plus member profiles (`name`, `avatar`, `userId`).",
          auth: "public",
        },
        {
          method: "POST",
          path: "/api/v1/agencies",
          description: "Create. Requires `name`.",
          auth: "`admin`",
        },
        {
          method: "PATCH",
          path: "/api/v1/agencies/:id",
          description:
            "Update. The `verified` field is honoured only when the caller is an admin.",
          auth: "`admin`",
        },
        {
          method: "DELETE",
          path: "/api/v1/agencies/:id",
          description: "Delete, or `409` while profiles reference it.",
          auth: "`admin`",
        },
        {
          method: "GET",
          path: "/api/v1/profiles/me",
          description:
            "The caller's profile with agency `name`, `logo` and `verified` populated.",
          auth: "requireSignIn",
        },
        {
          method: "PATCH",
          path: "/api/v1/profiles/me",
          description: "Upsert `name`, `avatar`, `agencyId`, `bio`.",
          auth: "requireSignIn",
        },
        {
          method: "PATCH",
          path: "/api/v1/profiles/me/preferences",
          description:
            "Update `locale` and `currency` on the **user** document, not the profile.",
          auth: "requireSignIn",
        },
        {
          method: "GET",
          path: "/api/v1/profiles/:userId",
          description: "Public view: a user projection plus the profile.",
          auth: "requireSignIn",
        },
      ],
    },

    {
      t: "callout",
      kind: "info",
      title: "Preferences live on the user, not the profile",
      text: "`updateMyPreferences` writes `locale` and `currency` to the user collection. That is deliberate — preferences must follow the account across the web app, the admin console and the mobile app, and the profile document is the one record that is created lazily and may not exist yet.",
    },

    { t: "h2", text: "Reviews" },

    {
      t: "p",
      text: "Reviews are polymorphic: they can target a building, an area or an agent, selected by a `targetType` enum plus a bare `targetId` with no `ref`. A unique compound index on `(targetType, targetId, userId)` makes one review per user per target, so posting again edits in place rather than creating a duplicate.",
    },

    {
      t: "endpoints",
      items: [
        {
          method: "GET",
          path: "/api/v1/reviews",
          description: "Reviews written by the caller.",
          auth: "requireSignIn",
        },
        {
          method: "POST",
          path: "/api/v1/reviews",
          description:
            "Create or edit. Rating 1–5, no self-review, target must exist.",
          auth: "requireSignIn",
        },
        {
          method: "DELETE",
          path: "/api/v1/reviews/:id",
          description: "Delete. Author or `admin` only.",
          auth: "author / `admin`",
        },
      ],
    },

    {
      t: "fields",
      items: [
        {
          name: "targetType",
          type: "`building` | `area` | `agent`",
          required: true,
          description: "What the review is about.",
        },
        {
          name: "targetId",
          type: "ObjectId",
          required: true,
          description:
            "The target's id. Existence is verified before the write.",
        },
        {
          name: "rating",
          type: "number (1–5)",
          required: true,
          description: "Star rating, clamped by the schema's `min`/`max`.",
        },
        {
          name: "body",
          type: "string",
          required: false,
          description: "Optional written review. Trimmed.",
        },
      ],
    },

    {
      t: "p",
      text: "Note that `GET /properties/:id/reviews` does not review the property — it resolves the property's `buildingId` and returns the *building's* reviews. Reviews in this system are about places and people, not about individual listings.",
    },

    { t: "h2", text: "Dashboards" },

    {
      t: "p",
      text: 'One endpoint per role, each returning a shape built for that role\'s screen. `GET /api/v1/dashboard` dispatches to the right one based on `req.userRole`, which is how all three front ends can ask for "my dashboard" without knowing who the user is.',
    },

    {
      t: "endpoints",
      items: [
        {
          method: "GET",
          path: "/api/v1/dashboard",
          description:
            "Dispatches to the role-specific dashboard below. `403` for an unmapped role.",
          auth: "requireSignIn",
        },
        {
          method: "GET",
          path: "/api/v1/dashboard/buyer",
          description:
            "Favourite, saved-search, enquiry, conversation and unread counts; recent favourites and enquiries; spend exposure by purpose.",
          auth: "`buyer`, `renter`",
        },
        {
          method: "GET",
          path: "/api/v1/dashboard/agent",
          description:
            "Listings by status and purpose, portfolio value (total and live), inquiry statistics, media count, 30-day price changes.",
          auth: "`agent`, `landlord`",
        },
        {
          method: "GET",
          path: "/api/v1/dashboard/admin",
          description:
            "Platform totals, users by role, verification queues for users, properties and agencies, closed-deal value.",
          auth: "`admin`",
        },
        {
          method: "PATCH",
          path: "/api/v1/dashboard/admin/users/:userId/verify",
          description:
            "Set or clear `verified` on a user. Body: `{ verified }`.",
          auth: "`admin`",
        },
        {
          method: "PATCH",
          path: "/api/v1/dashboard/admin/properties/:propertyId/verify",
          description: "Set or clear the property's `verifiedAt` timestamp.",
          auth: "`admin`",
        },
        {
          method: "PATCH",
          path: "/api/v1/dashboard/admin/agencies/:agencyId/verify",
          description: "Toggle `agency.verified`.",
          auth: "`admin`",
        },
      ],
    },

    {
      t: "callout",
      kind: "warn",
      title: "Verification toggles are role-gated twice",
      text: "`PATCH /agencies/:id` accepts a `verified` field in its body but silently ignores it unless `req.userRole` is `admin`. The dedicated verification endpoints exist precisely so that this kind of privilege check lives in one obvious place instead of being scattered across generic update handlers.",
    },

    { t: "h2", text: "Data model" },

    {
      t: "p",
      text: "Fifteen collections. The relationships are mostly `ref`-backed `ObjectId`s, with one deliberately polymorphic review target and one polymorphic notification payload.",
    },

    {
      t: "code",
      lang: "bash",
      title: "The collection graph",
      code: `user ──┬──< profile >── agency
       │       │
       │       └── agencyId
       │
       ├──< favorite >── property
       ├──< savedSearch
       ├──< inquiry >── property
       ├──< conversation >── property
       │       └──< message
       ├──< notification
       └──< message

property ──┬──< propertyMedia
           ├──< priceHistory
           ├── building
           └── ownerId / agentId  ──> user

area        (2dsphere boundary, standalone)
building ───< property          (2dsphere location, standalone)
review      (polymorphic: building | area | agent)`,
    },

    {
      t: "table",
      columns: ["Model", "File", "Key fields", "Indexes"],
      rows: [
        [
          "`user`",
          "`userModel.js`",
          "`email` (unique), `phone` (unique, sparse), `role`, `verified`, `locale`, `currency`, `passwordHash`, `refreshTokens[]`",
          "unique `email`, unique sparse `phone`",
        ],
        [
          "`profile`",
          "`profileModel.js`",
          "`userId`, `name`, `avatar`, `agencyId`, `bio`",
          "unique `userId`",
        ],
        [
          "`agency`",
          "`agencyModel.js`",
          "`name`, `logo`, `licenseNo`, `verified`",
          "—",
        ],
        [
          "`area`",
          "`areaModel.js`",
          "`name`, `city`, `boundary` (GeoJSON Polygon)",
          "`2dsphere` on `boundary`",
        ],
        [
          "`building`",
          "`buildingModel.js`",
          "`name`, `developer`, `yearBuilt`, `amenities[]`, `location` (Point)",
          "`2dsphere` on `location`",
        ],
        [
          "`property`",
          "`propertyModel.js`",
          "24 fields — see [below](#h2-the-property-model)",
          "`2dsphere` on `location`; compound `{purpose, status, price}`; text on `title`, `description`, `address`",
        ],
        [
          "`propertyMedia`",
          "`propertyMediaModel.js`",
          "`propertyId`, `type`, `url`, `publicId`, `blurhash`, `order`",
          "`{propertyId, order}`",
        ],
        [
          "`priceHistory`",
          "`priceHistoryModel.js`",
          "`propertyId`, `oldPrice`, `newPrice`, `changedAt`",
          "`{propertyId, changedAt:-1}`",
        ],
        [
          "`favorite`",
          "`favoriteModel.js`",
          "`userId`, `propertyId`",
          "**unique** `{userId, propertyId}`",
        ],
        [
          "`savedSearch`",
          "`savedSearchModel.js`",
          "`userId`, `filters` (Mixed), `alertFrequency`, `lastRunAt`",
          "`{userId, createdAt:-1}`",
        ],
        [
          "`inquiry`",
          "`inquiryModel.js`",
          "`propertyId`, `userId`, `agentId`, `message`, `status`",
          "`{agentId, status, createdAt:-1}`",
        ],
        [
          "`conversation`",
          "`conversationModel.js`",
          "`participants[]`, `propertyId`, `lastMessageAt`",
          "`{participants, lastMessageAt:-1}`",
        ],
        [
          "`message`",
          "`messageModel.js`",
          "`conversationId`, `senderId`, `body`, `attachments[]`, `readAt`",
          "`{conversationId, createdAt:-1}`",
        ],
        [
          "`notification`",
          "`notificationModel.js`",
          "`userId`, `type`, `payload` (Mixed), `readAt`",
          "`{userId, readAt, createdAt:-1}`",
        ],
        [
          "`review`",
          "`reviewModel.js`",
          "`targetType`, `targetId`, `rating`, `body`, `userId`",
          "**unique** `{targetType, targetId, userId}`",
        ],
      ],
      caption:
        "Every model sets `timestamps: true`, so `createdAt` and `updatedAt` are available on all fifteen collections.",
    },

    { t: "h2", text: "The property model" },

    {
      t: "p",
      text: "The `property` collection is the centre of the system, and the only model with enough fields to be worth reading in full.",
    },

    {
      t: "code",
      lang: "js",
      title: "models/propertyModel.js",
      code: `const propertySchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, trim: true },

    type:    { type: String, required: true,
               enum: ["apartment", "villa", "plot", "commercial", "farmhouse"] },
    purpose: { type: String, required: true, enum: ["rent", "buy"] },

    price:    { type: Number, required: true, min: 0 },
    currency: { type: String, default: "AED" },

    size:  { type: Number, min: 0 },
    beds:  { type: Number, min: 0 },
    baths: { type: Number, min: 0 },
    floor: { type: Number },

    furnished: { type: String, default: "unfurnished",
                 enum: ["unfurnished", "semi-furnished", "furnished"] },
    amenities:  { type: [String], default: [] },

    // GeoJSON Point. Note the [lng, lat] order — not [lat, lng].
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
        required: true,
      },
      coordinates: { type: [Number], required: true },
    },

    address:    { type: String, trim: true },
    buildingId: { type: ObjectId, ref: "building" },

    ownerId: { type: ObjectId, required: true, ref: "user" },
    agentId: { type: ObjectId, ref: "user" },

    status: { type: String, default: "draft",
              enum: ["draft", "active", "rented", "sold", "expired"] },

    verifiedAt:     Date,
    availableFrom:  Date,
  },
  { timestamps: true },
);

propertySchema.index({ location: "2dsphere" });
propertySchema.index({ purpose: 1, status: 1, price: 1 });
propertySchema.index({ title: "text", description: "text", address: "text" });`,
    },

    {
      t: "callout",
      kind: "danger",
      title: "Coordinates are [lng, lat]",
      text: "GeoJSON — and therefore MongoDB's `$geoIntersects` and `$near` — expect longitude first. Every Leaflet click handler, every `MapPicker` in the admin console and every coordinate you paste into a boundary field must be reversed from the usual screen-order intuition. This is the single most common source of 'why is my point in the ocean' bugs in this codebase.",
    },

    { t: "h3", text: "Why these three indexes" },

    {
      t: "table",
      columns: ["Index", "Serves"],
      rows: [
        [
          '`{ location: "2dsphere" }`',
          "Radius, polygon and commute search, and the similar-properties `$near`.",
        ],
        [
          "`{ purpose: 1, status: 1, price: 1 }`",
          'The default list query, which always filters `status: "active"` and almost always filters `purpose`, then sorts by price.',
        ],
        [
          '`{ title: "text", description: "text", address: "text" }`',
          "`?q=` full-text search. When a text query is present the list endpoint sorts by `$text.score` instead of `createdAt`.",
        ],
      ],
    },

    {
      t: "callout",
      kind: "info",
      title: "Why `currency` defaults to AED",
      text: "The listing model was built around the UAE market — which is why the default currency is AED and the sample search area in the admin console is a Connaught Ring polygon, which is not. The field is fully configurable per listing and the front ends read it rather than hard-coding a symbol, but the default is a genuine remnant of the original brief.",
    },

    { t: "h2", text: "Validation and errors" },

    {
      t: "p",
      text: "Validation happens in three layers, in ascending order of cost: schema constraints in Mongoose, hand-written checks in controllers, and the shared error middleware that translates whatever escapes.",
    },

    {
      t: "table",
      columns: ["Layer", "Catches", "Response"],
      rows: [
        [
          "Mongoose schema",
          "Missing required fields, enum violations, `min`/`max` violations, malformed `ObjectId`",
          "`ValidationError` → 400",
        ],
        [
          "Controller checks",
          "Missing business fields, empty filter objects, malformed polygons, wrong roles, failed ownership checks",
          "400 / 403, often via `errorResponse`",
        ],
        [
          "`errorHandler`",
          "Duplicate keys, cast errors, anything unhandled",
          "`CastError` → 400, `11000` → 409, else `statusCode` or 500",
        ],
      ],
    },

    {
      t: "code",
      lang: "js",
      title: "middleware/errorMiddleware.js",
      code: `export function errorHandler(err, req, res, next) {
  // Once headers are out, the only correct move is to stop touching them.
  if (res.headersSent) return next(err);

  let status = err.statusCode || 500;
  let message = err.message || "Something went wrong";

  if (err.name === "ValidationError") {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(", ");
  } else if (err.name === "CastError") {
    status = 400;
    message = "Invalid identifier";
  } else if (err.code === 11000) {
    status = 409;
    message = "Duplicate record";
  }

  res.status(status).json({ success: false, message });
}`,
    },

    {
      t: "callout",
      kind: "warn",
      title: "A known bug in reviewController.js",
      text: "Two error paths in `controllers/reviewController.js` call `errorResponse(...)` but the module is never imported in that file. Those paths throw a `ReferenceError` instead of returning their intended 400/404 — which the error handler then reports as a 500. If you exercise review creation against a missing target, that is why the status code looks wrong.",
    },

    { t: "h2", text: "Swagger and OpenAPI" },

    {
      t: "p",
      text: "The service documents itself. `config/swagger/` assembles an OpenAPI 3.0.3 document from seven modules and serves it three ways: an interactive UI at `/api-docs`, the raw JSON at `/api-docs.json`, and inline in the running app's route documentation.",
    },

    {
      t: "code",
      lang: "bash",
      title: "config/swagger/",
      code: `config/swagger/
├── index.js       API_PREFIX + the assembled swaggerDocument
├── components.js  Shared response, error, param and GeoJSON schemas (483 lines)
├── schemas.js     Mongoose schemas expressed as OpenAPI schemas (70 lines)
├── paths.core.js      auth, properties, media, favourites, saved searches, inquiries
├── paths.admin.js     agencies, profiles, areas, buildings, reviews, dashboards
├── paths.search.js    suggest, polygon, commute
├── paths.social.js    conversations, notifications
└── paths.dashboard.js the role dashboards and verification toggles`,
    },

    {
      t: "p",
      text: "Because the document is generated from helpers like `objectId()`, `dateString()`, `geoPoint()`, `geoPolygon()`, `paginationParams` and `errorResponse()`, the same `ObjectId` string format and the same error envelope appear identically in all 51 path definitions. Splitting the paths across four files by domain keeps any single file under 500 lines.",
    },

    {
      t: "callout",
      kind: "info",
      title: "What the spec does not declare",
      text: "There is no `securitySchemes` block. Authentication is described in the document's `info.description` prose and inline per-operation notes, not as an OpenAPI security scheme. It is also missing `GET /api/v1/health`, which is registered directly in `server.js` rather than through a router. Both are worth adding if you extend the specification.",
    },

    { t: "h2", text: "Environment variables" },

    {
      t: "p",
      text: "Fifteen keys across four concerns. None of them has a default except `PORT`, and only three subsystems tolerate a missing configuration — Cloudinary, Redis and OTP delivery.",
    },

    {
      t: "table",
      columns: ["Variable", "Required", "Purpose"],
      rows: [
        ["`PORT`", "no", "HTTP port. Defaults to `4000`."],
        [
          "`NODE_ENV`",
          "no",
          "Controls the `secure` flag on cookies. Must be `production` in production.",
        ],
        [
          "`MONGODB_URL`",
          "**yes**",
          "MongoDB connection string. Connection errors are logged, not thrown.",
        ],
        [
          "`CLIENT_URL`",
          "**yes**",
          "CORS origin for the mobile app — an `exp://` or `localhost:8081` URL. Also the Socket.IO CORS origin.",
        ],
        [
          "`CLIENT_WEB_URL`",
          "**yes**",
          "CORS origin for the Vite web app and admin console. **Missing from `.env.example`.**",
        ],
        [
          "`JWT_SECRET_KEY`",
          "**yes**",
          "Signs access tokens and verifies socket handshakes.",
        ],
        ["`JWT_REFRESH_SECRET_KEY`", "**yes**", "Signs refresh tokens."],
        [
          "`JWT_ACCESS_TIME`",
          "no",
          "Access token lifetime. Defaults to `15m`.",
        ],
        [
          "`JWT_REFRESH_TIME`",
          "no",
          "Refresh token lifetime. Defaults to `7d`.",
        ],
        ["`OTP_SECRET_KEY`", "for OTP", "Salted into the SHA-256 OTP hash."],
        ["`CLOUDINARY_CLOUD_NAME`", "for media", "Cloudinary account."],
        ["`CLOUDINARY_API_KEY`", "for media", "Cloudinary account."],
        ["`CLOUDINARY_API_SECRET`", "for media", "Cloudinary account."],
        [
          "`UPSTASH_REDIS_REST_URL`",
          "no",
          "Enables caching. Absent ⇒ `cache` is a no-op.",
        ],
        [
          "`UPSTASH_REDIS_REST_TOKEN`",
          "no",
          "Enables caching. Absent ⇒ `cache` is a no-op.",
        ],
      ],
    },

    {
      t: "callout",
      kind: "warn",
      title: "Two documentation bugs in `.env.example`",
      text: "First, `CLIENT_WEB_URL` is used by `server.js` for CORS but is absent from the committed example file — copy the example verbatim and the web app will fail every request. Second, the repository `README.md` still documents a different set of variables (`REACT_APP_PUBLIC_URL`, `REACT_APP_CLOUDINARY_URL`, `CLIENT_URL` alone) from the CRA generation of this project. Trust this page, not the README, for the environment contract.",
    },

    { t: "h2", text: "A request, end to end" },

    {
      t: "p",
      text: "To tie the sections together, here is what happens when the web app renders a search page — `GET /api/v1/properties?purpose=rent&beds=2&priceMax=60000&page=2` — from request to pixels.",
    },

    {
      t: "steps",
      items: [
        {
          title: "CORS preflight",
          text: "The browser asks whether `http://localhost:5173` may read the response. It is in the allowlist and `credentials` is true, so the preflight succeeds and the cookies ride along.",
        },
        {
          title: "Global rate limit",
          text: "The 1,000-per-15-minutes limiter increments. The auth limiter does not apply — this is not the auth router.",
        },
        {
          title: "Route match",
          text: "`routes/propertyRoute.js` matches `GET /` with no middleware chain, so the request goes straight to `getProperties`.",
        },
        {
          title: "Filter construction",
          text: '`buildPropertyFilter` produces `{ status: "active", purpose: "rent", beds: { $gte: 2 }, price: { $lte: 60000 } }`.',
        },
        {
          title: "Page slice",
          text: "`.skip(20).limit(20).sort({ createdAt: -1 })` runs against the `{ purpose, status, price }` index. A parallel `countDocuments` returns the total.",
        },
        {
          title: "Image batching",
          text: "`attachImages` issues **one** `propertyMedia` query for all 20 ids and attaches `images[]` and `thumbnail` to each row.",
        },
        {
          title: "Response",
          text: "`{ success: true, count, page, totalPages, data }` with HTTP 200.",
        },
        {
          title: "Client cache",
          text: "The axios wrapper writes the response into `apiCache` under a hash of the URL. The `queryStore` marks the result fresh; re-renders read from cache without a second request.",
        },
      ],
    },

    {
      t: "callout",
      kind: "tip",
      title: "Where to start reading the code",
      text: "Read in this order: `server.js` for the shape, `models/propertyModel.js` for the domain, `utils/geoUtils.js` for the one genuinely interesting algorithm, `controllers/propertyController.js` for the shared filter builder, then `config/socket.js` for realtime. Those five files cover most of the decisions worth understanding.",
    },

    {
      t: "p",
      text: "Next: the admin console — the same API seen from the operator's side.",
    },
  ],
};
