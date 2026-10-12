import express from "express";
import { requireSignIn } from "../utils/authUtils.js";
import {
  addSavedSearch,
  deleteSavedSearch,
  getSavedSearches,
  getSavedSearchResults,
} from "../controllers/savedSearchController.js";

const router = express.Router();

router.use(requireSignIn);

router.get("/", getSavedSearches);
router.post("/", addSavedSearch);
router.delete("/:id", deleteSavedSearch);
router.get("/:id/results", getSavedSearchResults);

export default router;
