import React, { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

const withAuthCheck = (WrappedComponent) => {
  return function AuthenticatedComponent(props) {
    const { user, loading } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
      if (!loading && !user) {
        navigate("/login");
      }
    }, [user, loading, navigate]);

    if (loading || !user) {
      return <p>Loading...</p>;
    }

    return <WrappedComponent {...props} />;
  };
};

export default withAuthCheck;
