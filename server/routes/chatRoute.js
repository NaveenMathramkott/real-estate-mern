import express from "express";
import { verifyToken } from "../utils/authUtils.js";

const router = express.Router();

// router.get("/", verifyToken, getChats);
// router.get("/:id", verifyToken, getChat);
// router.post("/", verifyToken, addChat);
// router.put("/read/:id", verifyToken, readChat);

export default router;
