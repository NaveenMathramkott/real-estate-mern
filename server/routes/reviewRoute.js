import express from "express";
import { requireSignIn } from "../utils/authUtils.js";
import { addReview, getMyReviews } from "../controllers/reviewController.js";

const router = express.Router();

router.use(requireSignIn);

router.get("/", getMyReviews);
router.post("/", addReview);

export default router;
