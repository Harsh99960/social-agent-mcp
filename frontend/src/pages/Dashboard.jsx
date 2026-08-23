import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
} from "recharts";
import "../styles/dashboard.css";

/**
 * @name Dashboard
 * @description Analytics dashboard for the logged-in user's Bluesky account
 * @route /dashboard
 * @access Private
 */
function Dashboard() {
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [stats, setStats] = useState(null);
    const [days, setDays] = useState(30);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    /**
     * Fetch logged-in user and Bluesky analytics
     */
    async function fetchDashboardData(selectedDays = days) {
        try {
            setLoading(true);
            setError("");

            const token = localStorage.getItem("token");

            if (!token) {
                navigate("/login", { replace: true });
                return;
            }

            // Fetch authenticated user
            const userResponse = await fetch(
                "http://localhost:3000/api/auth/me",
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!userResponse.ok) {
                localStorage.removeItem("token");
                navigate("/login", { replace: true });
                return;
            }

            const userData = await userResponse.json();
            setUser(userData.user);

            // Fetch Bluesky analytics
            const statsResponse = await fetch(
                `http://localhost:3000/api/bluesky/stats?days=${selectedDays}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const statsData = await statsResponse.json();

            if (!statsResponse.ok) {
                // Handle unconnected Bluesky account separately
                if (statsData.code === "BLUESKY_NOT_CONNECTED") {
                    setError("BLUESKY_NOT_CONNECTED");
                    return;
                }

                throw new Error(
                    statsData.message || "Failed to fetch analytics"
                );
            }

            setStats(statsData);
        } catch (error) {
            console.error("Dashboard error:", error.message);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchDashboardData(days);
    }, [days]);

    /**
     * Logout the current user
     */
    function handleLogout() {
        localStorage.removeItem("token");
        localStorage.removeItem("chatMessages");

        navigate("/login", { replace: true });
    }

    // Loading state
    if (loading) {
        return (
            <div className="dashboard-page">
                <div className="dashboard-loading">
                    <div className="loading-icon">✦</div>
                    <p>Loading your analytics...</p>
                </div>
            </div>
        );
    }

    // Error / Bluesky connection state
    if (error) {
        return (
            <div className="dashboard-page">
                <header className="dashboard-header">
                    <div className="dashboard-brand">
                        <div className="dashboard-logo">✦</div>

                        <div>
                            <h2>Social Agent</h2>
                            <span>MCP Powered AI</span>
                        </div>
                    </div>

                    <button
                        className="dashboard-back-btn"
                        onClick={() => navigate("/chat")}
                    >
                        ← Back to Chat
                    </button>
                </header>

                <main className="dashboard-content">
                    <div className="dashboard-error">
                        <div className="error-icon">!</div>

                        {error === "BLUESKY_NOT_CONNECTED" ? (
                            <>
                                <h2>Connect your Bluesky account</h2>

                                <p>
                                    Connect your Bluesky account first to view
                                    your analytics and content performance.
                                </p>

                                <button
                                    onClick={() =>
                                        navigate("/connect-bluesky")
                                    }
                                >
                                    Connect Bluesky
                                </button>
                            </>
                        ) : (
                            <>
                                <h2>Unable to load analytics</h2>

                                <p>{error}</p>

                                <button
                                    onClick={() =>
                                        fetchDashboardData(days)
                                    }
                                >
                                    Try Again
                                </button>
                            </>
                        )}
                    </div>
                </main>
            </div>
        );
    }

    const account = stats?.account || {};
    const content = stats?.content || {};
    const bestPost = stats?.bestPost;

    // Data for engagement pie chart
    const engagementData = [
        {
            name: "Likes",
            value: content.likes || 0,
        },
        {
            name: "Replies",
            value: content.replies || 0,
        },
        {
            name: "Reposts",
            value: content.reposts || 0,
        },
        {
            name: "Quotes",
            value: content.quotes || 0,
        },
    ];

    // Data for content activity bar chart
    const contentData = [
        {
            name: "Posts",
            value: content.posts || 0,
        },
        {
            name: "Likes",
            value: content.likes || 0,
        },
        {
            name: "Replies",
            value: content.replies || 0,
        },
        {
            name: "Reposts",
            value: content.reposts || 0,
        },
        {
            name: "Quotes",
            value: content.quotes || 0,
        },
    ];

    // Dashboard theme colors
    const chartColors = [
        "#8f6378",
        "#62525e",
        "#b98a9f",
        "#51434d",
    ];

    return (
        <div className="dashboard-page">

            {/* Header */}
            <header className="dashboard-header">
                <div className="dashboard-brand">
                    <div className="dashboard-logo">✦</div>

                    <div>
                        <h2>Social Agent</h2>
                        <span>MCP Powered AI</span>
                    </div>
                </div>

                <div className="dashboard-header-actions">
                    {user && (
                        <div className="dashboard-user-info">
                            {user.username}
                        </div>
                    )}

                    {user?.bluesky?.connected && (
                        <div className="dashboard-bluesky-status">
                            <span>●</span>
                            Bluesky Connected
                        </div>
                    )}

                    <button
                        className="dashboard-chat-btn"
                        onClick={() => navigate("/chat")}
                    >
                        AI Chat
                    </button>

                    <button
                        className="dashboard-logout-btn"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>
                </div>
            </header>

            {/* Dashboard content */}
            <main className="dashboard-content">

                {/* Title */}
                <div className="dashboard-title-row">
                    <div>
                        <p className="dashboard-eyebrow">
                            BLUESKY ANALYTICS
                        </p>

                        <h1>Account Overview</h1>

                        <p>
                            Track your content performance and engagement.
                        </p>
                    </div>

                    <select
                        value={days}
                        onChange={(e) =>
                            setDays(Number(e.target.value))
                        }
                        className="period-select"
                    >
                        <option value={7}>Last 7 Days</option>
                        <option value={30}>Last 30 Days</option>
                        <option value={90}>Last 90 Days</option>
                    </select>
                </div>

                {/* Overview cards */}
                <section className="stats-grid">
                    <div className="stat-card">
                        <span className="stat-label">
                            Followers
                        </span>

                        <strong>
                            {account.followers || 0}
                        </strong>

                        <small>
                            Current followers
                        </small>
                    </div>

                    <div className="stat-card">
                        <span className="stat-label">
                            Following
                        </span>

                        <strong>
                            {account.following || 0}
                        </strong>

                        <small>
                            Accounts following
                        </small>
                    </div>

                    <div className="stat-card">
                        <span className="stat-label">
                            Total Posts
                        </span>

                        <strong>
                            {account.totalPosts || 0}
                        </strong>

                        <small>
                            All-time posts
                        </small>
                    </div>

                    <div className="stat-card highlight">
                        <span className="stat-label">
                            Engagement
                        </span>

                        <strong>
                            {content.engagement || 0}
                        </strong>

                        <small>
                            Selected period
                        </small>
                    </div>
                </section>

                {/* Content performance */}
                <section className="dashboard-section">
                    <div className="section-heading">
                        <div>
                            <h2>Content Performance</h2>

                            <p>
                                Your activity during the selected period.
                            </p>
                        </div>

                        <span className="period-badge">
                            Last {days} Days
                        </span>
                    </div>

                    <div className="performance-grid">

                        <div className="performance-card">
                            <span>📝</span>

                            <div>
                                <strong>
                                    {content.posts || 0}
                                </strong>

                                <p>Posts</p>
                            </div>
                        </div>

                        <div className="performance-card">
                            <span>❤️</span>

                            <div>
                                <strong>
                                    {content.likes || 0}
                                </strong>

                                <p>Likes</p>
                            </div>
                        </div>

                        <div className="performance-card">
                            <span>💬</span>

                            <div>
                                <strong>
                                    {content.replies || 0}
                                </strong>

                                <p>Replies</p>
                            </div>
                        </div>

                        <div className="performance-card">
                            <span>🔁</span>

                            <div>
                                <strong>
                                    {content.reposts || 0}
                                </strong>

                                <p>Reposts</p>
                            </div>
                        </div>

                        <div className="performance-card">
                            <span>💭</span>

                            <div>
                                <strong>
                                    {content.quotes || 0}
                                </strong>

                                <p>Quotes</p>
                            </div>
                        </div>

                    </div>
                </section>

                {/* Charts */}
                <section className="charts-grid">

                    {/* Engagement Pie Chart */}
                    <div className="chart-card">
                        <div className="chart-header">
                            <h2>Engagement Breakdown</h2>
                            <span>Last {days} Days</span>
                        </div>

                        <div className="real-chart">
                            <ResponsiveContainer
                                width="100%"
                                height={240}
                            >
                                <PieChart>
                                    <Pie
                                        data={engagementData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={65}
                                        outerRadius={90}
                                        paddingAngle={3}
                                    >
                                        {engagementData.map(
                                            (entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={
                                                        chartColors[index]
                                                    }
                                                />
                                            )
                                        )}
                                    </Pie>

                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Content Bar Chart */}
                    <div className="chart-card">
                        <div className="chart-header">
                            <h2>Content Activity</h2>
                            <span>Last {days} Days</span>
                        </div>

                        <div className="real-chart">
                            <ResponsiveContainer
                                width="100%"
                                height={240}
                            >
                                <BarChart
                                    data={contentData}
                                    margin={{
                                        top: 10,
                                        right: 10,
                                        left: -20,
                                        bottom: 0,
                                    }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        vertical={false}
                                    />

                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 11 }}
                                    />

                                    <YAxis
                                        allowDecimals={false}
                                        tick={{ fontSize: 11 }}
                                    />

                                    <Tooltip />

                                    <Bar
                                        dataKey="value"
                                        radius={[6, 6, 0, 0]}
                                        fill="#8f6378"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                </section>

                {/* Best performing post */}
                <section className="best-post-section">

                    <div className="section-heading">
                        <div>
                            <h2>Best Performing Post</h2>

                            <p>
                                Your highest-engagement post in this period.
                            </p>
                        </div>

                        <span className="best-post-badge">
                            🏆 Top Post
                        </span>
                    </div>

                    {bestPost ? (
                        <div className="best-post-card">

                            <p className="best-post-text">
                                {bestPost.text}
                            </p>

                            <div className="best-post-meta">

                                <div>
                                    ❤️{" "}
                                    <strong>
                                        {bestPost.likes}
                                    </strong>{" "}
                                    Likes
                                </div>

                                <div>
                                    💬{" "}
                                    <strong>
                                        {bestPost.replies}
                                    </strong>{" "}
                                    Replies
                                </div>

                                <div>
                                    🔁{" "}
                                    <strong>
                                        {bestPost.reposts}
                                    </strong>{" "}
                                    Reposts
                                </div>

                                <div>
                                    💭{" "}
                                    <strong>
                                        {bestPost.quotes}
                                    </strong>{" "}
                                    Quotes
                                </div>

                                <div className="best-engagement">
                                    Engagement{" "}
                                    <strong>
                                        {bestPost.engagement}
                                    </strong>
                                </div>

                            </div>
                        </div>
                    ) : (
                        <div className="empty-post">
                            <span>✦</span>

                            <p>
                                No posts found for this time period.
                            </p>
                        </div>
                    )}

                </section>

            </main>
        </div>
    );
}

export default Dashboard;