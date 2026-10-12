// Reusable schema fragments shared across the whole OpenAPI document.

export const errorResponse = {
  description: "Error response",
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/Error" },
    },
  },
};

export const ok = (description, schemaRef) => ({
  description,
  content: {
    "application/json": {
      schema: schemaRef
        ? { $ref: schemaRef }
        : {
            type: "object",
            properties: { success: { type: "boolean", example: true } },
          },
    },
  },
});

export const idParam = (name = "id", description = "Resource id") => ({
  name,
  in: "path",
  required: true,
  description,
  schema: { type: "string" },
});

export const queryParam = (name, description, schema, required = false) => ({
  name,
  in: "query",
  required,
  description,
  schema,
});

export const paginationParams = [
  queryParam("page", "Page number (1-based)", {
    type: "integer",
    minimum: 1,
    default: 1,
  }),
  queryParam("limit", "Results per page", {
    type: "integer",
    minimum: 1,
    default: 20,
  }),
];

export const propertyIdParam = {
  name: "propertyId",
  in: "query",
  required: true,
  description: "Property to favourite",
  schema: { type: "string" },
};

export default {
  errorResponse,
  ok,
  idParam,
  queryParam,
  paginationParams,
  propertyIdParam,
};
