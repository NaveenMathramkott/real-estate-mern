import express from "express";
import { requireRole, requireSignIn } from "../utils/authUtils.js";
import {
  addAgency,
  deleteAgency,
  getAgencyById,
  getAgencies,
  updateAgency,
} from "../controllers/agencyController.js";

const router = express.Router();

router.get("/", getAgencies);
router.get("/:id", getAgencyById);

router.post("/", requireSignIn, requireRole("admin"), addAgency);
router.patch("/:id", requireSignIn, requireRole("admin"), updateAgency);
router.delete("/:id", requireSignIn, requireRole("admin"), deleteAgency);

export default router;
