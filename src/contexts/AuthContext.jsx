import React, { createContext, useState, useEffect, useCallback } from 'react';

const BACKEND_URL = `${import.meta.env.VITE_BACKEND_URL}`;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Memoize logout to avoid dependency issues
  const logout = useCallback(() => {
    console.log('🚪 Logging out, clearing all data');
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userProfile');
    localStorage.removeItem('userRole');
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      console.log('🔄 [AuthContext] Initializing auth...');
      
      // Add a small initial delay to ensure all components are mounted
      await new Promise(resolve => setTimeout(resolve, 50));
      
      try {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('userProfile');
        
        console.log('🔍 [AuthContext] Checking localStorage:', {
          hasToken: !!token,
          hasStoredUser: !!storedUser,
          storedUserPreview: storedUser ? storedUser.substring(0, 50) + '...' : null
        });
        
        if (token && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          console.log('✅ [AuthContext] User restored from localStorage:', {
            email: parsedUser.email,
            role: parsedUser.role,
            id: parsedUser.id
          });
          
          setUser(parsedUser);
          setIsAuthenticated(true);
          
          // Add a delay to ensure state propagation before loading completes
          await new Promise(resolve => setTimeout(resolve, 150));
        } else {
          console.log('❌ [AuthContext] No stored auth found');
        }
      } catch (error) {
        console.error('❌ [AuthContext] Error initializing auth:', error);
        logout();
      } finally {
        setLoading(false);
        console.log('✅ [AuthContext] Auth initialization complete, loading set to false');
      }
    };

    initializeAuth();
  }, [logout]);

  const login = async (email, password) => {
    try {
      console.log('🔐 [AuthContext] Attempting login for:', email);
      const response = await fetch(`${BACKEND_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed');
      }

      const data = await response.json();
      
      console.log('✅ [AuthContext] Login successful, storing data');
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('userId', data.user.id);
      localStorage.setItem('userProfile', JSON.stringify(data.user));
      localStorage.setItem('userRole', data.user.role);

      setUser({ ...data.user });
      setIsAuthenticated(true);

      console.log('✅ [AuthContext] User state updated:', data.user.email);
      return data;
    } catch (error) {
      console.error('❌ [AuthContext] Login error:', error);
      throw error;
    }
  };

  // Forgot Password
  const requestPasswordReset = async (email) => {
    try {
      const response = await fetch(`${BACKEND_URL}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Request failed');

      return data;
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  };

  // Reset Password
  const resetPassword = async (token, newPassword) => {
    try {
      const response = await fetch(`${BACKEND_URL}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: newPassword }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Reset failed');

      return data;
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        login,
        logout,
        requestPasswordReset,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;