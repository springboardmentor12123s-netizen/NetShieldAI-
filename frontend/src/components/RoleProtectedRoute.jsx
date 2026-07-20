import { Navigate } from "react-router-dom";
import { hasPermission } from "../utils/permissions";

export default function RoleProtectedRoute({ permission, children }) {
  const isLoggedIn = localStorage.getItem("netshield_auth") === "true";

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (!hasPermission(permission)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}