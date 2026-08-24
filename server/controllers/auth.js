import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.js";

/**
 * @name registerUser
 * @description Create a new user account
 * @route POST /api/auth/register
 * @access Public
 */
export async function registerUser(req, res) {
    try {
        const { username, email, password } = req.body;

        // Check required registration fields
        if (!username || !email || !password) {
            return res.status(400).json({
                message: "Username, email and password are required",
            });
        }

        // Prevent duplicate username or email
        const existingUser = await User.findOne({
            $or: [{ username }, { email }],
        });

        if (existingUser) {
            return res.status(409).json({
                message: "Username or email already exists",
            });
        }

        // Hash password before saving it
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            username,
            email,
            password: hashedPassword,
        });

        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
            },
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to register user",
            error: error.message,
        });
    }
}

/**
 * @name loginUser
 * @description Login user and return an authentication token
 * @route POST /api/auth/login
 * @access Public
 */
export async function loginUser(req, res) {
    try {
        const { email, password } = req.body;

        // Check required login fields
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required",
            });
        }

        // Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        // Compare entered password with hashed password
        const isPasswordValid = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        // Create JWT for authenticated user
        const token = jwt.sign(
            {
                userId: user._id,
                username: user.username,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d",
            }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
            },
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to login",
            error: error.message,
        });
    }
}

/**
 * @name getCurrentUser
 * @description Get the currently logged-in user
 * @route GET /api/auth/me
 * @access Private
 */
export async function getCurrentUser(req, res) {
    // req.user is added by the protect middleware
    res.status(200).json({
        user: {
            id: req.user._id,
            username: req.user.username,
            email: req.user.email,

            // Tells frontend whether a Bluesky account is connected
            bluesky: {
                connected: Boolean(
                    req.user.bluesky?.connected &&
                    req.user.bluesky?.handle
                ),
                handle: req.user.bluesky?.handle || null,
            },
        },
    });
}