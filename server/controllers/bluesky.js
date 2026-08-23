import { BskyAgent } from "@atproto/api";
import User from "../models/User.js";
import { encrypt } from "../utils/encryption.js";
import { getBlueskyStats } from "../mcp.tool.js"; // updated: existing analytics logic reuse karta hai

/**
 * @name connectBluesky
 * @description Connect the logged-in user's Bluesky account
 * @route POST /api/bluesky/connect
 * @access Private
 */
export async function connectBluesky(req, res) {
    try {
        const { handle, appPassword } = req.body;

        // updated: check required Bluesky credentials
        if (!handle || !appPassword) {
            return res.status(400).json({
                message: "Bluesky handle and app password are required",
            });
        }

        // updated: create a temporary Bluesky agent to verify credentials
        const agent = new BskyAgent({
            service: "https://bsky.social",
        });

        // updated: verify the provided Bluesky credentials
        await agent.login({
            identifier: handle,
            password: appPassword,
        });

        // updated: encrypt the app password before storing it
        const encryptedPassword = encrypt(appPassword);

        // updated: save the verified Bluesky account to the logged-in user
        await User.findByIdAndUpdate(req.user._id, {
            bluesky: {
                handle,
                appPassword: encryptedPassword,
                connected: true,
            },
        });

        res.status(200).json({
            message: "Bluesky account connected successfully",
            bluesky: {
                handle,
                connected: true,
            },
        });
    } catch (error) {
        // updated: return a clear error when Bluesky credentials are invalid
        res.status(400).json({
            message: "Failed to connect Bluesky account",
            error: error.message,
        });
    }
}

/**
 * @name getBlueskyStatsController
 * @description Get analytics for the logged-in user's Bluesky account
 * @route GET /api/bluesky/stats?days=30
 * @access Private
 */
export async function getBlueskyStatsController(req, res) {
    try {
        const days = Number(req.query.days) || 30;

        // updated: allow only supported analytics periods
        if (![7, 30, 90].includes(days)) {
            return res.status(400).json({
                message: "Days must be 7, 30 or 90",
            });
        }

        // updated: reuse the existing multi-user Bluesky stats function
        const stats = await getBlueskyStats(
            req.user._id.toString(),
            days
        );

        res.status(200).json(stats);
    } catch (error) {
        console.error("Bluesky stats API error:", error.message);
        
            if (error.message === "Bluesky account is not connected") {
                return res.status(400).json({
                    code: "BLUESKY_NOT_CONNECTED",
                    message: "Bluesky account is not connected",
                });
            }

        res.status(500).json({
            message: "Failed to fetch Bluesky analytics",
            error: error.message,
        });
    }
}