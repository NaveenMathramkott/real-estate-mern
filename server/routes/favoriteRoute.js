import express from "express";
import { requireSignIn } from "../utils/authUtils.js";
import {
  addFavorite,
  getFavorites,
  removeFavorite,
} from "../controllers/favoriteController.js";

const router = express.Router();

router.use(requireSignIn);

router.get("/", getFavorites);
router.post("/", addFavorite);
router.delete("/", removeFavorite);
router.delete("/:propertyId", removeFavorite);

export default router;
