import express from "express";
import {
  getAreaById,
  getAreaInsights,
  getAreas,
  getBuildingById,
  getBuildingReviews,
} from "../controllers/areaController.js";

const router = express.Router();

router.get("/", getAreas);
router.get("/:id", getAreaById);
router.get("/:id/insights", getAreaInsights);

export default router;

// Separate router for buildings so /areas/:id never shadows /buildings/:id
export const buildingRouter = express.Router();

buildingRouter.get("/:id", getBuildingById);
buildingRouter.get("/:id/reviews", getBuildingReviews);
