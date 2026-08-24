import { useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * @name Login
 * @description Login an existing user
 * @route /login
 * @access Public
 */
function Login() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/auth/login`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email,
                        password,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Login failed");
            }

            localStorage.setItem("token", data.token);

            navigate("/chat", { replace: true });
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

                <form className="auth-card" onSubmit={handleSubmit}>

                    <div className="auth-heading">
                        <span className="auth-eyebrow">
                            WELCOME BACK
                        </span>

                        <h1>Sign in to your account</h1>

                        <p>
                            Continue managing your social media
                            with your AI agent.
                        </p>
                    </div>

                    {error && (
                        <div className="auth-error">
                            <span>!</span>
                            <p>{error}</p>
                        </div>
                    )}

                    <div className="auth-fields">

                        <div className="auth-field">
                            <label htmlFor="email">
                                Email address
                            </label>

                            <input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) =>
                                    setEmail(e.target.value)
                                }
                                required
                            />
                        </div>

                        <div className="auth-field">
                            <div className="auth-label-row">
                                <label htmlFor="password">
                                    Password
                                </label>
                            </div>

                            <input
                                id="password"
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) =>
                                    setPassword(e.target.value)
                                }
                                required
                            />
                        </div>

                    </div>

                    <button
                        type="submit"
                        className="auth-submit"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="auth-spinner"></span>
                                Logging in...
                            </>
                        ) : (
                            <>
                                Sign in
                                <span>→</span>
                            </>
                        )}
                    </button>

                    <div className="auth-divider">
                        <span></span>
                        <p>OR</p>
                        <span></span>
                    </div>

                    <p className="auth-switch">
                        Don't have an account?
                        <a href="/register">
                            Create one
                        </a>
                    </p>

                </form>

                <p className="auth-footer">
                    Secure authentication · Social Agent
                </p>

            </div>
        </div>
    );
}

export default Login;