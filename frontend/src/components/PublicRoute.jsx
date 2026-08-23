import { Navigate } from "react-router-dom";

/**
 * @name PublicRoute
 * @description Allow access only to users who are not authenticated
 * @route Used for public authentication pages
 * @access Public
 */
function PublicRoute({ children }) {
    const token = localStorage.getItem("token"); // updated: check if user is already logged in

    if (token) {
        return <Navigate to="/chat" replace />; // updated: logged-in user ko chat par bhejta hai
    }

    return children;
}

export default PublicRoute;