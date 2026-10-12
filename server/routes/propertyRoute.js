import express from "express";
import { requireSignIn, requireRole } from "../utils/authUtils.js";
import {
  addProperty,
  addPropertyMedia,
  createInquiry,
  deleteProperty,
  getPriceHistory,
  getProperties,
  getPropertyById,
  getPropertyReviews,
  getSimilarProperties,
  updateProperty,
} from "../controllers/propertyController.js";

const router = express.Router();

router.get("/", getProperties);
router.get("/:id", getPropertyById);
router.get("/:id/price-history", getPriceHistory);
router.get("/:id/similar", getSimilarProperties);
router.get("/:id/reviews", getPropertyReviews);
router.post("/:id/inquire", requireSignIn, createInquiry);

// Listings are created by agents and landlords
router.post(
  "/",
  requireSignIn,
  requireRole("agent", "landlord", "admin"),
  addProperty,
);
router.patch("/:id", requireSignIn, updateProperty);
router.delete("/:id", requireSignIn, deleteProperty);
router.post("/:id/media", requireSignIn, addPropertyMedia);

export default router;
