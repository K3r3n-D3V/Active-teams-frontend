// import React, { useContext } from "react";
// import { Navigate, useLocation } from "react-router-dom";
// import { AuthContext } from "../contexts/AuthContext";

// const withAuthCheck = (WrappedComponent) => {
//   return function AuthenticatedComponent(props) {
//     const { user, loading } = useContext(AuthContext);
//     const location = useLocation();

//     if (loading) return null; // ✅ wait until user is restored

//     if (!user) {
//       return <Navigate to="/login" state={{ from: location.pathname }} replace />;
//     }

//     return <WrappedComponent {...props} />;
//   };
// };

// export default withAuthCheck;


import React, { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { Box, Typography, Paper, Button } from "@mui/material";
import { Block } from "@mui/icons-material";

const withAuthCheck = (WrappedComponent, allowedRoles = []) => {
  return function AuthenticatedComponent(props) {
    const { user, loading } = useContext(AuthContext);
    const location = useLocation();

    if (loading) return null;

    if (!user) {
      return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    // Check role-based access
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      return (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh', 
          bgcolor: '#f5f5f5', 
          p: 3 
        }}>
          <Paper sx={{ p: 4, maxWidth: 500, textAlign: 'center' }}>
            <Block sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Access Denied
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
              You don't have permission to access this page.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Your role: <strong>{user.role || 'unknown'}</strong><br />
              Required: <strong>{allowedRoles.join(' or ')}</strong>
            </Typography>
            <Button variant="contained" onClick={() => window.location.href = '/'}>
              Go to Home
            </Button>
          </Paper>
        </Box>
      );
    }

    return <WrappedComponent {...props} />;
  };
};

export default withAuthCheck;