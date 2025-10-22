import React, { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { Box, Typography, Paper, Button, CircularProgress } from "@mui/material";
import { Block } from "@mui/icons-material";

const withAuthCheck = (WrappedComponent, allowedRoles = []) => {
  return function AuthenticatedComponent(props) {
    const { user, loading } = useContext(AuthContext);
    const location = useLocation();

    // Show loading indicator while auth is being initialized
    if (loading) {
      return (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh' 
        }}>
          <CircularProgress size={48} />
        </Box>
      );
    }

    // Redirect to login if not authenticated
    if (!user) {
      console.log('🔒 No user found, redirecting to login from:', location.pathname);
      return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    // Check role-based access
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      console.log('🚫 Access denied. User role:', user.role, 'Required:', allowedRoles);
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

    console.log('✅ Auth check passed for:', location.pathname, 'User:', user.email);
    return <WrappedComponent {...props} />;
  };
};

export default withAuthCheck;