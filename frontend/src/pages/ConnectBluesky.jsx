import { useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * @name ConnectBluesky
 * @description Connect the logged-in user's Bluesky account
 * @route /connect-bluesky
 * @access Private
 */
function ConnectBluesky() {
    const navigate = useNavigate();

    const [handle, setHandle] = useState("");
    const [appPassword, setAppPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();

        setError("");
        setSuccess("");
        setLoading(true);

        try {
            const token = localStorage.getItem("token");

            if (!token) {
                navigate("/login", { replace: true });
                return;
            }

            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/bluesky/connect`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        handle,
                        appPassword,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to connect Bluesky account"
                );
            }

            setSuccess(
                data.message ||
                    "Bluesky account connected successfully"
            );

            setAppPassword("");

            setTimeout(() => {
                navigate("/chat", { replace: true });
            }, 1000);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-shell">

                <div className="auth-brand">
                    <div className="auth-logo">✦</div>

                    <div>
                        <h2>Social Agent</h2>
                        <span>MCP Powered AI</span>
                    </div>
                </div>

                <form
                    className="auth-card bluesky-card"
                    onSubmit={handleSubmit}
                >
                    <div className="auth-heading">
                        <span className="auth-eyebrow">
                            SOCIAL CONNECTION
                        </span>

                        <div className="bluesky-icon">🦋</div>

                        <h1>Connect Bluesky</h1>

                        <p>
                            Connect your Bluesky account and let
                            Social Agent manage your posts and replies.
                        </p>
                    </div>

                    {error && (
                        <div className="auth-error">
                            <span>!</span>
                            <p>{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="auth-success">
                            <span>✓</span>
                            <p>{success}</p>
                        </div>
                    )}

                    <div className="auth-fields">

                        <div className="auth-field">
                            <label htmlFor="bluesky-handle">
                                Bluesky Handle
                            </label>

                            <input
                                id="bluesky-handle"
                                type="text"
                                placeholder="yourname.bsky.social"
                                value={handle}
                                onChange={(e) =>
                                    setHandle(e.target.value)
                                }
                                required
                            />
                        </div>

                        <div className="auth-field">
                            <label htmlFor="bluesky-password">
                                App Password
                            </label>

                            <input
                                id="bluesky-password"
                                type="password"
                                placeholder="xxxx-xxxx-xxxx-xxxx"
                                value={appPassword}
                                onChange={(e) =>
                                    setAppPassword(e.target.value)
                                }
                                required
                            />
                        </div>

                    </div>

                    <small className="bluesky-note">
                        Use a Bluesky App Password instead of your
                        main account password.
                    </small>

                    <button
                        type="submit"
                        className="auth-submit"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="auth-spinner" />
                                Connecting...
                            </>
                        ) : (
                            <>
                                Connect Account
                                <span>→</span>
                            </>
                        )}
                    </button>

                    <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => navigate("/chat")}
                        disabled={loading}
                    >
                        ← Back to Chat
                    </button>
                </form>

                <p className="auth-footer">
                    Your credentials are securely handled · Social Agent
                </p>

            </div>
        </div>
    );
}

export default ConnectBluesky;