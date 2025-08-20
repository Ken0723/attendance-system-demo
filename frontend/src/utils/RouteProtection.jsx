import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../components/auth/AuthContext";

const RouteProtection = ({ children, requiredPermission }) => {
  const { isAuthenticated, loading, permissions } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!requiredPermission || permissions.includes(requiredPermission)) {
    return children;
  }

  return <Navigate to="/unauthorized" />;
};

export default RouteProtection;
