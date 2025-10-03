// import React, { createContext, useState, useEffect } from 'react';

// const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// export const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const [loading, setLoading] = useState(true);

//   // Check if user is already logged in on app start
//   useEffect(() => {
//     const token = localStorage.getItem('token');
//     const storedUser = localStorage.getItem('userProfile');
    
//     if (token && storedUser) {
//       try {
//         const parsedUser = JSON.parse(storedUser);
//         setUser(parsedUser);
//         setIsAuthenticated(true);
//       } catch (error) {
//         console.error('Error parsing stored user:', error);
//         // Clear invalid data
//         localStorage.removeItem('token');
//         localStorage.removeItem('userId');
//         localStorage.removeItem('userProfile');
//       }
//     }
//     setLoading(false);
//   }, []);

//   const login = async (email, password) => {
//     try {
//       const response = await fetch(`${BACKEND_URL}/login`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ email, password }),
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.detail || 'Login failed');
//       }

//       const data = await response.json();
//       console.log('Login response:', data);

//       // Store the token
//       localStorage.setItem('token', data.access_token);
      
//       // Store the user ID and complete profile data - THIS WAS MISSING!
//       localStorage.setItem('userId', data.user.id);
//       localStorage.setItem('userProfile', JSON.stringify(data.user));

//       console.log('Stored in localStorage:');
//       console.log('- Token:', data.access_token);
//       console.log('- UserId:', data.user.id);
//       console.log('- UserProfile:', data.user);

//       // Update state
//       setUser(data.user);
//       setIsAuthenticated(true);

//       return data;
//     } catch (error) {
//       console.error('Login error:', error);
//       throw error;
//     }
//   };

//   const logout = () => {
//     // Clear localStorage
//     localStorage.removeItem('token');
//     localStorage.removeItem('userId');
//     localStorage.removeItem('userProfile');
    
//     // Clear state
//     setUser(null);
//     setIsAuthenticated(false);
//   };

//   const value = {
//     user,
//     isAuthenticated,
//     loading,
//     login,
//     logout,
//   };

//   return (
//     <AuthContext.Provider value={value}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

//  export default AuthProvider;

import React, { createContext, useState, useEffect } from 'react';

const BACKEND_URL =  `${import.meta.env.VITE_BACKEND_URL}`;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

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
        logout();
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
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
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('userId', data.user.id);
      localStorage.setItem('userProfile', JSON.stringify(data.user));
      localStorage.setItem('userRole', data.user.role);

      setUser({ ...data.user });
      setIsAuthenticated(true);

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userProfile');
    localStorage.removeItem('userRole');
    setUser(null);
    setIsAuthenticated(false);
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
