// Authorization: Bearer <JWT>
//               ↓
//          verify token
//               ↓
//         find user in DB
//               ↓
//         req.user = user
//               ↓
//          next() 
import jwt from "jsonwebtoken";
import User from "../models/user.js";

/**
 * @name protect
 * @description Verify JWT token and attach the logged-in user to the request
 * @route Used on protected routes
 * @access Private
 */
export async function protect(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        // updated: check if Authorization header contains a token
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Authentication required",
            });
        }

        // updated: remove Bearer and clean accidental quotes/spaces
        const token = authHeader
            .slice(7)
            .trim()
            .replace(/^"|"$/g, "");

        // updated: verify token using the server secret
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // updated: find the user connected to the token
        const user = await User.findById(decoded.userId).select("-password");

        if (!user) {
            return res.status(401).json({
                message: "User not found",
            });
        }

        req.user = user; // updated: make logged-in user available to protected routes

        next();
    } catch (error) {
        console.log("JWT ERROR:", error.name, error.message); // updated: shows the exact JWT error

        return res.status(401).json({
            message: "Invalid or expired token",
        });
    }
}