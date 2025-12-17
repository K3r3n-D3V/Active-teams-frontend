import React, { createContext, useState, useEffect, useCallback } from 'react';

const BACKEND_URL = `${import.meta.env.VITE_BACKEND_URL}` || 'http://localhost:8000';

const KEY_ACCESS = 'access_token';
const KEY_REFRESH = 'refresh_token';
const KEY_REFRESH_ID = 'refresh_token_id';
const KEY_USER = 'userProfile';
const KEY_PROFILE_PIC = 'profilePic';
const KEY_LEADERS = 'leaders';
const KEY_IS_LEADER = 'isLeader';

const DEFAULT_AVATARS = {
  female: 'https://cdn-icons-png.flaticon.com/512/6997/6997662.png',
  male: 'https://cdn-icons-png.flaticon.com/512/6997/6997675.png',
  neutral: 'https://cdn-icons-png.flaticon.com/512/147/147144.png'
};

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshInProgress, setRefreshInProgress] = useState(false);
  const [leaders, setLeaders] = useState(null);
  const [isLeader, setIsLeader] = useState(false);

  const getDefaultAvatar = (userData) => {
    if (!userData) return DEFAULT_AVATARS.neutral;
    const gender = userData.gender?.toLowerCase();
    if (gender === 'female') return DEFAULT_AVATARS.female;
    if (gender === 'male') return DEFAULT_AVATARS.male;
    return DEFAULT_AVATARS.neutral;
  };

  const ensureUserWithAvatar = (userData) => {
    if (!userData) return null;
    const profilePicture = userData.profile_picture || 
                          userData.avatarUrl || 
                          userData.profilePicUrl || 
                          localStorage.getItem(KEY_PROFILE_PIC) || 
                          getDefaultAvatar(userData);
    return {
      ...userData,
      profile_picture: profilePicture,
      avatarUrl: profilePicture,
      profilePicUrl: profilePicture
    };
  };

  // Decode JWT and check expiry
  const isTokenExpired = (token) => {
    if (!token) return true;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return true;
      const payload = JSON.parse(atob(parts[1]));
      if (!payload.exp) return true;
      return payload.exp * 1000 < Date.now();
    } catch (e) {
      return true;
    }
  };

  const persistUser = (u) => {
    if (!u) {
      localStorage.removeItem(KEY_USER);
      return;
    }
    const withAvatar = ensureUserWithAvatar(u);
    localStorage.setItem(KEY_USER, JSON.stringify(withAvatar));
    if (withAvatar.profile_picture) {
      localStorage.setItem(KEY_PROFILE_PIC, withAvatar.profile_picture);
    }
  };

  const persistLeadersData = (leadersData, leaderStatus) => {
    if (leadersData) {
      localStorage.setItem(KEY_LEADERS, JSON.stringify(leadersData));
      setLeaders(leadersData);
    }
    
    if (leaderStatus !== undefined) {
      localStorage.setItem(KEY_IS_LEADER, JSON.stringify(leaderStatus));
      setIsLeader(leaderStatus);
    }
  };

  const login = async (email, password) => {
    const res = await fetch(`${BACKEND_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Login failed');
    }

    const data = await res.json();
    
    console.log(' [AuthContext] Login successful, storing data');
    console.log("LOGIN DATA", data);
    
    // Store tokens
    localStorage.setItem(KEY_ACCESS, data.access_token);
    localStorage.setItem(KEY_REFRESH, data.refresh_token);
    localStorage.setItem(KEY_REFRESH_ID, data.refresh_token_id);
    
    // Store user data
    const mergedUserData = {
      ...data.user,
      ...(data.leaders || {})
    };
    
    const userWithAvatar = ensureUserWithAvatar(mergedUserData);
    
    console.log('📦 [AuthContext] Prepared user data:', {
      email: userWithAvatar.email,
      role: userWithAvatar.role,
      id: userWithAvatar.id,
      hasProfilePicture: !!userWithAvatar.profile_picture
    });
    
    // Persist user data
    persistUser(userWithAvatar);
    
    // Store leaders and isLeader data
    persistLeadersData(data.leaders, data.isLeader);
    
    // Also store profile picture separately for easy access
    if (userWithAvatar.profile_picture) {
      localStorage.setItem(KEY_PROFILE_PIC, userWithAvatar.profile_picture);
    }

    // Verify localStorage write was successful
    const verifyStore = localStorage.getItem(KEY_USER);
    console.log(' [AuthContext] Verify localStorage write:', {
      stored: !!verifyStore,
      length: verifyStore?.length
    });

    setUser(userWithAvatar);
    setIsAuthenticated(true);

    console.log(' [AuthContext] User state updated:', {
      email: userWithAvatar.email,
      role: userWithAvatar.role,
      hasProfilePicture: !!userWithAvatar.profile_picture,
      isLeader: data.isLeader,
      hasLeaders: !!data.leaders
    });
    
    return data;
  };

  const logout = useCallback(() => {
    console.log('🚪 Logging out, clearing all data');
    localStorage.removeItem(KEY_ACCESS);
    localStorage.removeItem(KEY_REFRESH);
    localStorage.removeItem(KEY_REFRESH_ID);
    localStorage.removeItem(KEY_USER);
    localStorage.removeItem(KEY_PROFILE_PIC);
    localStorage.removeItem(KEY_LEADERS);
    localStorage.removeItem(KEY_IS_LEADER);
    setUser(null);
    setLeaders(null);
    setIsLeader(false);
    setIsAuthenticated(false);
  }, []);

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
      persistUser(updatedUser);
      console.log(' Profile picture updated in AuthContext and localStorage');
    }
  }, [user]);

  // Sync with localStorage changes (for cross-tab synchronization)
  useEffect(() => {
    const handleStorageChange = (e) => {
      console.log('🔄 Storage change detected:', e.key);
      
      if (e.key === KEY_USER || e.key === KEY_PROFILE_PIC) {
        const storedUser = localStorage.getItem(KEY_USER);
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            const userWithAvatar = ensureUserWithAvatar(parsedUser);
            setUser(userWithAvatar);
          } catch (error) {
            console.error('❌ Error parsing user from storage:', error);
          }
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      
      if (e.key === KEY_LEADERS) {
        const storedLeaders = localStorage.getItem(KEY_LEADERS);
        if (storedLeaders) {
          try {
            setLeaders(JSON.parse(storedLeaders));
          } catch (error) {
            console.error('❌ Error parsing leaders from storage:', error);
          }
        } else {
          setLeaders(null);
        }
      }
      
      if (e.key === KEY_IS_LEADER) {
        const storedIsLeader = localStorage.getItem(KEY_IS_LEADER);
        if (storedIsLeader) {
          try {
            setIsLeader(JSON.parse(storedIsLeader));
          } catch (error) {
            console.error('❌ Error parsing isLeader from storage:', error);
          }
        } else {
          setIsLeader(false);
        }
      }

      if (e.key === KEY_ACCESS && e.newValue == null) {
        setUser(null);
        setIsAuthenticated(false);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const attemptRefresh = async () => {
    const refresh = localStorage.getItem(KEY_REFRESH);
    const refreshId = localStorage.getItem(KEY_REFRESH_ID);
    if (!refresh || !refreshId) return false;

    if (refreshInProgress) return false;
    setRefreshInProgress(true);

    try {
      const res = await fetch(`${BACKEND_URL}/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refresh, refresh_token_id: refreshId })
      });

      if (!res.ok) {
        logout();
        return false;
      }

      const data = await res.json();
      localStorage.setItem(KEY_ACCESS, data.access_token);
      localStorage.setItem(KEY_REFRESH, data.refresh_token);
      localStorage.setItem(KEY_REFRESH_ID, data.refresh_token_id);
      return true;
    } catch (e) {
      console.error('Refresh attempt error', e);
      logout();
      return false;
    } finally {
      setRefreshInProgress(false);
    }
  };

  const authFetch = useCallback(async (url, options = {}) => {
    const makeRequest = async (token) => {
      const headers = {
        ...(options.headers || {}),
        'Content-Type': 'application/json'
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      return fetch(url, { ...options, headers });
    };

    const accessToken = localStorage.getItem(KEY_ACCESS);

    if (accessToken && isTokenExpired(accessToken)) {
      const refreshed = await attemptRefresh();
      if (!refreshed) return new Response(null, { status: 401, statusText: 'Unauthorized' });
    }

    let tokenToUse = localStorage.getItem(KEY_ACCESS);
    let res = await makeRequest(tokenToUse);

    if (res.status !== 401) return res;

    const refreshed = await attemptRefresh();
    if (!refreshed) return res; // still failing

    tokenToUse = localStorage.getItem(KEY_ACCESS);
    res = await makeRequest(tokenToUse);
    return res;
  }, [refreshInProgress, attemptRefresh]);

  // Initialize auth from localStorage on mount
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('🔄 [AuthContext] Initializing auth...');
        
        const access = localStorage.getItem(KEY_ACCESS);
        const storedUser = localStorage.getItem(KEY_USER);
        const storedLeaders = localStorage.getItem(KEY_LEADERS);
        const storedIsLeader = localStorage.getItem(KEY_IS_LEADER);
        
        console.log('🔍 [AuthContext] Checking localStorage:', {
          hasToken: !!access,
          hasStoredUser: !!storedUser,
          hasProfilePic: !!localStorage.getItem(KEY_PROFILE_PIC),
          hasLeaders: !!storedLeaders,
          hasIsLeader: !!storedIsLeader
        });
        
        if (access && isTokenExpired(access)) {
          const refreshed = await attemptRefresh();
          if (!refreshed) {
            if (mounted) {
              logout();
              setLoading(false);
            }
            return;
          }
        }

        if (!localStorage.getItem(KEY_ACCESS) && localStorage.getItem(KEY_REFRESH) && localStorage.getItem(KEY_REFRESH_ID)) {
          const refreshed = await attemptRefresh();
          if (!refreshed) {
            if (mounted) logout();
            setLoading(false);
            return;
          }
        }

        const finalAccess = localStorage.getItem(KEY_ACCESS);
        const finalUser = storedUser ? ensureUserWithAvatar(JSON.parse(storedUser)) : null;
        
        // Load leaders data if available
        if (storedLeaders) {
          try {
            setLeaders(JSON.parse(storedLeaders));
          } catch (error) {
            console.error('❌ Error parsing leaders data:', error);
          }
        }
        
        // Load isLeader data if available
        if (storedIsLeader) {
          try {
            setIsLeader(JSON.parse(storedIsLeader));
          } catch (error) {
            console.error('❌ Error parsing isLeader data:', error);
          }
        }

        if (finalAccess && finalUser) {
          if (mounted) {
            setUser(finalUser);
            setIsAuthenticated(true);
            
            console.log(' [AuthContext] User restored from localStorage:', {
              email: finalUser.email,
              role: finalUser.role,
              isLeader: JSON.parse(storedIsLeader || 'false'),
              hasLeaders: !!storedLeaders,
              hasProfilePicture: !!finalUser.profile_picture
            });
          }
        } else if (finalAccess && !finalUser) {
          console.log('⚠️ [AuthContext] Token exists but no userProfile - logging out');
          if (mounted) logout();
        } else {
          console.log('❌ [AuthContext] No stored auth found');
        }
      } catch (error) {
        console.error('❌ [AuthContext] Error initializing auth:', error);
        logout();
      } finally {
        if (mounted) {
          setLoading(false);
          console.log(' [AuthContext] Auth initialization complete, loading set to false');
        }
      }
    };

    initializeAuth();

    return () => { mounted = false; };
  }, [logout]);

  // Listen for force logout events
  useEffect(() => {
    const handler = () => logout();
    window.addEventListener('force-logout', handler);
    return () => window.removeEventListener('force-logout', handler);
  }, [logout]);

  const setUserAndPersist = (u) => {
    const withAvatar = ensureUserWithAvatar(u);
    setUser(withAvatar);
    setIsAuthenticated(true);
    persistUser(withAvatar);
  };

  const setLeadersData = (leadersData, leaderStatus) => {
    persistLeadersData(leadersData, leaderStatus);
  };

  const requestPasswordReset = async (email) => {
    try {
      const res = await fetch(`${BACKEND_URL}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || err.message || 'Failed to request password reset');
      }

      const data = await res.json();
      return data;
    } catch (error) {
      console.error('Password reset request error:', error);
      throw error;
    }
  };

  const resetPassword = async (token, newPassword) => {
    try {
      const res = await fetch(`${BACKEND_URL}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: newPassword })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || err.message || 'Failed to reset password');
      }

      const data = await res.json();
      return data;
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      loading,
      leaders,
      isLeader,
      login,
      logout,
      authFetch,
      updateProfilePicture,
      getDefaultAvatar,
      setUser: setUserAndPersist,
      setLeaders: setLeadersData,
      attemptRefresh,
      requestPasswordReset,
      resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;