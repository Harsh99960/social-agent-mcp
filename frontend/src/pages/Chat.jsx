import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import "../App.css";

/**
 * @name Chat
 * @description Main AI social media agent interface
 * @route /chat
 * @access Private
 */
function Chat() {
    const navigate = useNavigate();

    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(null); // updated: stores logged-in user information

    const [messages, setMessages] = useState(() =>
        JSON.parse(localStorage.getItem("chatMessages") || "[]")
    );

    useEffect(() => {
        async function getUser() {
            try {
                const token = localStorage.getItem("token");

                const response = await fetch(
                    "http://localhost:3000/api/auth/me",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (!response.ok) {
                    localStorage.removeItem("token");
                    navigate("/login", { replace: true });
                    return;
                }

                const data = await response.json();
                setUser(data.user); // updated: saves verified user data
            } catch {
                localStorage.removeItem("token");
                navigate("/login", { replace: true });
            }
        }

        getUser();
    }, [navigate]);

    function formatResponse(response) {
        if (typeof response !== "string") {
            return response?.message || JSON.stringify(response, null, 2);
        }

        try {
            return JSON.stringify(JSON.parse(response), null, 2);
        } catch {
            return response;
        }
    }

    async function clearChat() {
        try {
            await fetch("http://localhost:3000/api/chat/reset", {
                method: "POST",
            }); // updated: backend ki conversation memory bhi reset karta hai

            localStorage.removeItem("chatMessages");
            setMessages([]);
        } catch {
            console.error("Failed to reset backend chat");
        }
    }

    function handleLogout() {
        // updated: removes authentication token before leaving the chat
        localStorage.removeItem("token");

        // updated: clears local chat history
        localStorage.removeItem("chatMessages");
        setMessages([]);

        // updated: redirects user to login page
        navigate("/login", { replace: true });
    }

    function handleConnectBluesky() {
        // updated: opens Bluesky connection page
        navigate("/connect-bluesky");
    }

    async function sendMessage(text, confirmation = false) {
        setLoading(true);

        try {
            const token = localStorage.getItem("token"); // updated: authenticated user's JWT get karta hai

            const response = await fetch("http://localhost:3000/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`, // updated: chat request ke saath JWT bhejta hai
                },
                body: JSON.stringify({
                    message: text,
                    confirmation,
                }),
            });

            if (!response.ok) {
                throw new Error("Server error");
            }

            const data = await response.json();

            const aiMsg = {
                role: "ai",
                text: formatResponse(data.response),
                confirmationRequired:
                    data.response?.confirmationRequired || false, // updated: confirmation state store karta hai
            };

            setMessages((prev) => {
                const updated = [...prev, aiMsg];
                localStorage.setItem(
                    "chatMessages",
                    JSON.stringify(updated)
                );
                return updated;
            });
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    role: "ai",
                    text: "⚠️ Something went wrong. Please try again.",
                },
            ]);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();

        const currentMessage = message.trim();

        if (!currentMessage || loading) return;

        setMessage("");

        const confirmation =
            /^(yes|y|confirm|confirmed|confrim|ok|okay|sure|proceed|go ahead|do it|yes please)$/i.test(
                currentMessage
            );

        const userMsg = {
            role: "user",
            text: currentMessage,
        };

        setMessages((prev) => {
            const updated = [...prev, userMsg];
            localStorage.setItem("chatMessages", JSON.stringify(updated));
            return updated;
        });

        await sendMessage(currentMessage, confirmation);
    }

    async function handleConfirmation(confirm) {
        // updated: confirmation buttons handle karta hai
        await sendMessage(confirm ? "yes" : "no", confirm);
    }

    return (
        <div className="chat-app">
            <header className="chat-header">
                <div className="chat-brand">
                    <div className="brand-orb">
                        <span>✦</span>
                    </div>

                    <div className="brand-copy">
                        <h2>Social Agent</h2>
                        <span>MCP Powered AI</span>
                    </div>
                </div>

                <div className="header-actions">
                    {user && (
                        <div className="user-pill">
                            <div className="user-avatar">
                                {user.username?.charAt(0).toUpperCase()}
                            </div>

                            <span>{user.username}</span>
                        </div>
                    )}

                    {/* updated: shows Bluesky connection status */}
                    {user?.bluesky?.connected ? (
                        <div className="bluesky-status connected">
                            <span className="status-dot"></span>
                            Bluesky Connected
                        </div>
                    ) : (
                        <button
                            className="connect-bluesky-btn"
                            onClick={handleConnectBluesky}
                        >
                            <span>↗</span>
                            Connect Bluesky
                        </button>
                    )}

                    <div className="online-status">
                        <span className="status-dot"></span>
                        Online
                    </div>

                    <button
                        className="header-btn analytics-btn"
                        onClick={() => navigate("/dashboard")}
                    >
                        <span>⌁</span>
                        Analytics
                    </button>

                    {messages.length > 0 && (
                        <button className="header-btn" onClick={clearChat}>
                            Clear Chat
                        </button>
                    )}

                    <button className="header-btn logout-btn" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </header>

            <main className="chat-container">
                {!messages.length && (
                    <div className="welcome">
                        <div className="bot-avatar-large">
                            <div className="bot-face">
                                <span className="bot-eye left"></span>
                                <span className="bot-eye right"></span>
                                <span className="bot-smile"></span>
                            </div>

                            <span className="bot-spark spark-one">✦</span>
                            <span className="bot-spark spark-two">✧</span>
                        </div>

                        <div className="welcome-badge">
                            <span></span>
                            AI SOCIAL ASSISTANT
                        </div>

                        <h1>
                            {user
                                ? `How can I help you, ${user.username}?`
                                : "How can I help you?"}
                        </h1>

                        <p>
                            Create, manage and analyze your social media
                            presence with an AI agent powered by Gemini and
                            MCP.
                        </p>

                        <div className="quick-actions">
                            <button
                                onClick={() =>
                                    setMessage("Show me my Bluesky stats")
                                }
                            >
                                <span>◈</span>
                                View analytics
                            </button>

                            <button
                                onClick={() =>
                                    setMessage(
                                        "Create a post for my Bluesky account"
                                    )
                                }
                            >
                                <span>✦</span>
                                Create a post
                            </button>

                            <button
                                onClick={() =>
                                    setMessage("Show me my latest posts")
                                }
                            >
                                <span>◷</span>
                                Latest posts
                            </button>
                        </div>
                    </div>
                )}

                <div className="messages-list">
                    {messages.map((msg, i) => (
                        <div
                            key={i}
                            className={`message-row ${
                                msg.role === "user"
                                    ? "user-row"
                                    : "ai-row"
                            }`}
                        >
                            {msg.role === "ai" && (
                                <div className="message-avatar">
                                    <div className="mini-bot">
                                        <span></span>
                                        <span></span>
                                    </div>
                                </div>
                            )}

                            <div
                                className={`message ${
                                    msg.role === "user"
                                        ? "user-message"
                                        : "ai-message"
                                }`}
                            >
                                <div className="message-content">
                                    {msg.role === "ai" ? (
                                        <ReactMarkdown>
                                            {msg.text}
                                        </ReactMarkdown>
                                    ) : (
                                        <p>{msg.text}</p>
                                    )}

                                    {msg.confirmationRequired && (
                                        <div className="confirmation-card">
                                            <div className="confirmation-icon">
                                                ?
                                            </div>

                                            <div>
                                                <strong>
                                                    Ready to perform this
                                                    action?
                                                </strong>

                                                <span>
                                                    Please confirm before I
                                                    continue.
                                                </span>
                                            </div>

                                            <div className="confirmation-actions">
                                                <button
                                                    className="confirm-btn"
                                                    onClick={() =>
                                                        handleConfirmation(true)
                                                    }
                                                >
                                                    Confirm
                                                </button>

                                                <button
                                                    className="cancel-btn"
                                                    onClick={() =>
                                                        handleConfirmation(false)
                                                    }
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="message-row ai-row">
                            <div className="message-avatar">
                                <div className="mini-bot thinking-bot">
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>

                            <div className="message ai-message thinking-message">
                                <div className="thinking-content">
                                    <span>Thinking</span>
                                    <div className="thinking-dots">
                                        <i></i>
                                        <i></i>
                                        <i></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <form className="input-area" onSubmit={handleSubmit}>
                <div className="input-wrapper">
                    <div className="input-icon">✦</div>

                    <input
                        type="text"
                        placeholder={
                            loading
                                ? "Your AI agent is thinking..."
                                : "Ask your social media agent..."
                        }
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        disabled={loading}
                    />

                    <button
                        className="send-btn"
                        type="submit"
                        disabled={loading || !message.trim()}
                    >
                        {loading ? (
                            <span className="send-loader"></span>
                        ) : (
                            "↑"
                        )}
                    </button>
                </div>

                <p className="input-disclaimer">
                    AI can make mistakes. Check important information.
                </p>
            </form>
        </div>
    );
}

export default Chat;