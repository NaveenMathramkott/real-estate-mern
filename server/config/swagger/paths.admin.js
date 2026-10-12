import {
  errorResponse,
  idParam,
  ok,
  paginationParams,
  queryParam,
} from "./schemas.js";
import { unauthorized } from "./paths.core.js";

const forbidden = errorResponse;
const conflict = {
  description: "Resource is still referenced and cannot be deleted",
  content: {
    "application/json": { schema: { $ref: "#/components/schemas/Error" } },
  },
};

const boundarySchema = {
  type: "object",
  properties: {
    type: { type: "string", enum: ["Polygon"], default: "Polygon" },
    coordinates: {
      type: "array",
      description:
        "Array of linear rings. The ring must be closed — repeat the first [lng, lat] point as the last.",
      items: {
        type: "array",
        items: { type: "array", items: { type: "number" } },
        example: [
          [77.18, 28.59],
          [77.24, 28.59],
          [77.24, 28.64],
          [77.18, 28.59],
        ],
      },
    },
  },
};

const locationSchema = {
  type: "object",
  properties: {
    type: { type: "string", enum: ["Point"], default: "Point" },
    coordinates: {
      type: "array",
      items: { type: "number" },
      example: [77.209, 28.6139],
    },
  },
};

const adminOnly = "Requires the `admin` role.";

export const buildingPaths = {
  "/buildings": {
    get: {
      tags: ["Areas & Buildings"],
      summary: "List buildings",
      parameters: [
        queryParam("name", "Fuzzy match on building name", { type: "string" }),
        queryParam("developer", "Fuzzy match on developer", { type: "string" }),
        ...paginationParams,
      ],
      responses: {
        200: ok("Matching buildings", {
          type: "object",
          properties: {
            success: { type: "boolean" },
            page: { type: "integer" },
            total: { type: "integer" },
            pages: { type: "integer" },
            buildings: {
              type: "array",
              items: { $ref: "#/components/schemas/Building" },
            },
          },
        }),
      },
    },
    post: {
      tags: ["Areas & Buildings"],
      summary: "Create a building",
      description: `${adminOnly} Buildings are reference data used to group listings and reviews.`,
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["name", "location"],
              properties: {
                name: { type: "string" },
                developer: { type: "string" },
                yearBuilt: { type: "number" },
                amenities: { type: "array", items: { type: "string" } },
                location: locationSchema,
              },
            },
          },
        },
      },
      responses: {
        201: ok("Building created", "#/components/schemas/Building"),
        400: errorResponse,
        401: unauthorized,
        403: forbidden,
      },
    },
  },

  "/buildings/{id}": {
    get: {
      tags: ["Areas & Buildings"],
      summary: "Building detail with its active listings",
      parameters: [idParam("id", "Building id")],
      responses: {
        200: ok("Building and its listings"),
        400: errorResponse,
        404: errorResponse,
      },
    },
    patch: {
      tags: ["Areas & Buildings"],
      summary: "Update a building",
      description: adminOnly,
      security: [{ cookieAuth: [] }],
      parameters: [idParam("id", "Building id")],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                name: { type: "string" },
                developer: { type: "string" },
                yearBuilt: { type: "number" },
                amenities: { type: "array", items: { type: "string" } },
                location: locationSchema,
              },
            },
          },
        },
      },
      responses: {
        200: ok("Building updated", "#/components/schemas/Building"),
        400: errorResponse,
        401: unauthorized,
        403: forbidden,
        404: errorResponse,
      },
    },
    delete: {
      tags: ["Areas & Buildings"],
      summary: "Delete a building",
      description: `${adminOnly} Returns 409 while any property still references this building.`,
      security: [{ cookieAuth: [] }],
      parameters: [idParam("id", "Building id")],
      responses: {
        200: ok("Building deleted"),
        401: unauthorized,
        403: forbidden,
        404: errorResponse,
        409: conflict,
      },
    },
  },

  "/buildings/{id}/reviews": {
    get: {
      tags: ["Areas & Buildings"],
      summary: "Building reviews with rating distribution",
      parameters: [idParam("id", "Building id"), ...paginationParams],
      responses: {
        200: ok("Reviews", "#/components/schemas/BuildingReviews"),
        400: errorResponse,
        404: errorResponse,
      },
    },
  },
};

export const areaPaths = {
  "/areas": {
    get: {
      tags: ["Areas & Buildings"],
      summary: "List areas",
      parameters: [
        queryParam("city", "Fuzzy match on city", { type: "string" }),
        queryParam("name", "Fuzzy match on name", { type: "string" }),
        ...paginationParams,
      ],
      responses: {
        200: ok("Matching areas", {
          type: "object",
          properties: {
            success: { type: "boolean" },
            page: { type: "integer" },
            total: { type: "integer" },
            pages: { type: "integer" },
            areas: {
              type: "array",
              items: { $ref: "#/components/schemas/Area" },
            },
          },
        }),
      },
    },
    post: {
      tags: ["Areas & Buildings"],
      summary: "Create an area",
      description: `${adminOnly} The boundary is a GeoJSON polygon used by area search and insights.`,
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["name", "city", "boundary"],
              properties: {
                name: { type: "string" },
                city: { type: "string" },
                boundary: boundarySchema,
              },
            },
          },
        },
      },
      responses: {
        201: ok("Area created", "#/components/schemas/Area"),
        400: errorResponse,
        401: unauthorized,
        403: forbidden,
      },
    },
  },

  "/areas/{id}": {
    get: {
      tags: ["Areas & Buildings"],
      summary: "Area detail with boundary",
      parameters: [idParam("id", "Area id")],
      responses: {
        200: ok("Area", {
          type: "object",
          properties: {
            success: { type: "boolean" },
            area: { $ref: "#/components/schemas/Area" },
          },
        }),
        400: errorResponse,
        404: errorResponse,
      },
    },
    patch: {
      tags: ["Areas & Buildings"],
      summary: "Update an area",
      description: `${adminOnly} Changing the boundary clears the cached insights for this area.`,
      security: [{ cookieAuth: [] }],
      parameters: [idParam("id", "Area id")],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                name: { type: "string" },
                city: { type: "string" },
                boundary: boundarySchema,
              },
            },
          },
        },
      },
      responses: {
        200: ok("Area updated", "#/components/schemas/Area"),
        400: errorResponse,
        401: unauthorized,
        403: forbidden,
        404: errorResponse,
      },
    },
    delete: {
      tags: ["Areas & Buildings"],
      summary: "Delete an area",
      description: `${adminOnly} Returns 409 while any review still references this area.`,
      security: [{ cookieAuth: [] }],
      parameters: [idParam("id", "Area id")],
      responses: {
        200: ok("Area deleted"),
        401: unauthorized,
        403: forbidden,
        404: errorResponse,
        409: conflict,
      },
    },
  },

  "/areas/{id}/insights": {
    get: {
      tags: ["Areas & Buildings"],
      summary: "Market insights for an area",
      description:
        "Aggregates listings intersecting the area boundary into price stats, purpose split, type mix, bedroom counts and average rating. Cached for 10 minutes.",
      parameters: [idParam("id", "Area id")],
      responses: {
        200: ok("Insights", "#/components/schemas/AreaInsights"),
        400: errorResponse,
        404: errorResponse,
      },
    },
  },
};

export const agencyPaths = {
  "/agencies": {
    get: {
      tags: ["Agencies & Profiles"],
      summary: "List agencies",
      parameters: [
        queryParam("verified", "Filter by verification state", {
          type: "string",
          enum: ["true", "false"],
        }),
        ...paginationParams,
      ],
      responses: {
        200: ok("Matching agencies"),
      },
    },
    post: {
      tags: ["Agencies & Profiles"],
      summary: "Create an agency",
      description: adminOnly,
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["name"],
              properties: {
                name: { type: "string" },
                logo: { type: "string" },
                licenseNo: { type: "string" },
                verified: { type: "boolean", default: false },
              },
            },
          },
        },
      },
      responses: {
        201: ok("Agency created"),
        400: errorResponse,
        401: unauthorized,
        403: forbidden,
      },
    },
  },

  "/agencies/{id}": {
    get: {
      tags: ["Agencies & Profiles"],
      summary: "Agency detail with its member profiles",
      parameters: [idParam("id", "Agency id")],
      responses: {
        200: ok("Agency and members"),
        400: errorResponse,
        404: errorResponse,
      },
    },
    patch: {
      tags: ["Agencies & Profiles"],
      summary: "Update an agency",
      description: `${adminOnly} The \`verified\` flag is only applied for admins.`,
      security: [{ cookieAuth: [] }],
      parameters: [idParam("id", "Agency id")],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                name: { type: "string" },
                logo: { type: "string" },
                licenseNo: { type: "string" },
                verified: { type: "boolean" },
              },
            },
          },
        },
      },
      responses: {
        200: ok("Agency updated"),
        401: unauthorized,
        403: forbidden,
        404: errorResponse,
      },
    },
    delete: {
      tags: ["Agencies & Profiles"],
      summary: "Delete an agency",
      description: `${adminOnly} Returns 409 while any profile still references this agency.`,
      security: [{ cookieAuth: [] }],
      parameters: [idParam("id", "Agency id")],
      responses: {
        200: ok("Agency deleted"),
        401: unauthorized,
        403: forbidden,
        404: errorResponse,
        409: conflict,
      },
    },
  },

  "/profiles/me": {
    get: {
      tags: ["Agencies & Profiles"],
      summary: "Your profile",
      security: [{ cookieAuth: [] }],
      responses: { 200: ok("Profile"), 401: unauthorized },
    },
    patch: {
      tags: ["Agencies & Profiles"],
      summary: "Update your profile",
      description:
        "Upserts, so it works even if registration created no profile.",
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                name: { type: "string" },
                avatar: { type: "string" },
                agencyId: { type: "string" },
                bio: { type: "string" },
              },
            },
          },
        },
      },
      responses: { 200: ok("Profile updated"), 401: unauthorized },
    },
  },

  "/profiles/me/preferences": {
    patch: {
      tags: ["Agencies & Profiles"],
      summary: "Update your locale and currency",
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                locale: { type: "string", example: "en" },
                currency: { type: "string", example: "INR" },
              },
            },
          },
        },
      },
      responses: {
        200: ok("Preferences updated", "#/components/schemas/User"),
        401: unauthorized,
      },
    },
  },

  "/profiles/{userId}": {
    get: {
      tags: ["Agencies & Profiles"],
      summary: "Public profile for a user",
      security: [{ cookieAuth: [] }],
      parameters: [idParam("userId", "User id")],
      responses: {
        200: ok("User and profile"),
        400: errorResponse,
        401: unauthorized,
        404: errorResponse,
      },
    },
  },
};

export default { buildingPaths, areaPaths, agencyPaths };
