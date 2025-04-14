// src/components/utils/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { getAuthToken } from "./auth";

function ProtectedRoute({ children }) {
    const token = getAuthToken();
    return token ? children : <Navigate to="/" replace />;
}

export default ProtectedRoute;
