import { GoogleGenAI } from "@google/genai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import User from "../server/models/user.js";

let tools = [];

// updated: each user gets a separate MCP client connection
const userMcpClients = new Map();

// updated: each user's conversation state is kept separately
const userStates = new Map();

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

/**
 * @name getUserState
 * @description Create or retrieve isolated conversation state for a user
 * @access Internal
 */
function getUserState(userId) {
    if (!userStates.has(userId)) {
        userStates.set(userId, {
            chatHistory: [],
            pendingAction: null,
            lastReferencedPost: null,
            lastUserMessage: "",
            suggestions: [],
        });
    }

    return userStates.get(userId);
}

/**
 * @name isBlueskyConnected
 * @description Check whether the authenticated user has connected Bluesky
 * @access Internal
 */
async function isBlueskyConnected(userId) {
    const user = await User.findById(userId).select(
        "username bluesky.handle bluesky.appPassword bluesky.connected"
    );

    if (!user) {
        throw new Error("User not found");
    }

    // updated: logs connection state for debugging
    console.log("BLUESKY CHECK:", {
        userId,
        username: user.username,
        connected: user.bluesky?.connected,
        handle: user.bluesky?.handle,
        hasPassword: Boolean(user.bluesky?.appPassword),
    });

    return Boolean(
        user.bluesky?.connected &&
        user.bluesky?.handle &&
        user.bluesky?.appPassword
    );
}

/**
 * @name getUserMcpClient
 * @description Create or retrieve the MCP connection for a specific user
 * @access Internal
 */
async function getUserMcpClient(userId) {
    if (!userId) {
        throw new Error("Authenticated user ID is required");
    }

    if (userMcpClients.has(userId)) {
        return userMcpClients.get(userId);
    }

    const client = new Client({
        name: "example-client",
        version: "1.0.0",
    });

    // updated: MCP connection is tied to the authenticated user
    const transport = new SSEClientTransport(
        new URL(
            `http://localhost:${process.env.PORT || 3000}/sse?userId=${userId}`
        )
    );

    await client.connect(transport);

    console.log(`Connected to MCP server for user: ${userId}`);

    userMcpClients.set(userId, client);

    return client;
}

/**
 * @name connectMCP
 * @description Kept for compatibility with the existing server startup flow
 * @access Internal
 */
export async function connectMCP() {
    // updated: MCP connects when an authenticated user starts chatting
    console.log(
        "MCP will connect when an authenticated user starts chatting"
    );
}

/**
 * @name resetChat
 * @description Reset only the requested user's chat and MCP connection
 * @access Internal
 */
export async function resetChat(userId) {
    if (!userId) {
        userStates.clear();
        return;
    }

    userStates.delete(userId);

    const client = userMcpClients.get(userId);

    // updated: close only this user's MCP connection
    if (client) {
        try {
            await client.close();
        } catch (error) {
            console.error(
                "Failed to close user MCP connection:",
                error.message
            );
        }

        userMcpClients.delete(userId);
    }
}

/**
 * @name getUserTools
 * @description Get MCP tools available to the authenticated user
 * @access Internal
 */
async function getUserTools(userId) {
    const client = await getUserMcpClient(userId);
    const response = await client.listTools();

    return response.tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        parameters: {
            type: tool.inputSchema.type,
            properties: tool.inputSchema.properties,
            required: tool.inputSchema.required,
        },
    }));
}

/**
 * @name generateResponse
 * @description Generate Gemini response and execute required MCP tools
 * @access Internal
 */
async function generateResponse(userId) {
    const state = getUserState(userId);
    const mcpClient = await getUserMcpClient(userId);

    // updated: fetch current user's MCP tools
    tools = await getUserTools(userId);

    const response = await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: state.chatHistory,
        config: {
            systemInstruction: `
                You are a social media assistant.

                Use available tools whenever the user asks you to perform
                an action or retrieve information.

                Never claim an action was completed unless the tool confirms it.

                If a tool fails, clearly tell the user that the action failed.

                When the user asks for analytics, statistics, performance,
                engagement, followers, posts, likes, replies, reposts,
                quotes, or best-performing content, use getBlueskyStats.

                When analytics are returned, explain them clearly using
                concise Markdown.

                Highlight:
                - Followers
                - Following
                - Total posts
                - Posts in selected period
                - Likes
                - Replies
                - Reposts
                - Quotes
                - Total engagement
                - Best-performing post

                Never show URI, CID, DID, or internal identifiers.

                When the user says "this post" or "that post",
                use the most recently referenced post.

                Use clean, concise Markdown.

                When suggesting replies, number them clearly as 1, 2, 3.
            `,
            tools: [{ functionDeclarations: tools }],
        },
    });

    state.chatHistory.push(response.candidates[0].content);

    const functionCall =
        response.candidates[0].content.parts[0].functionCall;

    if (functionCall) {
        // updated: actions that change Bluesky require confirmation
        if (
            functionCall.name === "createBlueskyPost" ||
            functionCall.name === "createReply"
        ) {
            const connected = await isBlueskyConnected(userId);

            if (!connected) {
                state.pendingAction = null;

                return {
                    confirmationRequired: false,
                    message:
                        "Your Bluesky account is not connected. Please connect your Bluesky account first.",
                };
            }

            if (
                functionCall.name === "createReply" &&
                state.lastReferencedPost &&
                /this post|that post|latest post/i.test(
                    state.lastUserMessage
                )
            ) {
                functionCall.args.uri =
                    state.lastReferencedPost.uri;

                functionCall.args.cid =
                    state.lastReferencedPost.cid;
            }

            // updated: attach authenticated user ID to the tool call
            functionCall.args.userId = userId;

            state.pendingAction = functionCall;

            return {
                confirmationRequired: true,
                message: "This action requires your confirmation.",
                args: functionCall.args,
            };
        }

        // updated: attach authenticated user ID to every MCP tool call
        functionCall.args.userId = userId;

        const toolResult = await mcpClient.callTool({
            name: functionCall.name,
            arguments: functionCall.args,
        });

        let result =
            toolResult.content?.[0]?.text || "";

        // updated: log tool result while testing analytics
        console.log(
            "MCP TOOL RESULT:",
            functionCall.name,
            result
        );

        // Handle user's posts
if (functionCall.name === "getMyPosts") {
    if (result === "BLUESKY_NOT_CONNECTED") {
        result =
            "Your Bluesky account is not connected. Please connect your Bluesky account first.";
    } else {
        try {
            const posts = JSON.parse(result);

                if (posts.length) {
                    state.lastReferencedPost = posts[0];
                }

                result = JSON.stringify(
                    posts.map(({ uri, cid, ...post }) => post)
                );
            } catch (error) {
                console.error(
                    "Failed to parse posts:",
                    error.message
                );
            }
        }
    }

        // Handle post thread
        if (functionCall.name === "getPostThread") {
            try {
                const thread = JSON.parse(result);

                state.lastReferencedPost = thread.post;

                result = JSON.stringify({
                    post: (({ uri, cid, ...post }) => post)(
                        thread.post
                    ),
                    replies: thread.replies?.map(
                        ({ uri, cid, ...reply }) => reply
                    ),
                });
            } catch (error) {
                console.error(
                    "Failed to parse thread:",
                    error.message
                );
            }
        }

        // updated: clean analytics data before sending it back to Gemini
        if (functionCall.name === "getBlueskyStats") {
            if (result === "BLUESKY_NOT_CONNECTED") {
                result =
                    "Your Bluesky account is not connected. Please connect your Bluesky account first.";
            } else {
                try {
                    const stats = JSON.parse(result);

                    result = JSON.stringify({
                        period: stats.period,
                        account: stats.account,
                        content: stats.content,
                        bestPost: stats.bestPost
                            ? {
                                text: stats.bestPost.text,
                                createdAt: stats.bestPost.createdAt,
                                likes: stats.bestPost.likes,
                                replies: stats.bestPost.replies,
                                reposts: stats.bestPost.reposts,
                                quotes: stats.bestPost.quotes,
                                engagement: stats.bestPost.engagement,
                            }
                            : null,
                    });
                } catch (error) {
                    console.error(
                        "Failed to parse Bluesky stats:",
                        error.message
                    );
                }
            }
        }

        state.chatHistory.push({
            role: "user",
            parts: [
                {
                    functionResponse: {
                        name: functionCall.name,
                        response: { result },
                    },
                },
            ],
        });

        // updated: let Gemini convert tool data into a natural response
        return generateResponse(userId);
    }

    const text =
        response.candidates[0].content.parts[0].text || "";

    // updated: store numbered AI suggestions for later selection
    state.suggestions = [
        ...text.matchAll(
            /(?:^|\n)\s*(\d+)[.)]\s*(.+)/g
        ),
    ]
        .sort((a, b) => Number(a[1]) - Number(b[1]))
        .map((match) =>
            match[2].replace(/\*\*/g, "").trim()
        );

    return text;
}

/**
 * @name chat
 * @description Process chat using the authenticated user's isolated state
 * @access Private
 */
export async function chat(
    message,
    confirmation = false,
    userId
) {
    if (!userId) {
        throw new Error("Authenticated user ID is required");
    }

    const state = getUserState(userId);
    const mcpClient = await getUserMcpClient(userId);

    // Handle pending confirmation
    if (state.pendingAction) {
        if (!confirmation) {
            state.pendingAction = null;
            return "Action cancelled.";
        }

        // updated: verify Bluesky is still connected before execution
        const connected = await isBlueskyConnected(userId);

        if (!connected) {
            state.pendingAction = null;

            return {
                confirmationRequired: false,
                message:
                    "Your Bluesky account is no longer connected. Please connect your Bluesky account first.",
            };
        }

        // updated: attach authenticated user ID before execution
        state.pendingAction.args.userId = userId;

        const toolResult = await mcpClient.callTool({
            name: state.pendingAction.name,
            arguments: state.pendingAction.args,
        });

        const result =
            toolResult.content?.[0]?.text || "";

        state.chatHistory.push({
            role: "user",
            parts: [
                {
                    functionResponse: {
                        name: state.pendingAction.name,
                        response: { result },
                    },
                },
            ],
        });

        state.pendingAction = null;

        return generateResponse(userId);
    }

    state.lastUserMessage = message;

    const match = message.match(
        /(?:post|publish|use)\s+(?:option\s*)?(\d+)/i
    );

    if (
        match &&
        state.suggestions[Number(match[1]) - 1]
    ) {
        message = `Post this reply: "${
            state.suggestions[Number(match[1]) - 1]
        }"`;
    }

    state.chatHistory.push({
        role: "user",
        parts: [{ text: message }],
    });

    return generateResponse(userId);
}