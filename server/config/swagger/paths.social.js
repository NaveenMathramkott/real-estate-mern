import {
  errorResponse,
  idParam,
  ok,
  paginationParams,
  queryParam,
} from "./schemas.js";
import { unauthorized } from "./paths.core.js";

export const conversationPaths = {
  "/conversations": {
    get: {
      tags: ["Chat"],
      summary: "List your conversations",
      security: [{ cookieAuth: [] }],
      responses: {
        200: ok("Conversations", {
          type: "object",
          properties: {
            success: { type: "boolean" },
            conversations: {
              type: "array",
              items: { $ref: "#/components/schemas/Conversation" },
            },
          },
        }),
        401: unauthorized,
      },
    },
    post: {
      tags: ["Chat"],
      summary: "Start a conversation",
      description:
        "Returns the existing thread when one already exists for the pair.",
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["participantId"],
              properties: {
                participantId: { type: "string" },
                propertyId: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        200: ok("Existing conversation reused"),
        201: ok("Conversation created", "#/components/schemas/Conversation"),
        400: errorResponse,
        401: unauthorized,
      },
    },
  },

  "/conversations/{id}": {
    get: {
      tags: ["Chat"],
      summary: "Conversation detail",
      security: [{ cookieAuth: [] }],
      parameters: [idParam("id", "Conversation id")],
      responses: {
        200: ok("Conversation"),
        401: unauthorized,
        403: errorResponse,
        404: errorResponse,
      },
    },
  },

  "/conversations/{id}/messages": {
    get: {
      tags: ["Chat"],
      summary: "Message history",
      description:
        "Ordered oldest to newest. Pass `before` for backfill pagination.",
      security: [{ cookieAuth: [] }],
      parameters: [
        idParam("id", "Conversation id"),
        ...paginationParams,
        queryParam("before", "Only messages created before this timestamp", {
          type: "string",
          format: "date-time",
        }),
      ],
      responses: {
        200: ok("Messages"),
        401: unauthorized,
        403: errorResponse,
        404: errorResponse,
      },
    },
    post: {
      tags: ["Chat"],
      summary: "Send a message",
      description:
        "Persists the message, then broadcasts it to the thread and notifies other participants — the same delivery path used by the socket.",
      security: [{ cookieAuth: [] }],
      parameters: [idParam("id", "Conversation id")],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["body"],
              properties: {
                body: { type: "string" },
                attachments: { type: "array", items: { type: "string" } },
              },
            },
          },
        },
      },
      responses: {
        201: ok("Message sent", "#/components/schemas/Message"),
        400: errorResponse,
        401: unauthorized,
        403: errorResponse,
        404: errorResponse,
      },
    },
  },

  "/conversations/{id}/read": {
    post: {
      tags: ["Chat"],
      summary: "Mark the conversation as read",
      security: [{ cookieAuth: [] }],
      parameters: [idParam("id", "Conversation id")],
      responses: {
        200: ok("Marked as read"),
        401: unauthorized,
        403: errorResponse,
        404: errorResponse,
      },
    },
  },
};

export const notificationPaths = {
  "/notifications": {
    get: {
      tags: ["Notifications"],
      summary: "List notifications",
      security: [{ cookieAuth: [] }],
      parameters: [
        queryParam("unreadOnly", "Return unread notifications only", {
          type: "string",
          enum: ["true", "false"],
        }),
        queryParam("limit", "Maximum results", {
          type: "integer",
          default: 30,
        }),
      ],
      responses: {
        200: ok("Notifications", {
          type: "object",
          properties: {
            success: { type: "boolean" },
            notifications: {
              type: "array",
              items: { $ref: "#/components/schemas/Notification" },
            },
          },
        }),
        401: unauthorized,
      },
    },
  },

  "/notifications/{id}/read": {
    patch: {
      tags: ["Notifications"],
      summary: "Mark one notification as read",
      security: [{ cookieAuth: [] }],
      parameters: [idParam("id", "Notification id")],
      responses: {
        200: ok("Updated"),
        401: unauthorized,
        404: errorResponse,
      },
    },
  },

  "/notifications/read-all": {
    patch: {
      tags: ["Notifications"],
      summary: "Mark every notification as read",
      security: [{ cookieAuth: [] }],
      responses: { 200: ok("Updated"), 401: unauthorized },
    },
  },
};

export const reviewPaths = {
  "/reviews": {
    get: {
      tags: ["Reviews"],
      summary: "List reviews you have written",
      security: [{ cookieAuth: [] }],
      responses: { 200: ok("Your reviews"), 401: unauthorized },
    },
    post: {
      tags: ["Reviews"],
      summary: "Write or update a review",
      description:
        "Upserts on (targetType, targetId, userId), so reviewing twice edits the earlier review. Self-reviews are rejected.",
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["targetType", "targetId", "rating"],
              properties: {
                targetType: {
                  type: "string",
                  enum: ["building", "area", "agent"],
                },
                targetId: { type: "string" },
                rating: { type: "integer", minimum: 1, maximum: 5 },
                body: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        201: ok("Review saved", "#/components/schemas/Review"),
        400: errorResponse,
        401: unauthorized,
        404: errorResponse,
      },
    },
  },

  "/reviews/{id}": {
    delete: {
      tags: ["Reviews"],
      summary: "Delete a review",
      description: "The author or an admin may delete a review.",
      security: [{ cookieAuth: [] }],
      parameters: [idParam("id", "Review id")],
      responses: {
        200: ok("Review deleted"),
        401: unauthorized,
        403: errorResponse,
        404: errorResponse,
      },
    },
  },
};

export default { conversationPaths, notificationPaths, reviewPaths };
