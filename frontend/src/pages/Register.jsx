import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./../App.css";

/**
 * @name Register
 * @description Create a new user account
 * @route /register
 * @access Public
 */
function Register() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        username: "",
        email: "",
        password: "",
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    function handleChange(e) {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/auth/register`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(form),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Registration failed"
                );
            }

            navigate("/login", { replace: true });
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
                    className="auth-card"
                    onSubmit={handleSubmit}
                >
                    <div className="auth-heading">
                        <span className="auth-eyebrow">
                            GET STARTED
                        </span>

                        <h1>Create your account</h1>

                        <p>
                            Create your Social Agent account and start
                            managing your social media with AI.
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
                            <label htmlFor="username">
                                Username
                            </label>

                            <input
                                id="username"
                                type="text"
                                name="username"
                                placeholder="Choose a username"
                                value={form.username}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="auth-field">
                            <label htmlFor="register-email">
                                Email address
                            </label>

                            <input
                                id="register-email"
                                type="email"
                                name="email"
                                placeholder="you@example.com"
                                value={form.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="auth-field">
                            <label htmlFor="register-password">
                                Password
                            </label>

                            <input
                                id="register-password"
                                type="password"
                                name="password"
                                placeholder="Create a password"
                                value={form.password}
                                onChange={handleChange}
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
                                <span className="auth-spinner" />
                                Creating...
                            </>
                        ) : (
                            <>
                                Create account
                                <span>→</span>
                            </>
                        )}
                    </button>

                    <div className="auth-divider">
                        <span />
                        <p>OR</p>
                        <span />
                    </div>

                    <p className="auth-switch">
                        Already have an account?
                        <a href="/login">
                            Sign in
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

export default Register;