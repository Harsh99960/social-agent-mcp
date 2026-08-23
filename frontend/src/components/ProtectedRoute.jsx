import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

/**
 * @name ProtectedRoute
 * @description Allow access only to authenticated users
 * @route Used for private routes
 * @access Private
 */
function ProtectedRoute({ children }) {
    const [checking, setChecking] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);

    useEffect(() => {
        async function verifyUser() {
            const token = localStorage.getItem("token"); // updated: get logged-in user's JWT

            if (!token) {
                setChecking(false);
                return;
            }

            try {
                const response = await fetch(
                    "http://localhost:3000/api/auth/me",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`, // updated: send JWT for server verification
                        },
                    }
                );

                if (!response.ok) {
                    localStorage.removeItem("token"); // updated: remove invalid or expired token
                    setAuthenticated(false);
                    return;
                }

                setAuthenticated(true); // updated: server confirmed authenticated user
            } catch (error) {
                console.error("Authentication check failed:", error);
                setAuthenticated(false);
            } finally {
                setChecking(false);
            }
        }

        verifyUser();
    }, []);

    if (checking) {
        return <div className="auth-loading">Checking authentication...</div>;
    }

    if (!authenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

export default ProtectedRoute;