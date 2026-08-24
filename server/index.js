import express from "express";
import mongoose from "mongoose"; // updated: MongoDB connection ke liye
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import {
    createBlueskyPost,
    getMyPosts,
    getPostThread,
    createReply,
    getBlueskyStats, // updated: Bluesky analytics tool add kiya
} from "./mcp.tool.js";
import cors from "cors";
import { connectMCP, chat, resetChat } from "../client/index.js"; // updated: backend chat memory ke liye
import authRoutes from "./routes/auth.js"; // updated: authentication routes add karta hai
import blueskyRoutes from "./routes/bluesky.js"; // updated: Bluesky account routes add karta hai
import { protect } from "./middleware/auth.js"; // updated: authenticated user identify karta hai
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

const app = express();
app.use(cors());

let dbPromise;

async function connectDB() {
    if (mongoose.connection.readyState === 1) {
        return;
    }

    if (!dbPromise) {
        dbPromise = mongoose.connect(process.env.MONGO_URI);
    }

    await dbPromise;
}

app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        res.status(500).json({
            message: "Database connection failed",
        });
    }
});



/**
 * Authentication API
 * JSON parser is applied only to API routes.
 * MCP message routes must keep their original request stream.
 */
app.use("/api/auth", express.json(), authRoutes);

// updated: Bluesky routes connect karta hai
// updated: JSON parser is required for Bluesky credentials
app.use("/api/bluesky", express.json(), blueskyRoutes);

/**
 * Create a new MCP server instance.
 * Each SSE connection gets its own MCP server instance.
 * This prevents "Already connected to a transport" errors.
 *
 * @param {string} userId Authenticated user's MongoDB ID
 */
function createMCPServer(userId) {
    const server = new McpServer({
        name: "example-server",
        version: "1.0.0",
    });

    server.tool(
        "addTwoNumbers",
        "Add two numbers",
        {
            a: z.number(),
            b: z.number(),
        },
        async ({ a, b }) => {
            try {
                return {
                    type: "text",
                    text: `The sum of ${a} and ${b} is ${a + b}`,
                };
            } catch (error) {
                return {
                    type: "text",
                    text: `Failed to add numbers: ${error.message}`,
                };
            }
        }
    );

    server.tool(
        "createBlueskyPost",
        "Create a post on Bluesky",
        {
            text: z.string(),
            userId: z.string(),
        },
        async ({ text }) => {
            try {
                // updated: authenticated user's ID is taken from the MCP server session
                const response = await createBlueskyPost(text, userId);

                return {
                    type: "text",
                    text: `Bluesky post created successfully. URI: ${response.uri}`,
                };
            } catch (error) {
                return {
                    type: "text",
                    text: `Failed to create post: ${error.message}`,
                    isError: true,
                };
            }
        }
    );

        server.tool(
        "getMyPosts",
        "Get the latest posts from my Bluesky account",
        {
            limit: z.number().optional(),
            userId: z.string(),
        },
        async ({ limit, userId }) => {
            try {
                const posts = await getMyPosts(limit || 5, userId);

                const cleanPosts = posts.map(({ post }) => ({
                    uri: post.uri,
                    cid: post.cid,
                    text: post.record.text,
                    createdAt: post.record.createdAt,
                    likes: post.likeCount || 0,
                    replies: post.replyCount || 0,
                    reposts: post.repostCount || 0,
                }));

                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(cleanPosts),
                        },
                    ],
                };
            } catch (error) {
                console.error("BLUESKY POSTS ERROR:", error);

                if (error.message === "Bluesky account is not connected") {
                    return {
                        content: [
                            {
                                type: "text",
                                text: "BLUESKY_NOT_CONNECTED",
                            },
                        ],
                    };
                }

                return {
                    content: [
                        {
                            type: "text",
                            text: `Failed to fetch posts: ${error.message}`,
                        },
                    ],
                    isError: true,
                };
            }
        }
    );

    server.tool(
        "getPostThread",
        "Get the replies and thread of a Bluesky post",
        {
            uri: z.string(),
            userId: z.string(),
        },
        async ({ uri }) => {
            try {
                // updated: use authenticated user's Bluesky account
                const thread = await getPostThread(uri, userId);

                const cleanThread = {
                    post: {
                        uri: thread.post.uri,
                        cid: thread.post.cid,
                        text: thread.post.record.text,
                    },
                    replies:
                        thread.replies?.map((reply) => ({
                            uri: reply.uri,
                            cid: reply.cid,
                            text: reply.record?.text,
                            author: reply.author?.handle,
                        })) || [],
                };

                return {
                    type: "text",
                    text: JSON.stringify(cleanThread),
                };
            } catch (error) {
                return {
                    type: "text",
                    text: `Failed to fetch thread: ${error.message}`,
                    isError: true,
                };
            }
        }
    );

    server.tool(
        "createReply",
        "Reply to a Bluesky post",
        {
            text: z.string(),
            uri: z.string(),
            cid: z.string(),
            userId: z.string(),
        },
        async ({ text, uri, cid }) => {
            try {
                // updated: reply using authenticated user's Bluesky account
                const response = await createReply(
                    text,
                    uri,
                    cid,
                    userId
                );

                return {
                    type: "text",
                    text: `Reply created successfully. URI: ${response.uri}`,
                };
            } catch (error) {
                return {
                    type: "text",
                    text: `Failed to create reply: ${error.message}`,
                    isError: true,
                };
            }
        }
    );

    /**
     * @name getBlueskyStats
     * @description Get analytics for the authenticated user's Bluesky account
     * @access Private
     */
        server.tool(
        "getBlueskyStats",
        "Get Bluesky account analytics for the selected period",
        {
            days: z.number().optional(),
            userId: z.string(),
        },
        async ({ days, userId }) => {
            console.log("🔥 getBlueskyStats MCP TOOL CALLED");
            console.log("🔥 userId:", userId);
            console.log("🔥 days:", days);

            try {
                const stats = await getBlueskyStats(
                    userId,
                    days || 30
                );

                console.log("🔥 STATS RECEIVED:", stats);

                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                period: stats.period,
                                account: stats.account,
                                content: stats.content,
                                bestPost: stats.bestPost,
                            }),
                        },
                    ],
                };
            } catch (error) {
                console.error("BLUESKY STATS ERROR:", error);

                if (error.message === "Bluesky account is not connected") {
                    return {
                        content: [
                            {
                                type: "text",
                                text: "BLUESKY_NOT_CONNECTED",
                            },
                        ],
                    };
                }

                return {
                    content: [
                        {
                            type: "text",
                            text: `Failed to fetch Bluesky stats: ${error.message}`,
                        },
                    ],
                    isError: true,
                };
            }
        }
    );

    return server;
}

const transports = {};

/**
 * MCP SSE connection.
 *
 * Note:
 * The MCP client connection itself is created separately.
 * User-specific MCP state is handled through userId.
 */
app.get("/sse", async (req, res) => {
    try {
        const transport = new SSEServerTransport(
            "/messages",
            res
        );

        // updated: userId can be supplied for a user-specific MCP session
        const userId = req.query.userId;

        if (!userId) {
            return res.status(401).send("User ID required");
        }

        // updated: every SSE connection gets its own user-specific MCP server
        const server = createMCPServer(userId);

        transports[transport.sessionId] = {
            transport,
            server,
            userId,
        };

        res.on("close", async () => {
            const session = transports[transport.sessionId];

            delete transports[transport.sessionId];

            // updated: close the MCP server when the SSE connection closes
            try {
                await session?.server.close();
            } catch (error) {
                console.error(
                    "Failed to close MCP server:",
                    error.message
                );
            }
        });

        await server.connect(transport);
    } catch (error) {
        console.error(
            "MCP SSE connection failed:",
            error
        );

        if (!res.headersSent) {
            res.status(500).send(
                "MCP SSE connection failed"
            );
        }
    }
});

app.post("/messages", async (req, res) => {
    const sessionId = req.query.sessionId;
    const session = transports[sessionId];

    if (session) {
        await session.transport.handlePostMessage(
            req,
            res
        );
    } else {
        res.status(400).send(
            "No transport found for sessionId"
        );
    }
});

/**
 * @name chat
 * @description Process an authenticated user's chat request
 * @route POST /api/chat
 * @access Private
 */
app.post(
    "/api/chat",
    express.json(),
    protect,
    async (req, res) => {
        try {
            const {
                message,
                confirmation = false,
            } = req.body;

            // updated: logged-in user's ID is passed to chat layer
            const response = await chat(
                message,
                confirmation,
                req.user._id.toString()
            );

            res.json({ response });
        } catch (error) {
            console.error(
                "Chat error:",
                error.message
            );

            res.status(500).json({
                message:
                    "Failed to process chat request",
                error: error.message,
            });
        }
    }
);

/**
 * @name resetChat
 * @description Reset the authenticated user's chat memory
 * @route POST /api/chat/reset
 * @access Private
 */
app.post(
    "/api/chat/reset",
    protect,
    (req, res) => {
        // updated: reset only the logged-in user's memory
        resetChat(
            req.user._id.toString()
        );

        res.json({ success: true });
    }
);

export default app;
