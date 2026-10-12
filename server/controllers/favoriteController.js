import favoriteModel from "../models/favoriteModel.js";
import propertyModel from "../models/propertyModel.js";

// GET /favorites
export const getFavorites = async (req, res) => {
  try {
    const favorites = await favoriteModel
      .find({ userId: req.userId })
      .populate({
        path: "propertyId",
        select:
          "title price currency type purpose beds address location status",
        populate: { path: "buildingId", select: "name" },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, favorites });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch favorites" });
  }
};

// POST /favorites
export const addFavorite = async (req, res) => {
  try {
    const { propertyId } = req.body;

    if (!propertyId) {
      return res
        .status(400)
        .json({ success: false, message: "propertyId is required" });
    }

    const property = await propertyModel.findById(propertyId);

    if (!property) {
      return res
        .status(404)
        .json({ success: false, message: "Property not found" });
    }

    const favorite = await favoriteModel.findOneAndUpdate(
      { userId: req.userId, propertyId },
      { $setOnInsert: { userId: req.userId, propertyId } },
      { new: true, upsert: true },
    );

    res.status(201).json({ success: true, favorite });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to add favorite",
    });
  }
};

// DELETE /favorites
export const removeFavorite = async (req, res) => {
  try {
    const propertyId = req.body?.propertyId || req.params.propertyId;

    if (!propertyId) {
      return res
        .status(400)
        .json({ success: false, message: "propertyId is required" });
    }

    await favoriteModel.deleteOne({ userId: req.userId, propertyId });

    res.status(200).json({ success: true, message: "Removed from favorites" });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to remove favorite",
    });
  }
};
