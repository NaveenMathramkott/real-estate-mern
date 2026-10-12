import propertyModel from "../models/propertyModel.js";
import { errorResponse } from "../utils/errorUtils.js";
import propertyMediaModel from "../models/propertyMediaModel.js";
import priceHistoryModel from "../models/priceHistoryModel.js";
import inquiryModel from "../models/inquiryModel.js";
import reviewModel from "../models/reviewModel.js";
import { cache } from "../config/redis.js";
import { uploadMedia } from "../config/cloudinary.js";

// Turns the query string into a Mongo filter object
export const buildPropertyFilter = (query) => {
  const filter = { status: "active" };

  if (query.purpose) filter.purpose = query.purpose;
  if (query.type) filter.type = { $in: String(query.type).split(",") };
  if (query.city) filter.address = new RegExp(query.city, "i");

  if (query.beds) filter.beds = { $gte: Number(query.beds) };
  if (query.priceMin || query.priceMax) {
    filter.price = {};
    if (query.priceMin) filter.price.$gte = Number(query.priceMin);
    if (query.priceMax) filter.price.$lte = Number(query.priceMax);
  }

  if (query.furnished)
    filter.furnished = { $in: String(query.furnished).split(",") };
  if (query.amenities) {
    filter.amenities = { $all: String(query.amenities).split(",") };
  }

  // Draw-area search: polygon=[[[lng,lat],...]]
  if (query.polygon) {
    try {
      const coordinates = JSON.parse(query.polygon);
      if (!Array.isArray(coordinates) || coordinates.length < 3) {
        throw new Error("A polygon needs at least 3 points");
      }
      filter.location = {
        $geoIntersects: {
          $geometry: { type: "Polygon", coordinates: [coordinates] },
        },
      };
    } catch (error) {
      const err = new Error(`Invalid polygon: ${error.message}`);
      err.statusCode = 400;
      throw err;
    }
  }

  // Radius search: lat, lng, radius in metres
  if (query.lat && query.lng && query.radius) {
    filter.location = {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [Number(query.lng), Number(query.lat)],
        },
        $maxDistance: Number(query.radius),
      },
    };
  }

  if (query.q) {
    filter.$text = { $search: query.q };
  }

  return filter;
};

// GET /properties
export const getProperties = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const filter = buildPropertyFilter(req.query);

    // $near results are already ordered by distance; text search by relevance
    let sort = { createdAt: -1 };
    if (filter.$text) sort = { score: { $meta: "textScore" } };

    // $near is not permitted in aggregation context, so build a count-safe
    // variant using $geoWithin with the same centre and radius.
    let countFilter = filter;
    if (filter.location?.$near) {
      const { $geometry, $maxDistance } = filter.location.$near;
      countFilter = {
        ...filter,
        location: {
          $geoWithin: {
            $centerSphere: [$geometry.coordinates, $maxDistance / 6378100],
          },
        },
      };
    }

    const [properties, total] = await Promise.all([
      propertyModel
        .find(filter)
        .populate("ownerId", "email phone role")
        .populate("agentId", "email phone role")
        .sort(sort)
        .skip(skip)
        .limit(limit),
      propertyModel.countDocuments(countFilter),
    ]);

    res.status(200).json({
      success: true,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      properties,
    });
  } catch (error) {
    console.log(error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch properties",
    });
  }
};

// GET /properties/:id
export const getPropertyById = async (req, res) => {
  try {
    const property = await propertyModel
      .findById(req.params.id)
      .populate("ownerId", "email phone role")
      .populate("agentId", "email phone role")
      .populate("buildingId");

    if (!property) {
      return res
        .status(404)
        .json({ success: false, message: "Property not found" });
    }

    const media = await propertyMediaModel
      .find({ propertyId: property._id })
      .sort({ order: 1 });

    res.status(200).json({ success: true, property, media });
  } catch (error) {
    console.log(error);
    errorResponse(res, error, "Failed to fetch property");
  }
};

// POST /properties
export const addProperty = async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      purpose,
      price,
      currency,
      size,
      beds,
      baths,
      floor,
      furnished,
      amenities,
      location,
      address,
      buildingId,
      availableFrom,
      status,
    } = req.body;

    const newProperty = await propertyModel.create({
      title,
      description,
      type,
      purpose,
      price,
      currency,
      size,
      beds,
      baths,
      floor,
      furnished,
      amenities,
      location,
      address,
      buildingId,
      availableFrom,
      status: status || "active",
      ownerId: req.userId,
      agentId: ["agent", "landlord", "admin"].includes(req.userRole)
        ? req.userId
        : undefined,
    });

    res.status(201).json({ success: true, property: newProperty });
  } catch (error) {
    console.log(error);
    res.status(error.name === "ValidationError" ? 400 : 500).json({
      success: false,
      message: error.message || "Failed to create property",
    });
  }
};

// PATCH /properties/:id
export const updateProperty = async (req, res) => {
  try {
    const property = await propertyModel.findById(req.params.id);

    if (!property) {
      return res
        .status(404)
        .json({ success: false, message: "Property not found" });
    }

    const canEdit =
      property.ownerId.toString() === req.userId ||
      property.agentId?.toString() === req.userId ||
      req.userRole === "admin";

    if (!canEdit) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    const { price, ...rest } = req.body;

    // Record the previous price before overwriting it
    if (price !== undefined && Number(price) !== property.price) {
      await priceHistoryModel.create({
        propertyId: property._id,
        oldPrice: property.price,
        newPrice: Number(price),
      });
    }

    Object.assign(property, rest);
    if (price !== undefined) property.price = Number(price);

    await property.save();

    res.status(200).json({ success: true, property });
  } catch (error) {
    console.log(error);
    res.status(error.name === "ValidationError" ? 400 : 500).json({
      success: false,
      message: error.message || "Failed to update property",
    });
  }
};

// POST /properties/:id/media
export const addPropertyMedia = async (req, res) => {
  try {
    const property = await propertyModel.findById(req.params.id);

    if (!property) {
      return res
        .status(404)
        .json({ success: false, message: "Property not found" });
    }

    const canEdit =
      property.ownerId.toString() === req.userId ||
      property.agentId?.toString() === req.userId ||
      req.userRole === "admin";

    if (!canEdit) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    // Multipart uploads land in req.file; a plain URL may be posted instead
    const type = req.body.type || "image";
    let url = req.body.url;
    let publicId;

    if (req.file) {
      const uploaded = await uploadMedia(req.file.buffer, "property-media");
      url = uploaded.url;
      publicId = uploaded.publicId;
    }

    if (!url) {
      return res
        .status(400)
        .json({ success: false, message: "A file or url is required" });
    }

    const media = await propertyMediaModel.create({
      propertyId: property._id,
      type,
      url,
      publicId,
      blurhash: req.body.blurhash,
      order: Number(req.body.order) || 0,
    });

    res.status(201).json({ success: true, media });
  } catch (error) {
    console.log(error);
    errorResponse(res, error, "Failed to add media");
  }
};

// GET /properties/:id/price-history
export const getPriceHistory = async (req, res) => {
  try {
    const history = await priceHistoryModel
      .find({ propertyId: req.params.id })
      .sort({ changedAt: -1 });

    res.status(200).json({ success: true, history });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch price history" });
  }
};

// GET /properties/:id/similar
export const getSimilarProperties = async (req, res) => {
  try {
    const property = await propertyModel.findById(req.params.id);

    if (!property) {
      return res
        .status(404)
        .json({ success: false, message: "Property not found" });
    }

    const limit = Math.min(Number(req.query.limit) || 6, 24);

    const similar = await propertyModel
      .find({
        _id: { $ne: property._id },
        status: "active",
        purpose: property.purpose,
        type: property.type,
        price: {
          $gte: property.price * 0.8,
          $lte: property.price * 1.2,
        },
        beds: { $gte: (property.beds || 0) - 1 },
        location: {
          $near: {
            $geometry: property.location,
            $maxDistance: 5000,
          },
        },
      })
      .limit(limit);

    res.status(200).json({ success: true, properties: similar });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch similar properties" });
  }
};

// POST /properties/:id/inquire
export const createInquiry = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res
        .status(400)
        .json({ success: false, message: "Message is required" });
    }

    const property = await propertyModel.findById(req.params.id);

    if (!property) {
      return res
        .status(404)
        .json({ success: false, message: "Property not found" });
    }

    // Route the inquiry to the agent when present, otherwise to the owner
    const agentId = property.agentId || property.ownerId;

    const inquiry = await inquiryModel.create({
      propertyId: property._id,
      userId: req.userId,
      agentId,
      message,
    });

    res.status(201).json({ success: true, inquiry });
  } catch (error) {
    console.log(error);
    errorResponse(res, error, "Failed to create inquiry");
  }
};

// GET /properties/:id/reviews
export const getPropertyReviews = async (req, res) => {
  try {
    const property = await propertyModel.findById(req.params.id);

    if (!property) {
      return res
        .status(404)
        .json({ success: false, message: "Property not found" });
    }

    if (!property.buildingId) {
      return res
        .status(200)
        .json({ success: true, reviews: [], avgRating: 0, count: 0 });
    }

    const [reviews, agg] = await Promise.all([
      reviewModel
        .find({ targetType: "building", targetId: property.buildingId })
        .populate("userId", "email avatar")
        .sort({ createdAt: -1 }),
      reviewModel.aggregate([
        { $match: { targetType: "building", targetId: property.buildingId } },
        { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      reviews,
      avgRating: agg[0]?.avg || 0,
      count: agg[0]?.count || 0,
    });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch reviews" });
  }
};

// DELETE /properties/:id — soft delete by marking the listing inactive
export const deleteProperty = async (req, res) => {
  try {
    const property = await propertyModel.findById(req.params.id);

    if (!property) {
      return res
        .status(404)
        .json({ success: false, message: "Property not found" });
    }

    const canEdit =
      property.ownerId.toString() === req.userId ||
      property.agentId?.toString() === req.userId ||
      req.userRole === "admin";

    if (!canEdit) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    property.status = "expired";
    await property.save();

    await cache.del(`properties:similar:${property._id}`);

    res.status(200).json({ success: true, message: "Property removed" });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete property" });
  }
};
