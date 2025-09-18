// AuthContext.jsx
import React, { createContext, useState, useEffect } from "react";

// const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const BACKEND_URL = "http://localhost:8000"; // Adjust as needed

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // --- JWT decoder ---
  const parseJwt = (token) => {
    if (!token) return null;
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch (err) {
      console.error("JWT parse error:", err);
      return null;
    }
  };

  // Check if user is already logged in on app start
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("userProfile");

    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Error parsing stored user:", error);
        // Clear invalid data
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        localStorage.removeItem("userProfile");
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch(`${BACKEND_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Login failed");
      }

      const data = await response.json();
      console.log("Login response:", data);

      // Decode JWT to extract user info
      const decoded = parseJwt(data.access_token);
      const userProfile = {
        id: decoded?.user_id,
        email: decoded?.email,
        role: decoded?.role,
      };

      if (!userProfile.id) {
        throw new Error("User data missing from access token");
      }

      // Store the token and user info
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("userId", userProfile.id);
      localStorage.setItem("userProfile", JSON.stringify(userProfile));

      console.log("Stored in localStorage:");
      console.log("- Token:", data.access_token);
      console.log("- UserId:", userProfile.id);
      console.log("- UserProfile:", userProfile);

      // Update state
      setUser(userProfile);
      setIsAuthenticated(true);

      return data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const logout = () => {
    // Clear localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userProfile");

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
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};

export default AuthProvider;
