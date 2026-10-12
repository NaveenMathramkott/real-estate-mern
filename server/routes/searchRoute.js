import express from "express";
import rateLimit from "express-rate-limit";
import {
  searchCommute,
  searchPolygon,
  suggest,
} from "../controllers/searchController.js";

const router = express.Router();

// Search endpoints are expensive geospatial aggregations — throttle them
const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many search requests" },
});

router.get("/suggest", searchLimiter, suggest);
router.post("/polygon", searchLimiter, searchPolygon);
router.post("/commute", searchLimiter, searchCommute);

export default router;
