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
            const token = localStorage.getItem("token");

            if (!token) {
                setChecking(false);
                return;
            }

            try {
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/auth/me`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (!response.ok) {
                    localStorage.removeItem("token");
                    setAuthenticated(false);
                    return;
                }

                setAuthenticated(true);
            } catch (error) {
                console.error(
                    "Authentication check failed:",
                    error
                );
                setAuthenticated(false);
            } finally {
                setChecking(false);
            }
        }

        verifyUser();
    }, []);

    if (checking) {
        return (
            <div className="auth-loading">
                Checking authentication...
            </div>
        );
    }

    if (!authenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

export default ProtectedRoute;