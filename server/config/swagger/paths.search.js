import {
  errorResponse,
  idParam,
  ok,
  paginationParams,
  queryParam,
} from "./schemas.js";
import { unauthorized } from "./paths.core.js";

export const searchPaths = {
  "/search/suggest": {
    get: {
      tags: ["Search"],
      summary: "Autocomplete suggestions",
      description:
        "Matches area names and cities as well as listing titles and addresses.",
      parameters: [queryParam("q", "Search text", { type: "string" }, true)],
      responses: {
        200: {
          description: "Suggestions",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean" },
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: { type: "string", enum: ["area", "property"] },
                        label: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        400: errorResponse,
      },
    },
  },

  "/search/polygon": {
    post: {
      tags: ["Search"],
      summary: "Draw-area polygon search",
      description:
        "Returns listings intersecting the drawn polygon with price statistics. Results are cached for 2 minutes.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["coordinates"],
              properties: {
                coordinates: {
                  type: "array",
                  description:
                    "Ring of [lng, lat] points. At least three required, and the ring must be closed — the first point must repeat as the last.",
                  minItems: 3,
                  items: { type: "array", items: { type: "number" } },
                  example: [
                    [77.19, 28.6],
                    [77.23, 28.6],
                    [77.23, 28.63],
                    [77.19, 28.63],
                    [77.19, 28.6],
                  ],
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Listings within the polygon",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean" },
                  total: { type: "integer" },
                  stats: {
                    type: "object",
                    properties: {
                      avgPrice: { type: "number" },
                      minPrice: { type: "number" },
                      maxPrice: { type: "number" },
                    },
                  },
                  properties: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Property" },
                  },
                },
              },
            },
          },
        },
        400: errorResponse,
      },
    },
  },

  "/search/commute": {
    post: {
      tags: ["Search"],
      summary: "Commute / isochrone search",
      description:
        "Derives a reachable radius from an origin and a time budget, then returns listings inside it. Cached for 5 minutes.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["lat", "lng"],
              properties: {
                lat: { type: "number", example: 28.6139 },
                lng: { type: "number", example: 77.209 },
                minutes: {
                  type: "number",
                  default: 30,
                  description: "Time budget in minutes",
                },
                speedKph: {
                  type: "number",
                  default: 30,
                  description: "Assumed travel speed used to derive the radius",
                },
              },
            },
          },
        },
      },
      responses: {
        200: ok("Listings within the reachable radius"),
        400: errorResponse,
      },
    },
  },
};

export const savedSearchPaths = {
  "/saved-searches": {
    get: {
      tags: ["Saved Searches"],
      summary: "List saved searches",
      security: [{ cookieAuth: [] }],
      responses: {
        200: ok("Saved searches", {
          type: "object",
          properties: {
            success: { type: "boolean" },
            savedSearches: {
              type: "array",
              items: { $ref: "#/components/schemas/SavedSearch" },
            },
          },
        }),
        401: unauthorized,
      },
    },
    post: {
      tags: ["Saved Searches"],
      summary: "Save a search",
      description:
        "Filters are validated against the search layer before being stored.",
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["filters"],
              properties: {
                filters: {
                  type: "object",
                  description:
                    "Uses the same keys as the GET /properties filters",
                  additionalProperties: true,
                  example: { purpose: "rent", beds: 2, priceMax: 50000 },
                },
                alertFrequency: {
                  type: "string",
                  enum: ["off", "daily", "weekly", "instant"],
                  default: "daily",
                },
              },
            },
          },
        },
      },
      responses: {
        201: ok("Saved", "#/components/schemas/SavedSearch"),
        400: errorResponse,
        401: unauthorized,
      },
    },
  },

  "/saved-searches/{id}": {
    delete: {
      tags: ["Saved Searches"],
      summary: "Delete a saved search",
      security: [{ cookieAuth: [] }],
      parameters: [idParam("id", "Saved search id")],
      responses: {
        200: ok("Deleted"),
        401: unauthorized,
        403: errorResponse,
        404: errorResponse,
      },
    },
  },

  "/saved-searches/{id}/results": {
    get: {
      tags: ["Saved Searches"],
      summary: "Preview current matches",
      description: "Re-runs the stored filters and stamps lastRunAt.",
      security: [{ cookieAuth: [] }],
      parameters: [idParam("id", "Saved search id")],
      responses: {
        200: ok("Current matches"),
        401: unauthorized,
        403: errorResponse,
        404: errorResponse,
      },
    },
  },
};

export const favoritePaths = {
  "/favorites": {
    get: {
      tags: ["Favorites"],
      summary: "List favorited properties",
      security: [{ cookieAuth: [] }],
      responses: {
        200: ok("Favorites"),
        401: unauthorized,
      },
    },
    post: {
      tags: ["Favorites"],
      summary: "Favorite a property",
      description: "Idempotent — re-favoriting returns the existing record.",
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["propertyId"],
              properties: { propertyId: { type: "string" } },
            },
          },
        },
      },
      responses: {
        201: ok("Favorited", "#/components/schemas/Favorite"),
        400: errorResponse,
        401: unauthorized,
        404: errorResponse,
      },
    },
    delete: {
      tags: ["Favorites"],
      summary: "Remove a favorite",
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["propertyId"],
              properties: { propertyId: { type: "string" } },
            },
          },
        },
      },
      responses: { 200: ok("Removed"), 400: errorResponse, 401: unauthorized },
    },
  },

  "/favorites/{propertyId}": {
    delete: {
      tags: ["Favorites"],
      summary: "Remove a favorite by property id",
      security: [{ cookieAuth: [] }],
      parameters: [idParam("propertyId", "Property id")],
      responses: { 200: ok("Removed"), 400: errorResponse, 401: unauthorized },
    },
  },
};

export const inquiryPaths = {
  "/inquiries": {
    get: {
      tags: ["Inquiries"],
      summary: "List inquiries addressed to you",
      description: "Restricted to the agent, landlord and admin roles.",
      security: [{ cookieAuth: [] }],
      parameters: [
        queryParam("status", "Filter by status", {
          type: "string",
          enum: ["new", "contacted", "closed"],
        }),
      ],
      responses: {
        200: ok("Inquiries"),
        401: unauthorized,
        403: errorResponse,
      },
    },
  },

  "/inquiries/{id}/status": {
    patch: {
      tags: ["Inquiries"],
      summary: "Update an inquiry status",
      description: "Notifies the inquirer of the change.",
      security: [{ cookieAuth: [] }],
      parameters: [idParam("id", "Inquiry id")],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["status"],
              properties: {
                status: {
                  type: "string",
                  enum: ["new", "contacted", "closed"],
                },
              },
            },
          },
        },
      },
      responses: {
        200: ok("Updated"),
        400: errorResponse,
        401: unauthorized,
        403: errorResponse,
        404: errorResponse,
      },
    },
  },
};

export default { searchPaths, savedSearchPaths, favoritePaths, inquiryPaths };
