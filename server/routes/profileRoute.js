import express from "express";
import { requireSignIn } from "../utils/authUtils.js";
import {
  getMyProfile,
  getProfileByUser,
  updateMyPreferences,
  updateMyProfile,
} from "../controllers/agencyController.js";

const router = express.Router();

// Everything below requires a session
router.use(requireSignIn);

router.get("/me", getMyProfile);
router.patch("/me", updateMyProfile);

// Convenience alias for updating locale/currency on the user record
router.patch("/me/preferences", updateMyPreferences);

router.get("/:userId", getProfileByUser);

export default router;
