import areaModel from "../models/areaModel.js";
import propertyModel from "../models/propertyModel.js";
import reviewModel from "../models/reviewModel.js";
import { cache } from "../config/redis.js";
import { errorResponse } from "../utils/errorUtils.js";
import { validatePolygon } from "../utils/geoUtils.js";

// GET /areas
export const getAreas = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.city) filter.city = new RegExp(req.query.city, "i");
    if (req.query.name) filter.name = new RegExp(req.query.name, "i");

    const [areas, total] = await Promise.all([
      areaModel
        .find(filter)
        .select("name city boundary")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      areaModel.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      areas,
    });
  } catch (error) {
    errorResponse(res, error, "Failed to fetch areas");
  }
};

// GET /areas/:id
export const getAreaById = async (req, res) => {
  try {
    const area = await areaModel.findById(req.params.id);

    if (!area) {
      return res
        .status(404)
        .json({ success: false, message: "Area not found" });
    }

    res.status(200).json({ success: true, area });
  } catch (error) {
    errorResponse(res, error, "Failed to fetch area");
  }
};

// POST /areas
export const addArea = async (req, res) => {
  try {
    const { name, city, boundary } = req.body;

    if (!name || !city || !boundary?.coordinates) {
      return res.status(400).json({
        success: false,
        message: "name, city and boundary.coordinates are required",
      });
    }

    // MongoDB rejects self-intersecting rings on a 2dsphere index, so the
    // geometry is checked here to return a readable 400.
    const polygon = validatePolygon(boundary);
    if (!polygon.ok) {
      return res.status(400).json({ success: false, message: polygon.message });
    }

    const area = await areaModel.create({
      name,
      city,
      boundary: polygon.value,
    });

    res.status(201).json({ success: true, area });
  } catch (error) {
    errorResponse(res, error, "Failed to create area");
  }
};

// PATCH /areas/:id
export const updateArea = async (req, res) => {
  try {
    const area = await areaModel.findById(req.params.id);

    if (!area) {
      return res
        .status(404)
        .json({ success: false, message: "Area not found" });
    }

    const { name, city, boundary } = req.body;

    if (name !== undefined) area.name = name;
    if (city !== undefined) area.city = city;
    if (boundary !== undefined) {
      const polygon = validatePolygon(boundary);
      if (!polygon.ok) {
        return res
          .status(400)
          .json({ success: false, message: polygon.message });
      }
      area.boundary = polygon.value;
    }

    await area.save();

    // Insights depend on the boundary, so drop the cached aggregate
    await cache.del(`areas:insights:${area._id}`);

    res.status(200).json({ success: true, area });
  } catch (error) {
    errorResponse(res, error, "Failed to update area");
  }
};

// DELETE /areas/:id
export const deleteArea = async (req, res) => {
  try {
    const area = await areaModel.findById(req.params.id);

    if (!area) {
      return res
        .status(404)
        .json({ success: false, message: "Area not found" });
    }

    // Guard against orphaning reviews written against this area
    const reviewCount = await reviewModel.countDocuments({
      targetType: "area",
      targetId: area._id,
    });

    if (reviewCount > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete: ${reviewCount} review${
          reviewCount === 1 ? "" : "s"
        } still reference this area`,
      });
    }

    await areaModel.deleteOne({ _id: area._id });

    await cache.del(`areas:insights:${area._id}`);

    res.status(200).json({ success: true, message: "Area deleted" });
  } catch (error) {
    errorResponse(res, error, "Failed to delete area");
  }
};

// GET /areas/:id/insights — listings, price bands and rent/buy split
export const getAreaInsights = async (req, res) => {
  try {
    const area = await areaModel.findById(req.params.id);

    if (!area) {
      return res
        .status(404)
        .json({ success: false, message: "Area not found" });
    }

    const cacheKey = `areas:insights:${area._id}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.status(200).json({ ...JSON.parse(cached), cached: true });
    }

    const geoFilter = {
      status: "active",
      location: {
        $geoIntersects: {
          $geometry: area.boundary,
        },
      },
    };

    const [total, priceAgg, purposeAgg, typeAgg, bedAgg, reviews] =
      await Promise.all([
        propertyModel.countDocuments(geoFilter),
        propertyModel.aggregate([
          { $match: geoFilter },
          {
            $group: {
              _id: null,
              avgPrice: { $avg: "$price" },
              minPrice: { $min: "$price" },
              maxPrice: { $max: "$price" },
            },
          },
        ]),
        propertyModel.aggregate([
          { $match: geoFilter },
          {
            $group: {
              _id: "$purpose",
              count: { $sum: 1 },
              avgPrice: { $avg: "$price" },
            },
          },
        ]),
        propertyModel.aggregate([
          { $match: geoFilter },
          { $group: { _id: "$type", count: { $sum: 1 } } },
        ]),
        propertyModel.aggregate([
          { $match: geoFilter },
          { $group: { _id: "$beds", count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ]),
        reviewModel.aggregate([
          { $match: { targetType: "area", targetId: area._id } },
          {
            $group: {
              _id: null,
              avgRating: { $avg: "$rating" },
              count: { $sum: 1 },
            },
          },
        ]),
      ]);

    const stats = priceAgg[0] || {};

    // $median is an Atlas-only operator, so derive the median from the sorted
    // price list, which works on any MongoDB deployment.
    const prices = await propertyModel.distinct("price", geoFilter);

    prices.sort((a, b) => a - b);
    const mid = Math.floor(prices.length / 2);
    const median =
      prices.length === 0
        ? 0
        : prices.length % 2
          ? prices[mid]
          : (prices[mid - 1] + prices[mid]) / 2;

    const payload = {
      success: true,
      area: { _id: area._id, name: area.name, city: area.city },
      total,
      priceStats: {
        avgPrice: stats.avgPrice || 0,
        medianPrice: median,
        minPrice: stats.minPrice || 0,
        maxPrice: stats.maxPrice || 0,
      },
      byPurpose: purposeAgg.reduce((acc, row) => {
        acc[row._id] = { count: row.count, avgPrice: row.avgPrice };
        return acc;
      }, {}),
      byType: typeAgg.reduce((acc, row) => {
        acc[row._id] = row.count;
        return acc;
      }, {}),
      byBeds: bedAgg.reduce((acc, row) => {
        acc[row._id === null ? "unknown" : row._id] = row.count;
        return acc;
      }, {}),
      rating: {
        average: reviews[0]?.avgRating || 0,
        count: reviews[0]?.count || 0,
      },
    };

    await cache.set(cacheKey, JSON.stringify(payload), 600);

    res.status(200).json(payload);
  } catch (error) {
    errorResponse(res, error, "Failed to compute insights");
  }
};
