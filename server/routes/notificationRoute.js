import express from "express";
import { requireSignIn } from "../utils/authUtils.js";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../controllers/notificationController.js";

const router = express.Router();

router.use(requireSignIn);

router.get("/", getNotifications);
router.patch("/read-all", markAllNotificationsRead);
router.patch("/:id/read", markNotificationRead);

export default router;
