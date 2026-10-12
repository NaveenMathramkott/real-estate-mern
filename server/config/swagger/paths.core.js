import {
  errorResponse,
  idParam,
  ok,
  paginationParams,
  queryParam,
} from "./schemas.js";

export const unauthorized = {
  description: "Authentication required",
  content: {
    "application/json": { schema: { $ref: "#/components/schemas/Error" } },
  },
};

const propertyFilterParams = [
  queryParam("purpose", "Rent or buy", {
    type: "string",
    enum: ["rent", "buy"],
  }),
  queryParam("type", "Comma-separated listing types", {
    type: "string",
    example: "apartment,villa",
  }),
  queryParam("beds", "Minimum bedrooms", { type: "integer" }),
  queryParam("priceMin", "Minimum price", { type: "number" }),
  queryParam("priceMax", "Maximum price", { type: "number" }),
  queryParam("furnished", "Comma-separated furnishing states", {
    type: "string",
  }),
  queryParam("amenities", "Comma-separated amenities (all must match)", {
    type: "string",
  }),
  queryParam("city", "Fuzzy match on the address", { type: "string" }),
  queryParam("q", "Full-text search across title, description and address", {
    type: "string",
  }),
  queryParam(
    "polygon",
    "Draw-area search as a JSON coordinate ring. The ring must be closed (first point repeated last).",
    {
      type: "string",
      description:
        "URL-encoded JSON array of [lng, lat] pairs, e.g. [[77.19,28.60],[77.23,28.60],[77.23,28.63],[77.19,28.60]]",
    },
  ),
  queryParam("lat", "Latitude for a radius search", { type: "number" }),
  queryParam("lng", "Longitude for a radius search", { type: "number" }),
  queryParam("radius", "Radius in metres (requires lat and lng)", {
    type: "number",
  }),
  ...paginationParams,
];

export const authPaths = {
  "/auth/register": {
    post: {
      tags: ["Auth"],
      summary: "Register a new user",
      description:
        "Creates an account and sets httpOnly access/refresh cookies. List creation requires the agent or landlord role.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["email", "password"],
              properties: {
                email: { type: "string", format: "email" },
                phone: { type: "string" },
                password: { type: "string", minLength: 8 },
                role: {
                  type: "string",
                  enum: ["buyer", "renter", "agent", "landlord", "admin"],
                  default: "buyer",
                },
                name: {
                  type: "string",
                  description: "Creates a linked profile",
                },
                locale: { type: "string", default: "en" },
                currency: { type: "string", default: "INR" },
              },
            },
          },
        },
      },
      responses: {
        201: ok("Registered", "#/components/schemas/AuthSuccess"),
        400: errorResponse,
        429: errorResponse,
      },
    },
  },

  "/auth/login": {
    post: {
      tags: ["Auth"],
      summary: "Log in with email and password",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["email", "password"],
              properties: {
                email: { type: "string", format: "email" },
                password: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        200: ok("Logged in", "#/components/schemas/AuthSuccess"),
        400: errorResponse,
        429: errorResponse,
      },
    },
  },

  "/auth/refresh": {
    post: {
      tags: ["Auth"],
      summary: "Rotate the refresh token",
      description:
        "Issues a new access/refresh pair and invalidates the presented refresh token. Reusing a rotated token revokes the whole token family.",
      requestBody: {
        required: false,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: { refreshToken: { type: "string" } },
            },
          },
        },
      },
      responses: {
        200: ok("New access token issued"),
        401: unauthorized,
        403: errorResponse,
      },
    },
  },

  "/auth/logout": {
    post: {
      tags: ["Auth"],
      summary: "Log out and revoke the stored refresh token",
      responses: { 200: ok("Logged out"), 500: errorResponse },
    },
  },

  "/auth/otp": {
    post: {
      tags: ["Auth"],
      summary: "Request a one-time password",
      description:
        "Stores only a salted hash of the code and enforces a 5-attempt limit. Requires Redis; without it the code is written to the server log instead.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["email"],
              properties: { email: { type: "string", format: "email" } },
            },
          },
        },
      },
      responses: {
        200: ok("OTP dispatched"),
        404: errorResponse,
        429: errorResponse,
      },
    },
  },

  "/auth/otp/verify": {
    post: {
      tags: ["Auth"],
      summary: "Verify an OTP and mark the account verified",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["email", "otp"],
              properties: {
                email: { type: "string", format: "email" },
                otp: { type: "string", example: "123456" },
              },
            },
          },
        },
      },
      responses: {
        200: ok("Verified", "#/components/schemas/AuthSuccess"),
        400: errorResponse,
        429: errorResponse,
        503: { description: "Redis is not configured" },
      },
    },
  },

  "/auth/me": {
    get: {
      tags: ["Auth"],
      summary: "Current session profile",
      security: [{ cookieAuth: [] }],
      responses: {
        200: ok("Current user", "#/components/schemas/AuthSuccess"),
        401: unauthorized,
      },
    },
  },
};

export const propertyPaths = {
  "/properties": {
    get: {
      tags: ["Properties"],
      summary: "Search listings",
      description:
        "Supports scalar filters, full-text search, radius search and polygon (draw-area) search via a 2dsphere index.",
      parameters: propertyFilterParams,
      responses: {
        200: ok("Matching listings", "#/components/schemas/PropertyList"),
        400: errorResponse,
      },
    },
    post: {
      tags: ["Properties"],
      summary: "Create a listing",
      description: "Restricted to the agent, landlord and admin roles.",
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["title", "type", "purpose", "price", "location"],
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                type: {
                  type: "string",
                  enum: [
                    "apartment",
                    "villa",
                    "plot",
                    "commercial",
                    "farmhouse",
                  ],
                },
                purpose: { type: "string", enum: ["rent", "buy"] },
                price: { type: "number" },
                currency: { type: "string", default: "INR" },
                size: { type: "number" },
                beds: { type: "number" },
                baths: { type: "number" },
                floor: { type: "number" },
                furnished: {
                  type: "string",
                  enum: ["unfurnished", "semi-furnished", "furnished"],
                },
                amenities: { type: "array", items: { type: "string" } },
                location: {
                  type: "object",
                  required: ["coordinates"],
                  properties: {
                    type: { type: "string", enum: ["Point"], default: "Point" },
                    coordinates: {
                      type: "array",
                      items: { type: "number" },
                      example: [77.209, 28.6139],
                    },
                  },
                },
                address: { type: "string" },
                buildingId: { type: "string" },
                availableFrom: { type: "string", format: "date" },
                status: {
                  type: "string",
                  enum: ["draft", "active", "rented", "sold", "expired"],
                },
              },
            },
          },
        },
      },
      responses: {
        201: ok("Listing created"),
        400: errorResponse,
        401: unauthorized,
        403: errorResponse,
      },
    },
  },

  "/properties/{id}": {
    get: {
      tags: ["Properties"],
      summary: "Listing detail with media",
      parameters: [idParam("id", "Property id")],
      responses: {
        200: ok("Property detail", "#/components/schemas/PropertyDetail"),
        400: errorResponse,
        404: errorResponse,
      },
    },
    patch: {
      tags: ["Properties"],
      summary: "Update a listing",
      description:
        "Owner, assigned agent or admin only. Changing the price writes a PriceHistory entry.",
      security: [{ cookieAuth: [] }],
      parameters: [idParam("id", "Property id")],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Property" },
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
    delete: {
      tags: ["Properties"],
      summary: "Remove a listing",
      description:
        "Soft delete — the status is set to expired rather than dropping the document.",
      security: [{ cookieAuth: [] }],
      parameters: [idParam("id", "Property id")],
      responses: {
        200: ok("Removed"),
        401: unauthorized,
        403: errorResponse,
        404: errorResponse,
      },
    },
  },

  "/properties/{id}/media": {
    post: {
      tags: ["Properties"],
      summary: "Attach media to a listing",
      description:
        "Accepts a hosted URL, or a multipart upload when Cloudinary and the multipart middleware are configured.",
      security: [{ cookieAuth: [] }],
      parameters: [idParam("id", "Property id")],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                url: { type: "string" },
                type: {
                  type: "string",
                  enum: ["image", "video", "floorplan", "tour"],
                  default: "image",
                },
                blurhash: { type: "string" },
                order: { type: "integer" },
              },
            },
          },
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: {
                file: { type: "string", format: "binary" },
                type: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        201: ok("Media attached", "#/components/schemas/PropertyMedia"),
        400: errorResponse,
        401: unauthorized,
        403: errorResponse,
      },
    },
  },

  "/properties/{id}/media/reorder": {
    patch: {
      tags: ["Properties"],
      summary: "Reorder media",
      description:
        "Applies the supplied order as the display sequence. Every id must belong to this property.",
      security: [{ cookieAuth: [] }],
      parameters: [idParam("id", "Property id")],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["order"],
              properties: {
                order: {
                  type: "array",
                  description: "Media ids in the desired display order",
                  items: { type: "string" },
                  example: [
                    "6acd001a0c1cc6c7256c4c30",
                    "6acd001a0c1cc6c7256c4c31",
                  ],
                },
              },
            },
          },
        },
      },
      responses: {
        200: ok("Media reordered"),
        400: errorResponse,
        401: unauthorized,
        403: errorResponse,
        404: errorResponse,
      },
    },
  },

  "/properties/{id}/media/{mediaId}": {
    delete: {
      tags: ["Properties"],
      summary: "Remove a media item",
      security: [{ cookieAuth: [] }],
      parameters: [
        idParam("id", "Property id"),
        idParam("mediaId", "Media id"),
      ],
      responses: {
        200: ok("Media removed"),
        401: unauthorized,
        403: errorResponse,
        404: errorResponse,
      },
    },
  },

  "/properties/{id}/price-history": {
    get: {
      tags: ["Properties"],
      summary: "Price change history",
      parameters: [idParam("id", "Property id")],
      responses: { 200: ok("History, newest first"), 400: errorResponse },
    },
  },

  "/properties/{id}/similar": {
    get: {
      tags: ["Properties"],
      summary: "Similar listings nearby",
      description:
        "Matches on purpose, type, price band and bedroom count within 5 km.",
      parameters: [
        idParam("id", "Property id"),
        queryParam("limit", "Maximum results", { type: "integer", default: 6 }),
      ],
      responses: { 200: ok("Similar listings"), 404: errorResponse },
    },
  },

  "/properties/{id}/inquire": {
    post: {
      tags: ["Properties"],
      summary: "Send an inquiry",
      description: "Routed to the assigned agent, falling back to the owner.",
      security: [{ cookieAuth: [] }],
      parameters: [idParam("id", "Property id")],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["message"],
              properties: { message: { type: "string" } },
            },
          },
        },
      },
      responses: {
        201: ok("Inquiry created", "#/components/schemas/Inquiry"),
        400: errorResponse,
        401: unauthorized,
        404: errorResponse,
      },
    },
  },

  "/properties/{id}/reviews": {
    get: {
      tags: ["Properties"],
      summary: "Reviews for the listing's building",
      description:
        "Returns an empty result when the listing is not linked to a building.",
      parameters: [idParam("id", "Property id")],
      responses: { 200: ok("Building reviews"), 404: errorResponse },
    },
  },
};

export default { authPaths, propertyPaths, unauthorized };
