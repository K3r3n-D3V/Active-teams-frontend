import React, { createContext, useState, useEffect, useCallback } from 'react';

const BACKEND_URL = `${import.meta.env.VITE_BACKEND_URL}`;

// Gender-based default avatars
const DEFAULT_AVATARS = {
  female: "https://cdn-icons-png.flaticon.com/512/6997/6997662.png",
  male: "https://cdn-icons-png.flaticon.com/512/6997/6997675.png",
  neutral: "https://cdn-icons-png.flaticon.com/512/147/147144.png"
};

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Helper function to get default avatar based on gender
  const getDefaultAvatar = (userData) => {
    if (!userData) return DEFAULT_AVATARS.neutral;
    
    const gender = userData.gender?.toLowerCase();
    if (gender === 'female') {
      return DEFAULT_AVATARS.female;
    } else if (gender === 'male') {
      return DEFAULT_AVATARS.male;
    } else {
      return DEFAULT_AVATARS.neutral;
    }
  };

  // Helper to ensure user has profile_picture from multiple possible sources
  const ensureUserWithAvatar = (userData) => {
    if (!userData) return null;
    
    // Check multiple possible sources for profile picture
    const profilePicture = userData.profile_picture || 
                          userData.avatarUrl || 
                          userData.profilePicUrl ||
                          localStorage.getItem('profilePic') ||
                          getDefaultAvatar(userData);
    
    return {
      ...userData,
      profile_picture: profilePicture,
      avatarUrl: profilePicture,
      profilePicUrl: profilePicture
    };
  };

  // Memoize logout to avoid dependency issues
  const logout = useCallback(() => {
    console.log('🚪 Logging out, clearing all data');
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userProfile');
    localStorage.removeItem('userRole');
    localStorage.removeItem('profilePic');
    localStorage.removeItem('leaders');
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  // Enhanced update profile picture function
  const updateProfilePicture = useCallback((newPictureUrl) => {
    console.log('🔄 Updating profile picture in AuthContext:', newPictureUrl);
    
    if (user) {
      const updatedUser = ensureUserWithAvatar({
        ...user,
        profile_picture: newPictureUrl,
        avatarUrl: newPictureUrl,
        profilePicUrl: newPictureUrl
      });
      
      setUser(updatedUser);
      
      // Update localStorage for both user profile and standalone picture
      localStorage.setItem('userProfile', JSON.stringify(updatedUser));
      localStorage.setItem('profilePic', newPictureUrl);
      
      console.log('✅ Profile picture updated in AuthContext and localStorage');
    }
  }, [user]);

  // Sync with localStorage changes (for cross-tab synchronization)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'userProfile' || e.key === 'profilePic') {
        console.log('🔄 Storage change detected, updating AuthContext');
        const storedUser = localStorage.getItem('userProfile');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          const userWithAvatar = ensureUserWithAvatar(parsedUser);
          setUser(userWithAvatar);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Initialize auth from localStorage on mount
  useEffect(() => {
    const initializeAuth = () => {
      console.log('🔄 [AuthContext] Initializing auth...');
      
      try {
        const token = localStorage.getItem('token');
        let storedUser = localStorage.getItem('userProfile');
        
        console.log('🔍 [AuthContext] Checking localStorage:', {
          hasToken: !!token,
          hasStoredUser: !!storedUser,
          hasProfilePic: !!localStorage.getItem('profilePic'),
          rawStoredUser: storedUser
        });
        
        if (token && storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            const userWithAvatar = ensureUserWithAvatar(parsedUser);
            
            console.log('✅ [AuthContext] User restored from localStorage:', {
              email: userWithAvatar.email,
              role: userWithAvatar.role,
              hasProfilePicture: !!userWithAvatar.profile_picture,
              profilePicture: userWithAvatar.profile_picture
            });
            
            setUser(userWithAvatar);
            setIsAuthenticated(true);
            
            // Ensure localStorage is consistent
            localStorage.setItem('userProfile', JSON.stringify(userWithAvatar));
            if (userWithAvatar.profile_picture) {
              localStorage.setItem('profilePic', userWithAvatar.profile_picture);
            }
          } catch (parseError) {
            console.error('❌ [AuthContext] Error parsing stored user:', parseError);
            logout();
          }
        } else if (token && !storedUser) {
          console.log('⚠️ [AuthContext] Token exists but no userProfile - this should not happen!');
          console.log('⚠️ [AuthContext] Logging out to force re-authentication');
          logout();
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
      console.log("LOGIN DATA", data);
      
      // FIX: Merge user and leaders data properly
      const mergedUserData = {
        ...data.user,
        ...(data.leaders || {})
      };
      
      // Ensure user has profile picture from multiple sources
      const userWithAvatar = ensureUserWithAvatar(mergedUserData);
      
      console.log('📦 [AuthContext] Prepared user data:', {
        email: userWithAvatar.email,
        role: userWithAvatar.role,
        id: userWithAvatar.id,
        hasProfilePicture: !!userWithAvatar.profile_picture
      });
      
      // Store in localStorage - CRITICAL: Store all data
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('userId', data.user.id);
      localStorage.setItem('userProfile', JSON.stringify(userWithAvatar));
      localStorage.setItem('userRole', data.user.role);
      
      if (data.leaders) {
        localStorage.setItem('leaders', JSON.stringify(data.leaders));
      }
      if (data.isLeader !== undefined) {
        localStorage.setItem('isLeader', JSON.stringify(data.isLeader));
      }
      
      // Also store profile picture separately for easy access
      if (userWithAvatar.profile_picture) {
        localStorage.setItem('profilePic', userWithAvatar.profile_picture);
      }

      // Verify localStorage write was successful
      const verifyStore = localStorage.getItem('userProfile');
      console.log('✅ [AuthContext] Verify localStorage write:', {
        stored: !!verifyStore,
        length: verifyStore?.length
      });

      setUser(userWithAvatar);
      setIsAuthenticated(true);

      console.log('✅ [AuthContext] User state updated:', {
        email: userWithAvatar.email,
        role: userWithAvatar.role,
        hasProfilePicture: !!userWithAvatar.profile_picture
      });
      
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
        updateProfilePicture,
        getDefaultAvatar,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;