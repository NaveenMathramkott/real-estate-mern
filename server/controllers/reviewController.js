import reviewModel from "../models/reviewModel.js";
import areaModel from "../models/areaModel.js";
import buildingModel from "../models/buildingModel.js";
import userModel from "../models/userModel.js";

// Validates that the review target actually exists before writing the review
const resolveTarget = async (targetType, targetId) => {
  switch (targetType) {
    case "building":
      return buildingModel.exists({ _id: targetId });
    case "area":
      return areaModel.exists({ _id: targetId });
    case "agent":
      return userModel.exists({
        _id: targetId,
        role: { $in: ["agent", "landlord"] },
      });
    default:
      return false;
  }
};

// POST /reviews
export const addReview = async (req, res) => {
  try {
    const { targetType, targetId, rating, body } = req.body;

    if (!targetType || !targetId || rating === undefined) {
      return res.status(400).json({
        success: false,
        message: "targetType, targetId and rating are required",
      });
    }

    const numericRating = Number(rating);

    if (numericRating < 1 || numericRating > 5) {
      return res
        .status(400)
        .json({ success: false, message: "rating must be between 1 and 5" });
    }

    if (
      targetType === "agent" &&
      targetId.toString() === req.userId.toString()
    ) {
      return res
        .status(400)
        .json({ success: false, message: "You cannot review yourself" });
    }

    const targetExists = await resolveTarget(targetType, targetId);

    if (!targetExists) {
      return res
        .status(404)
        .json({ success: false, message: "Review target not found" });
    }

    // Upsert so a user edits their existing review rather than duplicating it
    const review = await reviewModel.findOneAndUpdate(
      { targetType, targetId, userId: req.userId },
      { $set: { rating: numericRating, body } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    res.status(201).json({ success: true, review });
  } catch (error) {
    console.log(error);
    res.status(error.name === "ValidationError" ? 400 : 500).json({
      success: false,
      message: error.message || "Failed to create review",
    });
  }
};

// GET /reviews — reviews written by the signed-in user
export const getMyReviews = async (req, res) => {
  try {
    const reviews = await reviewModel
      .find({ userId: req.userId })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, reviews });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch reviews" });
  }
};
