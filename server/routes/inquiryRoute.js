import express from "express";
import { requireSignIn, requireRole } from "../utils/authUtils.js";
import {
  getInquiries,
  updateInquiryStatus,
} from "../controllers/inquiryController.js";

const router = express.Router();

router.use(requireSignIn);

router.get("/", requireRole("agent", "landlord", "admin"), getInquiries);
router.patch(
  "/:id/status",
  requireRole("agent", "landlord", "admin"),
  updateInquiryStatus,
);

export default router;
