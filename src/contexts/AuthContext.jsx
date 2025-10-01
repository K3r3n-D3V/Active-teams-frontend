// import React, { createContext, useState, useEffect, useCallback } from "react";
// import { login as loginService, logout as logoutService, refreshToken as refreshTokenService } from "../services/authService";

// export const AuthContext = createContext();

// const ACCESS_TOKEN_KEY = "accessToken";
// const REFRESH_TOKEN_ID_KEY = "refreshTokenId";
// const REFRESH_TOKEN_KEY = "refreshToken";

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [accessToken, setAccessToken] = useState(localStorage.getItem(ACCESS_TOKEN_KEY));
//   const [refreshTokenId, setRefreshTokenId] = useState(localStorage.getItem(REFRESH_TOKEN_ID_KEY));
//   const [refreshTokenValue, setRefreshTokenValue] = useState(localStorage.getItem(REFRESH_TOKEN_KEY));
//   const [loading, setLoading] = useState(true);

//   const saveTokens = (accessToken, refreshTokenId, refreshTokenValue) => {
//     localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
//     localStorage.setItem(REFRESH_TOKEN_ID_KEY, refreshTokenId);
//     localStorage.setItem(REFRESH_TOKEN_KEY, refreshTokenValue);
//     setAccessToken(accessToken);
//     setRefreshTokenId(refreshTokenId);
//     setRefreshTokenValue(refreshTokenValue);
//   };

//   const clearTokens = () => {
//     localStorage.removeItem(ACCESS_TOKEN_KEY);
//     localStorage.removeItem(REFRESH_TOKEN_ID_KEY);
//     localStorage.removeItem(REFRESH_TOKEN_KEY);
//     setAccessToken(null);
//     setRefreshTokenId(null);
//     setRefreshTokenValue(null);
//   };

//   const parseJwt = (token) => {
//     if (!token) return null;
//     try {
//       const base64Url = token.split(".")[1];
//       const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
//       const jsonPayload = decodeURIComponent(
//         atob(base64)
//           .split("")
//           .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
//           .join("")
//       );
//       return JSON.parse(jsonPayload);
//     } catch {
//       return null;
//     }
//   };

//   const handleLogin = async (email, password) => {
//     setLoading(true);
//     try {
//       const data = await loginService(email, password);
//       saveTokens(data.access_token, data.refresh_token_id, data.refresh_token);
//       const userPayload = parseJwt(data.access_token);
//       setUser(userPayload);
//       return true;
//     } catch (error) {
//       console.error("Login error:", error);
//       throw error;
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleLogout = async () => {
//     try {
//       if (accessToken) await logoutService(accessToken);
//     } catch (error) {
//       console.error("Logout error:", error);
//     } finally {
//       clearTokens();
//       setUser(null);
//     }
//   };

//   const refreshAccessToken = useCallback(async () => {
//     if (!refreshTokenId || !refreshTokenValue) {
//       await handleLogout();
//       return;
//     }
//     try {
//       const data = await refreshTokenService(refreshTokenId, refreshTokenValue);
//       saveTokens(data.access_token, data.refresh_token_id, data.refresh_token);
//       const userPayload = parseJwt(data.access_token);
//       setUser(userPayload);
//       return data.access_token;
//     } catch (error) {
//       console.error("Refresh token error:", error);
//       await handleLogout();
//     }
//   }, [refreshTokenId, refreshTokenValue]);

//   useEffect(() => {
//     const checkToken = async () => {
//       try {
//         if (!accessToken) return;
//         const payload = parseJwt(accessToken);
//         if (!payload?.exp) {
//           await handleLogout();
//           return;
//         }
//         const expiresAt = payload.exp * 1000;
//         if (Date.now() >= expiresAt) {
//           await refreshAccessToken();
//         } else {
//           setUser(payload);
//         }
//       } catch (error) {
//         console.error("Token check error:", error);
//         await handleLogout();
//       } finally {
//         setLoading(false);
//       }
//     };
//     checkToken();
//   }, [accessToken, refreshAccessToken]);

//   // NEW: Update profile picture
//   const updateProfilePic = (newPic) => {
//     setUser((prev) => (prev ? { ...prev, profilePic: newPic } : prev));
//   };

//   return (
//     <AuthContext.Provider
//       value={{
//         user,
//         accessToken,
//         loading,
//         login: handleLogin,
//         logout: handleLogout,
//         refreshAccessToken,
//         updateProfilePic, // <- include this
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export default AuthProvider;


// AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in on app start
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('userProfile');
    
    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        // Clear invalid data
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('userProfile');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch(`${BACKEND_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed');
      }

      const data = await response.json();
      console.log('Login response:', data);

      // Store the token
      localStorage.setItem('token', data.access_token);
      
      // Store the user ID and complete profile data - THIS WAS MISSING!
      localStorage.setItem('userId', data.user.id);
      localStorage.setItem('userProfile', JSON.stringify(data.user));

      console.log('Stored in localStorage:');
      console.log('- Token:', data.access_token);
      console.log('- UserId:', data.user.id);
      console.log('- UserProfile:', data.user);

      // Update state
      setUser(data.user);
      setIsAuthenticated(true);

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userProfile');
    
    // Clear state
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

 export default AuthProvider;