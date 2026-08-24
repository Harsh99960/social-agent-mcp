import { BskyAgent } from "@atproto/api";
import User from "./models/user.js";
import { decrypt } from "./utils/encryption.js";

/**
 * @name getUserBlueskyAgent
 * @description Create a Bluesky agent using the logged-in user's saved credentials
 * @access Private
 */
async function getUserBlueskyAgent(userId) {
    // updated: fetch only the authenticated user's Bluesky connection
    const user = await User.findById(userId).select(
        "bluesky.handle bluesky.appPassword bluesky.connected"
    );

    if (!user) {
        throw new Error("User not found");
    }

    if (
        !user.bluesky?.connected ||
        !user.bluesky?.handle ||
        !user.bluesky?.appPassword
    ) {
        throw new Error("Bluesky account is not connected");
    }

    // updated: decrypt the stored Bluesky app password only on the server
    const appPassword = decrypt(user.bluesky.appPassword);

    const agent = new BskyAgent({
        service: "https://bsky.social",
    });

    // updated: login using this user's own Bluesky credentials
    await agent.login({
        identifier: user.bluesky.handle,
        password: appPassword,
    });

    return agent;
}

/**
 * @name createBlueskyPost
 * @description Create a post on the authenticated user's Bluesky account
 * @access Private
 */
export async function createBlueskyPost(text, userId) {
    try {
        const agent = await getUserBlueskyAgent(userId);

        return await agent.post({
            text,
            createdAt: new Date().toISOString(),
        });
    } catch (error) {
        throw new Error(`Failed to create post: ${error.message}`);
    }
}

/**
 * @name getMyPosts
 * @description Get posts from the authenticated user's Bluesky account
 * @access Private
 */
export async function getMyPosts(limit = 5, userId) {
    try {
        const agent = await getUserBlueskyAgent(userId);

        const response = await agent.getAuthorFeed({
            actor: agent.session.did,
            limit: Math.min(limit * 3, 100), // updated: filtering ke liye extra posts fetch karta hai
        });

        const posts = response.data.feed
            .filter(({ post }) =>
                post.author.did === agent.session.did && !post.record.reply // updated: replies/reposts remove karta hai
            )
            .slice(0, limit);

        return posts;
    } catch (error) {

        if (error.message === "Bluesky account is not connected") {
            throw error;
        }
        throw new Error(`Failed to fetch posts: ${error.message}`);
    }
}

/**
 * @name getPostThread
 * @description Get a post thread from Bluesky
 * @access Private
 */
export async function getPostThread(uri, userId) {
    try {
        // updated: authenticate with the current user's Bluesky account
        const agent = await getUserBlueskyAgent(userId);

        const response = await agent.getPostThread({ uri });

        return response.data.thread;
    } catch (error) {
        throw new Error(`Failed to fetch thread: ${error.message}`);
    }
}

/**
 * @name createReply
 * @description Reply to a Bluesky post using the authenticated user's account
 * @access Private
 */
export async function createReply(text, uri, cid, userId) {
    try {
        const agent = await getUserBlueskyAgent(userId);

        return await agent.post({
            text,
            reply: {
                root: { uri, cid },
                parent: { uri, cid },
            },
        });
    } catch (error) {
        throw new Error(`Failed to create reply: ${error.message}`);
    }
}

/**
 * @name getBlueskyStats
 * @description Get analytics for the authenticated user's Bluesky account
 * @access Private
 */
export async function getBlueskyStats(userId, days = 30) {
    try {
        const agent = await getUserBlueskyAgent(userId);

        // updated: fetch current account-level statistics
        const profileResponse = await agent.getProfile({
            actor: agent.session.did,
        });

        const profile = profileResponse.data;

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        let cursor;
        const posts = [];

        // updated: paginate through the user's feed until the selected time range is covered
        do {
            const response = await agent.getAuthorFeed({
                actor: agent.session.did,
                limit: 100,
                cursor,
            });

            const feed = response.data.feed || [];

            for (const item of feed) {
                const post = item.post;

                // updated: only include posts created within the selected period
                const createdAt = new Date(post.record.createdAt);

                if (createdAt < cutoffDate) {
                    continue;
                }

                // updated: only count posts actually created by the authenticated user
                if (post.author.did !== agent.session.did) {
                    continue;
                }

                // updated: exclude replies from analytics
                if (post.record.reply) {
                    continue;
                }

                posts.push(post);
            }

            cursor = response.data.cursor;

            // updated: stop pagination when the oldest fetched post is outside the selected range
            const lastPost = feed[feed.length - 1];

            if (
                lastPost &&
                new Date(lastPost.post.record.createdAt) < cutoffDate
            ) {
                break;
            }
        } while (cursor);

        // updated: calculate engagement metrics from real Bluesky post counts
        const stats = posts.reduce(
            (total, post) => {
                total.likes += post.likeCount || 0;
                total.replies += post.replyCount || 0;
                total.reposts += post.repostCount || 0;
                total.quotes += post.quoteCount || 0;

                return total;
            },
            {
                likes: 0,
                replies: 0,
                reposts: 0,
                quotes: 0,
            }
        );

        // updated: calculate total engagement
        const engagement =
            stats.likes +
            stats.replies +
            stats.reposts +
            stats.quotes;

        // updated: find the best-performing post using total engagement
        const bestPost = posts.reduce((best, post) => {
            const postEngagement =
                (post.likeCount || 0) +
                (post.replyCount || 0) +
                (post.repostCount || 0) +
                (post.quoteCount || 0);

            if (!best || postEngagement > best.engagement) {
                return {
                    uri: post.uri,
                    cid: post.cid,
                    text: post.record.text,
                    createdAt: post.record.createdAt,
                    likes: post.likeCount || 0,
                    replies: post.replyCount || 0,
                    reposts: post.repostCount || 0,
                    quotes: post.quoteCount || 0,
                    engagement: postEngagement,
                };
            }

            return best;
        }, null);

        return {
            period: {
                days,
                from: cutoffDate.toISOString(),
                to: new Date().toISOString(),
            },

            account: {
                handle: profile.handle,
                followers: profile.followersCount || 0,
                following: profile.followsCount || 0,
                totalPosts: profile.postsCount || 0,
            },

            content: {
                posts: posts.length,
                likes: stats.likes,
                replies: stats.replies,
                reposts: stats.reposts,
                quotes: stats.quotes,
                engagement,
            },

            bestPost,
        };
    } catch (error) {
        console.error("BLUESKY STATS SERVICE ERROR:", error);
        if (error.message === "Bluesky account is not connected") {
            throw error;
        }
        throw new Error(`Failed to fetch Bluesky stats: ${error.message}`);
    }
}