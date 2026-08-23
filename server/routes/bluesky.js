import express from "express";
import {
    connectBluesky,
    getBlueskyStatsController,
} from "../controllers/bluesky.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

/**
 * @name connectBluesky
 * @description Connect the logged-in user's Bluesky account
 * @route POST /api/bluesky/connect
 * @access Private
 */
router.post("/connect", protect, connectBluesky);

/**
 * @name getBlueskyStatsController
 * @description Get analytics for the logged-in user's Bluesky account
 * @route GET /api/bluesky/stats?days=30
 * @access Private
 */
router.get("/stats", protect, getBlueskyStatsController); // updated: dashboard analytics API

export default router;