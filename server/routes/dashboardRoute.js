import express from "express";
import { requireRole, requireSignIn } from "../utils/authUtils.js";
import {
  getAdminDashboard,
  getAgentDashboard,
  getBuyerDashboard,
  setAgencyVerification,
  setPropertyVerification,
  setUserVerification,
} from "../controllers/dashboardController.js";

const router = express.Router();

// Every dashboard requires a session; requireRole authenticates on its own
router.use(requireSignIn);

// Buyer and renter see the same personal-activity view
router.get("/buyer", requireRole("buyer", "renter"), getBuyerDashboard);

// Agent and landlord see listing performance and leads
router.get("/agent", requireRole("agent", "landlord"), getAgentDashboard);

// Admin sees platform-wide totals plus verified/unverified queues
router.get("/admin", requireRole("admin"), getAdminDashboard);

// Verification toggles — admin only
router.patch(
  "/admin/users/:userId/verify",
  requireRole("admin"),
  setUserVerification,
);
router.patch(
  "/admin/properties/:propertyId/verify",
  requireRole("admin"),
  setPropertyVerification,
);
router.patch(
  "/admin/agencies/:agencyId/verify",
  requireRole("admin"),
  setAgencyVerification,
);

// Unified entry point that routes to the correct dashboard by role
const dashboardsByRole = {
  buyer: getBuyerDashboard,
  renter: getBuyerDashboard,
  agent: getAgentDashboard,
  landlord: getAgentDashboard,
  admin: getAdminDashboard,
};

router.get("/", (req, res, next) => {
  const handler = dashboardsByRole[req.userRole];

  if (!handler) {
    return res
      .status(403)
      .json({ success: false, message: "No dashboard for this role" });
  }

  handler(req, res, next);
});

export default router;
