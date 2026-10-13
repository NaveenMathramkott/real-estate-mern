import { errorResponse, idParam, ok, queryParam } from "./schemas.js";
import { unauthorized } from "./paths.core.js";

const forbidden = errorResponse;

const verifyBody = (schema) => ({
  required: true,
  content: {
    "application/json": {
      schema: {
        type: "object",
        required: ["verified"],
        properties: { verified: { type: "boolean", description: schema } },
      },
    },
  },
});

export const dashboardPaths = {
  "/dashboard": {
    get: {
      tags: ["Dashboard"],
      summary: "Dashboard for the signed-in role",
      description:
        "Returns the dashboard matching your role: buyers and renters get their activity, agents and landlords get listing performance, and admins get platform-wide totals.",
      security: [{ cookieAuth: [] }],
      responses: {
        200: ok("Role-appropriate dashboard"),
        401: unauthorized,
        403: forbidden,
      },
    },
  },

  "/dashboard/buyer": {
    get: {
      tags: ["Dashboard"],
      summary: "Buyer / renter dashboard",
      description:
        "Favorites, saved searches, inquiries sent, conversations and unread notifications, plus a value summary of the favorited listings grouped by purpose.",
      security: [{ cookieAuth: [] }],
      responses: {
        200: {
          description: "Buyer dashboard",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/BuyerDashboard" },
            },
          },
        },
        401: unauthorized,
        403: forbidden,
      },
    },
  },

  "/dashboard/agent": {
    get: {
      tags: ["Dashboard"],
      summary: "Agent / landlord dashboard",
      description:
        "Listing totals by status and purpose, portfolio and live-market value, price range, media count, lead pipeline by status, and recent listings, inquiries and price changes.",
      security: [{ cookieAuth: [] }],
      responses: {
        200: {
          description: "Agent dashboard",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AgentDashboard" },
            },
          },
        },
        401: unauthorized,
        403: forbidden,
      },
    },
  },

  "/dashboard/admin": {
    get: {
      tags: ["Dashboard"],
      summary: "Admin dashboard",
      description:
        "Platform-wide totals for users, properties, agencies, areas, buildings, reviews and messages, split into explicit `verified` and `unverified` queues for users, properties and agencies.",
      security: [{ cookieAuth: [] }],
      responses: {
        200: {
          description: "Admin dashboard",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AdminDashboard" },
            },
          },
        },
        401: unauthorized,
        403: forbidden,
      },
    },
  },

  "/dashboard/admin/users/{userId}/verify": {
    patch: {
      tags: ["Dashboard"],
      summary: "Set a user's verification state",
      description: "Admin only. Normally set by completing the OTP flow.",
      security: [{ cookieAuth: [] }],
      parameters: [idParam("userId", "User id")],
      requestBody: verifyBody("Whether the account is verified"),
      responses: {
        200: ok("Updated", "#/components/schemas/User"),
        400: errorResponse,
        401: unauthorized,
        403: forbidden,
        404: errorResponse,
      },
    },
  },

  "/dashboard/admin/properties/{propertyId}/verify": {
    patch: {
      tags: ["Dashboard"],
      summary: "Set a property's verification state",
      description:
        "Admin only. Verifying stamps `verifiedAt`; un-verifying clears it back to null.",
      security: [{ cookieAuth: [] }],
      parameters: [idParam("propertyId", "Property id")],
      requestBody: verifyBody("Whether the listing is verified"),
      responses: {
        200: ok("Updated", "#/components/schemas/Property"),
        400: errorResponse,
        401: unauthorized,
        403: forbidden,
        404: errorResponse,
      },
    },
  },

  "/dashboard/admin/agencies/{agencyId}/verify": {
    patch: {
      tags: ["Dashboard"],
      summary: "Set an agency's verification state",
      security: [{ cookieAuth: [] }],
      parameters: [idParam("agencyId", "Agency id")],
      requestBody: verifyBody("Whether the agency is verified"),
      responses: {
        200: ok("Updated"),
        400: errorResponse,
        401: unauthorized,
        403: forbidden,
        404: errorResponse,
      },
    },
  },
};

export default { dashboardPaths };
