import favoriteModel from "../models/favoriteModel.js";
import propertyModel from "../models/propertyModel.js";
import { attachImages } from "../utils/attachImages.js";

// GET /favorites
export const getFavorites = async (req, res) => {
  try {
    const favorites = await favoriteModel
      .find({ userId: req.userId })
      .populate({
        // Every field a listing card renders. This used to select a 9-field
        // subset with no media, so the shortlist had no photos and no specs.
        path: "propertyId",
        select:
          "title description price currency type purpose size beds baths floor " +
          "furnished amenities address location buildingId ownerId agentId " +
          "status verifiedAt availableFrom createdAt updatedAt",
        populate: { path: "buildingId", select: "name" },
      })
      .sort({ createdAt: -1 })
      // Plain objects, so the `images`/`thumbnail` added below survive: assigning
      // them onto a Document would be dropped by Mongoose's strict mode, since
      // neither is a schema path on Favorite or Property.
      .lean();

    // Media lives in its own collection, so the populated properties need the
    // same `images`/`thumbnail` treatment the search endpoint applies. Batched
    // into one query for the whole page rather than one per favourite.
    const populated = favorites
      .map((favorite, index) => ({ favorite, index }))
      .filter(({ favorite }) => favorite.propertyId?._id);
    const withImages = await attachImages(
      populated.map(({ favorite }) => favorite.propertyId),
    );

    populated.forEach(({ favorite, index }, position) => {
      favorites[index].propertyId = withImages[position];
    });

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
