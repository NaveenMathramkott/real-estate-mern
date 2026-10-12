import express from "express";
import { requireRole } from "../utils/authUtils.js";
import {
  addBuilding,
  deleteBuilding,
  getBuildingById,
  getBuildingReviews,
  getBuildings,
  updateBuilding,
} from "../controllers/buildingController.js";

const router = express.Router();

// Buildings are reference data, so writes are restricted to admins.
// requireRole authenticates on its own, so requireSignIn is not repeated here.
const adminOnly = requireRole("admin");

router.get("/", getBuildings);
router.get("/:id", getBuildingById);
router.get("/:id/reviews", getBuildingReviews);

router.post("/", adminOnly, addBuilding);
router.patch("/:id", adminOnly, updateBuilding);
router.delete("/:id", adminOnly, deleteBuilding);

export default router;
