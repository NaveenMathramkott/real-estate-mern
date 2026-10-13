// Schema definitions mirroring the Mongoose models in /models.

const objectId = { type: "string", example: "6acd001a0c1cc6c7256c4c25" };
const dateString = { type: "string", format: "date-time" };

const geoPoint = {
  type: "object",
  properties: {
    type: { type: "string", enum: ["Point"], default: "Point" },
    coordinates: {
      type: "array",
      description: "[longitude, latitude] in GeoJSON order",
      items: { type: "number" },
      example: [77.209, 28.6139],
    },
  },
};

const geoPolygon = {
  type: "object",
  properties: {
    type: { type: "string", enum: ["Polygon"] },
    coordinates: {
      type: "array",
      description:
        "Array of linear rings, each an array of [lng, lat] points. Rings must be closed — the first point must repeat as the last.",
      items: {
        type: "array",
        items: { type: "array", items: { type: "number" } },
      },
    },
  },
};

export const schemas = {
  Error: {
    type: "object",
    properties: {
      success: { type: "boolean", example: false },
      message: { type: "string", example: "Property not found" },
    },
  },

  AuthSuccess: {
    type: "object",
    properties: {
      success: { type: "boolean", example: true },
      accessToken: {
        type: "string",
        description: "Send as a Bearer token or rely on the cookie",
      },
      user: { $ref: "#/components/schemas/User" },
    },
  },

  User: {
    type: "object",
    properties: {
      _id: objectId,
      email: { type: "string", format: "email" },
      phone: { type: "string" },
      role: {
        type: "string",
        enum: ["buyer", "renter", "agent", "landlord", "admin"],
      },
      verified: { type: "boolean" },
      locale: { type: "string", example: "en" },
      currency: { type: "string", example: "INR" },
    },
  },

  Property: {
    type: "object",
    properties: {
      _id: objectId,
      title: { type: "string" },
      description: { type: "string" },
      type: {
        type: "string",
        enum: ["apartment", "villa", "plot", "commercial", "farmhouse"],
      },
      purpose: { type: "string", enum: ["rent", "buy"] },
      price: { type: "number" },
      currency: { type: "string" },
      size: { type: "number", description: "Built-up area in sq ft" },
      beds: { type: "number" },
      baths: { type: "number" },
      floor: { type: "number" },
      furnished: {
        type: "string",
        enum: ["unfurnished", "semi-furnished", "furnished"],
      },
      amenities: { type: "array", items: { type: "string" } },
      location: geoPoint,
      address: { type: "string" },
      buildingId: objectId,
      ownerId: objectId,
      agentId: objectId,
      status: {
        type: "string",
        enum: ["draft", "active", "rented", "sold", "expired"],
      },
      availableFrom: dateString,
      createdAt: dateString,
      updatedAt: dateString,
    },
  },

  PropertyMedia: {
    type: "object",
    properties: {
      _id: objectId,
      propertyId: objectId,
      type: { type: "string", enum: ["image", "video", "floorplan", "tour"] },
      url: { type: "string" },
      publicId: { type: "string", description: "Cloudinary public id" },
      blurhash: { type: "string" },
      order: { type: "number" },
    },
  },

  PriceHistory: {
    type: "object",
    properties: {
      _id: objectId,
      propertyId: objectId,
      oldPrice: { type: "number" },
      newPrice: { type: "number" },
      changedAt: dateString,
    },
  },

  Favorite: {
    type: "object",
    properties: {
      _id: objectId,
      userId: objectId,
      propertyId: objectId,
      createdAt: dateString,
    },
  },

  SavedSearch: {
    type: "object",
    properties: {
      _id: objectId,
      userId: objectId,
      filters: { type: "object", additionalProperties: true },
      alertFrequency: {
        type: "string",
        enum: ["off", "daily", "weekly", "instant"],
      },
      lastRunAt: dateString,
    },
  },

  Inquiry: {
    type: "object",
    properties: {
      _id: objectId,
      propertyId: objectId,
      userId: objectId,
      agentId: objectId,
      message: { type: "string" },
      status: { type: "string", enum: ["new", "contacted", "closed"] },
      createdAt: dateString,
    },
  },

  Conversation: {
    type: "object",
    properties: {
      _id: objectId,
      participants: { type: "array", items: objectId },
      propertyId: objectId,
      lastMessageAt: dateString,
    },
  },

  Message: {
    type: "object",
    properties: {
      _id: objectId,
      conversationId: objectId,
      senderId: objectId,
      body: { type: "string" },
      attachments: { type: "array", items: { type: "string" } },
      readAt: dateString,
      createdAt: dateString,
    },
  },

  Review: {
    type: "object",
    properties: {
      _id: objectId,
      targetType: { type: "string", enum: ["building", "area", "agent"] },
      targetId: objectId,
      rating: { type: "number", minimum: 1, maximum: 5 },
      body: { type: "string" },
      userId: objectId,
      createdAt: dateString,
    },
  },

  Building: {
    type: "object",
    properties: {
      _id: objectId,
      name: { type: "string" },
      developer: { type: "string" },
      yearBuilt: { type: "number" },
      amenities: { type: "array", items: { type: "string" } },
      location: geoPoint,
    },
  },

  Agency: {
    type: "object",
    properties: {
      _id: objectId,
      name: { type: "string" },
      logo: { type: "string" },
      licenseNo: { type: "string" },
      verified: { type: "boolean" },
      createdAt: dateString,
    },
  },

  Area: {
    type: "object",
    properties: {
      _id: objectId,
      name: { type: "string" },
      city: { type: "string" },
      boundary: geoPolygon,
    },
  },

  Notification: {
    type: "object",
    properties: {
      _id: objectId,
      userId: objectId,
      type: { type: "string", example: "message" },
      payload: { type: "object", additionalProperties: true },
      readAt: dateString,
      createdAt: dateString,
    },
  },

  PropertyList: {
    type: "object",
    properties: {
      success: { type: "boolean" },
      page: { type: "integer" },
      limit: { type: "integer" },
      total: { type: "integer" },
      pages: { type: "integer" },
      properties: {
        type: "array",
        items: { $ref: "#/components/schemas/Property" },
      },
    },
  },

  PropertyDetail: {
    type: "object",
    properties: {
      success: { type: "boolean" },
      property: { $ref: "#/components/schemas/Property" },
      media: {
        type: "array",
        items: { $ref: "#/components/schemas/PropertyMedia" },
      },
    },
  },

  AreaInsights: {
    type: "object",
    properties: {
      success: { type: "boolean" },
      area: {
        type: "object",
        properties: {
          _id: objectId,
          name: { type: "string" },
          city: { type: "string" },
        },
      },
      total: { type: "integer" },
      priceStats: {
        type: "object",
        properties: {
          avgPrice: { type: "number" },
          medianPrice: { type: "number" },
          minPrice: { type: "number" },
          maxPrice: { type: "number" },
        },
      },
      byPurpose: { type: "object", additionalProperties: true },
      byType: { type: "object", additionalProperties: { type: "integer" } },
      byBeds: { type: "object", additionalProperties: { type: "integer" } },
      rating: {
        type: "object",
        properties: { average: { type: "number" }, count: { type: "integer" } },
      },
    },
  },

  BuyerDashboard: {
    type: "object",
    properties: {
      success: { type: "boolean" },
      role: { type: "string" },
      summary: {
        type: "object",
        properties: {
          favorites: { type: "integer" },
          savedSearches: { type: "integer" },
          inquiriesSent: { type: "integer" },
          conversations: { type: "integer" },
          unreadNotifications: { type: "integer" },
        },
      },
      favoriteSummary: {
        type: "object",
        description: "Value of favorited listings, keyed by purpose",
        additionalProperties: {
          type: "object",
          properties: {
            count: { type: "integer" },
            totalValue: { type: "number" },
            avgPrice: { type: "number" },
            minPrice: { type: "number" },
            maxPrice: { type: "number" },
          },
        },
      },
      recentFavorites: { type: "array", items: { $ref: "#/components/schemas/Favorite" } },
      recentInquiries: { type: "array", items: { $ref: "#/components/schemas/Inquiry" } },
    },
  },

  AgentDashboard: {
    type: "object",
    properties: {
      success: { type: "boolean" },
      role: { type: "string" },
      summary: {
        type: "object",
        properties: {
          totalListings: { type: "integer" },
          activeListings: { type: "integer" },
          totalInquiries: { type: "integer" },
          newInquiries: { type: "integer" },
          mediaAssets: { type: "integer" },
          portfolioValue: {
            type: "number",
            description: "Sum of every listing price owned or assigned to you",
          },
          avgPrice: { type: "number" },
          priceRange: {
            type: "object",
            properties: { min: { type: "number" }, max: { type: "number" } },
          },
          livePortfolioValue: {
            type: "number",
            description: "Sum of prices for listings still active on the market",
          },
        },
      },
      listingsByStatus: { type: "object", additionalProperties: { type: "integer" } },
      listingsByPurpose: {
        type: "object",
        additionalProperties: {
          type: "object",
          properties: {
            count: { type: "integer" },
            avgPrice: { type: "number" },
            totalValue: { type: "number" },
          },
        },
      },
      inquiriesByStatus: { type: "object", additionalProperties: { type: "integer" } },
      recentListings: { type: "array", items: { $ref: "#/components/schemas/Property" } },
      recentInquiries: { type: "array", items: { $ref: "#/components/schemas/Inquiry" } },
      recentPriceChanges: {
        type: "array",
        items: { $ref: "#/components/schemas/PriceHistory" },
      },
    },
  },

  AdminDashboard: {
    type: "object",
    properties: {
      success: { type: "boolean" },
      role: { type: "string", example: "admin" },
      summary: {
        type: "object",
        properties: {
          totalUsers: { type: "integer" },
          usersByRole: { type: "object", additionalProperties: { type: "integer" } },
          verifiedUsers: { type: "integer" },
          unverifiedUsers: { type: "integer" },
          totalProperties: { type: "integer" },
          propertiesByStatus: { type: "object", additionalProperties: { type: "integer" } },
          verifiedProperties: { type: "integer" },
          unverifiedProperties: { type: "integer" },
          totalAgencies: { type: "integer" },
          verifiedAgencies: { type: "integer" },
          unverifiedAgencies: { type: "integer" },
          totalAreas: { type: "integer" },
          totalBuildings: { type: "integer" },
          totalReviews: { type: "integer" },
          totalMessages: { type: "integer" },
          closedDeals: { type: "integer" },
          closedDealValue: { type: "number" },
        },
      },
      verified: { $ref: "#/components/schemas/VerificationQueue" },
      unverified: { $ref: "#/components/schemas/VerificationQueue" },
      recentUsers: { type: "array", items: { $ref: "#/components/schemas/User" } },
      recentProperties: { type: "array", items: { $ref: "#/components/schemas/Property" } },
    },
  },

  VerificationQueue: {
    type: "object",
    description: "Verified and unverified records, with counts and a preview sample",
    properties: {
      users: {
        type: "object",
        properties: {
          count: { type: "integer" },
          sample: { type: "array", items: { $ref: "#/components/schemas/User" } },
        },
      },
      properties: {
        type: "object",
        properties: {
          count: { type: "integer" },
          sample: { type: "array", items: { $ref: "#/components/schemas/Property" } },
        },
      },
      agencies: {
        type: "object",
        properties: {
          count: { type: "integer" },
          sample: { type: "array", items: { $ref: "#/components/schemas/Agency" } },
        },
      },
    },
  },

  BuildingReviews: {
    type: "object",
    properties: {
      success: { type: "boolean" },
      page: { type: "integer" },
      total: { type: "integer" },
      avgRating: { type: "number" },
      reviews: {
        type: "array",
        items: { $ref: "#/components/schemas/Review" },
      },
      distribution: {
        type: "object",
        description: "Review count per star rating",
        properties: {
          1: { type: "integer" },
          2: { type: "integer" },
          3: { type: "integer" },
          4: { type: "integer" },
          5: { type: "integer" },
        },
      },
    },
  },
};

export default schemas;
