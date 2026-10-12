import buildingModel from "../models/buildingModel.js";
import propertyModel from "../models/propertyModel.js";
import reviewModel from "../models/reviewModel.js";
import { errorResponse } from "../utils/errorUtils.js";

// GET /buildings
export const getBuildings = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.name) filter.name = new RegExp(req.query.name, "i");
    if (req.query.developer)
      filter.developer = new RegExp(req.query.developer, "i");

    const [buildings, total] = await Promise.all([
      buildingModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      buildingModel.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      buildings,
    });
  } catch (error) {
    errorResponse(res, error, "Failed to fetch buildings");
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
    errorResponse(res, error, "Failed to fetch building");
  }
};

// POST /buildings
export const addBuilding = async (req, res) => {
  try {
    const { name, developer, yearBuilt, amenities, location } = req.body;

    if (!name || !location?.coordinates) {
      return res.status(400).json({
        success: false,
        message: "name and location.coordinates are required",
      });
    }

    const building = await buildingModel.create({
      name,
      developer,
      yearBuilt,
      amenities,
      location,
    });

    res.status(201).json({ success: true, building });
  } catch (error) {
    errorResponse(res, error, "Failed to create building");
  }
};

// PATCH /buildings/:id
export const updateBuilding = async (req, res) => {
  try {
    const building = await buildingModel.findById(req.params.id);

    if (!building) {
      return res
        .status(404)
        .json({ success: false, message: "Building not found" });
    }

    const { name, developer, yearBuilt, amenities, location } = req.body;

    if (name !== undefined) building.name = name;
    if (developer !== undefined) building.developer = developer;
    if (yearBuilt !== undefined) building.yearBuilt = yearBuilt;
    if (amenities !== undefined) building.amenities = amenities;
    if (location !== undefined) building.location = location;

    await building.save();

    res.status(200).json({ success: true, building });
  } catch (error) {
    errorResponse(res, error, "Failed to update building");
  }
};

// DELETE /buildings/:id
export const deleteBuilding = async (req, res) => {
  try {
    const building = await buildingModel.findById(req.params.id);

    if (!building) {
      return res
        .status(404)
        .json({ success: false, message: "Building not found" });
    }

    // Refuse to orphan listings and reviews that point at this building
    const linkedProperties = await propertyModel.countDocuments({
      buildingId: building._id,
    });

    if (linkedProperties > 0) {
      const noun = linkedProperties === 1 ? "property" : "properties";
      return res.status(409).json({
        success: false,
        message: `Cannot delete: ${linkedProperties} ${noun} still reference this building`,
      });
    }

    await buildingModel.deleteOne({ _id: building._id });

    res.status(200).json({ success: true, message: "Building deleted" });
  } catch (error) {
    errorResponse(res, error, "Failed to delete building");
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
    errorResponse(res, error, "Failed to fetch reviews");
  }
};
