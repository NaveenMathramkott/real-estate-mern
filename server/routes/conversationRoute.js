import express from "express";
import { requireSignIn } from "../utils/authUtils.js";
import {
  createConversation,
  getConversation,
  getConversations,
  getMessages,
  markConversationRead,
  sendMessage,
} from "../controllers/conversationController.js";

const router = express.Router();

router.use(requireSignIn);

router.get("/", getConversations);
router.post("/", createConversation);
router.get("/:id", getConversation);
router.get("/:id/messages", getMessages);
router.post("/:id/messages", sendMessage);
router.post("/:id/read", markConversationRead);

export default router;
