import express from "express";
import rateLimit from "express-rate-limit";
import { requireSignIn } from "../utils/authUtils.js";
import {
  login,
  logout,
  me,
  refresh,
  register,
  requestOtp,
  verifyOtp,
} from "../controllers/authController.js";

const router = express.Router();

// Brute-force protection on the credential and OTP endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts, try again later" },
});

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.post("/otp", authLimiter, requestOtp);
router.post("/otp/verify", authLimiter, verifyOtp);
router.get("/me", requireSignIn, me);

export default router;
