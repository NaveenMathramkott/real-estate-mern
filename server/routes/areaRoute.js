import express from "express";
import { requireRole } from "../utils/authUtils.js";
import {
  addArea,
  deleteArea,
  getAreaById,
  getAreaInsights,
  getAreas,
  updateArea,
} from "../controllers/areaController.js";

const router = express.Router();

// Areas are reference data, so writes are restricted to admins.
// requireRole authenticates on its own, so requireSignIn is not repeated here.
const adminOnly = requireRole("admin");

router.get("/", getAreas);
router.get("/:id", getAreaById);
router.get("/:id/insights", getAreaInsights);

router.post("/", adminOnly, addArea);
router.patch("/:id", adminOnly, updateArea);
router.delete("/:id", adminOnly, deleteArea);

export default router;
