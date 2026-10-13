import { schemas } from "./components.js";
import { authPaths, propertyPaths } from "./paths.core.js";
import {
  favoritePaths,
  inquiryPaths,
  savedSearchPaths,
  searchPaths,
} from "./paths.search.js";
import { areaPaths, agencyPaths, buildingPaths } from "./paths.admin.js";
import { dashboardPaths } from "./paths.dashboard.js";
import {
  conversationPaths,
  notificationPaths,
  reviewPaths,
} from "./paths.social.js";

const PORT = process.env.PORT || 4000;

// Must match the mount points in server.js. Kept in one place so the docs can
// never drift from the routes again.
export const API_PREFIX = "/api/v1";

// Full OpenAPI 3 document describing every REST endpoint the server exposes.
export const swaggerDocument = {
  openapi: "3.0.3",
  info: {
    title: "Tenementary Property Finder API",
    version: "1.0.0",
    description: [
      "Real-estate platform API covering authentication, geospatial property search,",
      "draw-area and commute queries, saved searches, favorites, inquiries, chat,",
      "market insights and reviews.",
      "",
      "### Authentication",
      "Register or log in first. Successful authentication sets two httpOnly cookies",
      "(`accessToken`, `refreshToken`) that this UI sends automatically. You can also",
      "copy the `accessToken` from the response and use the **Authorize** button.",
      "",
      "Send it as a header instead: `Authorization: Bearer <accessToken>`.",
      "",
      "Access tokens are short lived. Call `POST /auth/refresh` to rotate the pair —",
      "the previous refresh token is invalidated, and reusing one revokes the whole",
      "token family.",
      "",
      "### Realtime",
      "Chat and notifications are also delivered over Socket.IO at the same origin.",
      "Connect with `{ auth: { token: <accessToken> } }`; unauthenticated handshakes are",
      "rejected. Client events: `message:send`, `conversation:join`, `conversation:leave`,",
      "`typing`. Server events: `message:new`, `notification:new`, `typing`.",
    ].join("\n"),
  },
  servers: [
    // The prefix must live on the server entry, because every path below is
    // documented without it (e.g. /auth/login, served at /api/v1/auth/login).
    {
      url: `http://localhost:${PORT}${API_PREFIX}`,
      description: "Local development",
    },
    { url: API_PREFIX, description: "Current host" },
  ],
  tags: [
    {
      name: "Auth",
      description: "Registration, login, tokens and OTP verification",
    },
    {
      name: "Properties",
      description: "Listings, media, price history and inquiries",
    },
    {
      name: "Search",
      description: "Autocomplete, polygon draw-area and commute search",
    },
    {
      name: "Saved Searches",
      description: "Stored filters and alert frequency",
    },
    { name: "Favorites", description: "Saved property shortlist" },
    {
      name: "Inquiries",
      description: "Inbound leads for agents and landlords",
    },
    { name: "Chat", description: "Conversations and messages" },
    { name: "Notifications", description: "Notification feed" },
    {
      name: "Areas & Buildings",
      description:
        "Locality boundaries, buildings, market insights and reviews",
    },
    {
      name: "Agencies & Profiles",
      description: "Agencies, user profiles and locale/currency preferences",
    },
    { name: "Reviews", description: "Ratings for buildings, areas and agents" },
    {
      name: "Dashboard",
      description:
        "Role-specific dashboards for buyers, agents and admins, plus admin verification controls",
    },
  ],
  components: {
    schemas: {
      ...schemas,
      Health: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          status: { type: "string", example: "ok" },
        },
      },
    },
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "accessToken",
        description:
          "Set automatically at login. Alternatively paste a Bearer token into the value field using the `Bearer {token}` prefix.",
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["Auth"],
        summary: "Health check",
        description: "Confirms the API process is up.",
        responses: {
          200: {
            description: "Service is healthy",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Health" },
              },
            },
          },
        },
      },
    },

    ...authPaths,
    ...propertyPaths,
    ...searchPaths,
    ...savedSearchPaths,
    ...favoritePaths,
    ...inquiryPaths,
    ...conversationPaths,
    ...notificationPaths,
    ...areaPaths,
    ...buildingPaths,
    ...agencyPaths,
    ...reviewPaths,
    ...dashboardPaths,
  },
};

export default swaggerDocument;
