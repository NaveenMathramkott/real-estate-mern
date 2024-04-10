import express from "express";
import {
  checkAdmin,
  login,
  logout,
  register,
} from "../controllers/authController.js";
import { verifyToken } from "../utils/authUtils.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/checkAdmin", checkAdmin);
router.get("/checkLoggedIn", verifyToken, async (req, res) =>
  res.status(200).json({ message: "You are Authenticated" })
);

export default router;
