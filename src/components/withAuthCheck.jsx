import React, { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

const withAuthCheck = (WrappedComponent) => {
  return function AuthenticatedComponent(props) {
    const { user, loading } = useContext(AuthContext);
    const location = useLocation();

    if (loading) return null; // ✅ wait until user is restored

    if (!user) {
      return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    return <WrappedComponent {...props} />;
  };
};

export default withAuthCheck;
