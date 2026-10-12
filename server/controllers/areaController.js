import areaModel from "../models/areaModel.js";
import { errorResponse } from "../utils/errorUtils.js";
import buildingModel from "../models/buildingModel.js";
import propertyModel from "../models/propertyModel.js";
import reviewModel from "../models/reviewModel.js";
import { cache } from "../config/redis.js";

// GET /areas — browsable list of known localities
export const getAreas = async (req, res) => {
  try {
    const filter = req.query.city
      ? { city: new RegExp(req.query.city, "i") }
      : {};
    const areas = await areaModel.find(filter).select("name city boundary");
    res.status(200).json({ success: true, areas });
  } catch (error) {
    console.log(error);
    errorResponse(res, error, "Failed to fetch areas");
  }
};

// GET /areas/:id — boundary plus aggregate market stats for the area
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
    console.log(error);
    res.status(500).json({ success: false, message: "Failed to fetch area" });
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
    const medianPrice = await propertyModel.distinct("price", geoFilter);

    medianPrice.sort((a, b) => a - b);
    const mid = Math.floor(medianPrice.length / 2);
    const median =
      medianPrice.length === 0
        ? 0
        : medianPrice.length % 2
          ? medianPrice[mid]
          : (medianPrice[mid - 1] + medianPrice[mid]) / 2;

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
    console.log(error);
    res
      .status(500)
      .json({
        success: false,
        message: error.message || "Failed to compute insights",
      });
  }
};

// GET /buildings/:id
export const getBuildingById = async (req, res) => {
  try {
    const building = await buildingModel.findById(req.params.id);

    if (!building) {
      return res
        .status(404)
        .json({ success: false, message: "Building not found" });
    }

    const properties = await propertyModel
      .find({ buildingId: building._id, status: "active" })
      .select("title price currency type purpose beds address");

    res.status(200).json({ success: true, building, properties });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch building" });
  }
};

// GET /buildings/:id/reviews — paginated reviews with a rating breakdown
export const getBuildingReviews = async (req, res) => {
  try {
    const building = await buildingModel.findById(req.params.id);

    if (!building) {
      return res
        .status(404)
        .json({ success: false, message: "Building not found" });
    }

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const match = { targetType: "building", targetId: building._id };

    const [reviews, agg, breakdown] = await Promise.all([
      reviewModel
        .find(match)
        .populate("userId", "email avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      reviewModel.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            avgRating: { $avg: "$rating" },
            count: { $sum: 1 },
          },
        },
      ]),
      reviewModel.aggregate([
        { $match: match },
        { $group: { _id: "$rating", count: { $sum: 1 } } },
      ]),
    ]);

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    breakdown.forEach((row) => {
      distribution[row._id] = row.count;
    });

    res.status(200).json({
      success: true,
      reviews,
      page,
      total: agg[0]?.count || 0,
      avgRating: agg[0]?.avgRating || 0,
      distribution,
    });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({
        success: false,
        message: error.message || "Failed to fetch reviews",
      });
  }
};
