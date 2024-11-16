import express from "express";
import { verifyToken } from "../utils/authUtils.js";
import { addMessage } from "../controllers/messageController.js";

const router = express.Router();

router.post("/:chatId", verifyToken, addMessage);

export default router;
