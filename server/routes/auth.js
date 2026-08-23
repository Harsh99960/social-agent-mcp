import express from "express";
import { registerUser, loginUser, getCurrentUser } from "../controllers/auth.js"; // updated: current user controller add kiya
import { protect } from "../middleware/auth.js"; // updated: protected route ke liye JWT middleware

const router = express.Router();

/**
 * @name registerUser
 * @description Create a new user account
 * @route POST /api/auth/register
 * @access Public
 */
router.post("/register", registerUser);

/**
 * @name loginUser
 * @description Login an existing user
 * @route POST /api/auth/login
 * @access Public
 */
router.post("/login", loginUser);

/**
 * @name getCurrentUser
 * @description Get the currently logged-in user
 * @route GET /api/auth/me
 * @access Private
 */
router.get("/me", protect, getCurrentUser); // updated: only authenticated users can access this route

export default router;