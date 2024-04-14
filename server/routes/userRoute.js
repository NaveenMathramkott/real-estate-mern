import express from "express";
import { verifyToken } from "../utils/authUtils.js";
import {
  deleteUser,
  getUsers,
  updateUser,
} from "../controllers/userController.js";
const router = express.Router();

router.get("/", getUsers);
router.put("/:id", verifyToken, updateUser);
router.delete("/:id", verifyToken, deleteUser);
// router.post("/save", verifyToken, savePost);
// router.get("/profilePosts", verifyToken, profilePosts);
// router.get("/notification", verifyToken, getNotificationNumber);

export default router;