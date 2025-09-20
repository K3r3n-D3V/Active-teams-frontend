// import React, { useContext, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { AuthContext } from "../contexts/AuthContext";

// const withAuthCheck = (WrappedComponent) => {
//   return function AuthenticatedComponent(props) {
//     const { user, loading } = useContext(AuthContext);
//     const navigate = useNavigate();

//     useEffect(() => {
//       if (!loading && !user) {
//         navigate("/login");
//       }
//     }, [user, loading, navigate]);

//     if (loading || !user) {
//       return <p>Loading...</p>;
//     }

//     return <WrappedComponent {...props} />;
//   };
// };

// export default withAuthCheck;
// components/withAuthCheck.js
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
