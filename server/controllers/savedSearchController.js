import savedSearchModel from "../models/savedSearchModel.js";
import { errorResponse } from "../utils/errorUtils.js";
import propertyModel from "../models/propertyModel.js";
import { buildPropertyFilter } from "../controllers/propertyController.js";
import { cache } from "../config/redis.js";

// GET /saved-searches
export const getSavedSearches = async (req, res) => {
  try {
    const savedSearches = await savedSearchModel
      .find({ userId: req.userId })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, savedSearches });
  } catch (error) {
    console.log(error);
    errorResponse(res, error, "Failed to fetch saved searches");
  }
};

// POST /saved-searches
export const addSavedSearch = async (req, res) => {
  try {
    const { filters, alertFrequency } = req.body;

    if (!filters || typeof filters !== "object") {
      return res
        .status(400)
        .json({ success: false, message: "filters object is required" });
    }

    // Reject filters the search layer cannot execute
    buildPropertyFilter(filters);

    const savedSearch = await savedSearchModel.create({
      userId: req.userId,
      filters,
      alertFrequency,
    });

    res.status(201).json({ success: true, savedSearch });
  } catch (error) {
    console.log(error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to save search",
    });
  }
};

// DELETE /saved-searches/:id
export const deleteSavedSearch = async (req, res) => {
  try {
    const savedSearch = await savedSearchModel.findById(req.params.id);

    if (!savedSearch) {
      return res
        .status(404)
        .json({ success: false, message: "Saved search not found" });
    }

    if (savedSearch.userId.toString() !== req.userId) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    await savedSearchModel.deleteOne({ _id: savedSearch._id });

    res.status(200).json({ success: true, message: "Saved search deleted" });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete saved search" });
  }
};

// GET /saved-searches/:id/results — preview what a saved search currently returns
export const getSavedSearchResults = async (req, res) => {
  try {
    const savedSearch = await savedSearchModel.findById(req.params.id);

    if (!savedSearch) {
      return res
        .status(404)
        .json({ success: false, message: "Saved search not found" });
    }

    if (savedSearch.userId.toString() !== req.userId) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    const filter = buildPropertyFilter(savedSearch.filters);
    const properties = await propertyModel.find(filter).limit(50);

    savedSearch.lastRunAt = new Date();
    await savedSearch.save();

    res
      .status(200)
      .json({ success: true, total: properties.length, properties });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to run search",
    });
  }
};
