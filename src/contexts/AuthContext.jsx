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

  const isTokenExpired = (token) => {
    if (!token) return true;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return true;
      const payload = JSON.parse(atob(parts[1]));
      if (!payload.exp) return true;
      const bufferTime = 60 * 1000;
      return payload.exp * 1000 < Date.now() + bufferTime;
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

  const logout = useCallback(() => {
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

 
  const attemptRefresh = useCallback(async () => {
  const refresh = localStorage.getItem(KEY_REFRESH);
  const refreshId = localStorage.getItem(KEY_REFRESH_ID);
  
  if (!refresh || !refreshId) {
    console.error(' No refresh token or refresh ID found');
    logout();
    return false;
  }

  if (refreshInProgress) {
    console.log('⏳ Refresh already in progress, skipping...');
    return false;
  }
  
  setRefreshInProgress(true);

  try {
    console.log(' Attempting token refresh...');
    const res = await fetch(`${BACKEND_URL}/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        refresh_token: refresh, 
        refresh_token_id: refreshId 
      })
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error(' Token refresh failed:', res.status, errorData);
      
      if (res.status === 401 || res.status === 403) {
        logout();
      }
      
      return false;
    }

    const data = await res.json();
    console.log(' Token refresh successful');
    
    localStorage.setItem(KEY_ACCESS, data.access_token);
    localStorage.setItem(KEY_REFRESH, data.refresh_token);
    localStorage.setItem(KEY_REFRESH_ID, data.refresh_token_id);
    
    return true;
  } catch (e) {
    console.error(' Refresh attempt error:', e);
    return false;
  } finally {
    setRefreshInProgress(false);
  }
}, [refreshInProgress, logout]);


  const authFetch = useCallback(async (url, options = {}) => {
  let accessToken = localStorage.getItem(KEY_ACCESS);
  
  // Check if token is expired
  if (accessToken && isTokenExpired(accessToken)) {
    console.log(' Access token expired, attempting refresh...');
    const refreshed = await attemptRefresh();
    if (!refreshed) {
      console.error(' Token refresh failed during pre-check');
      // Don't logout here - let the calling code handle it
      throw new Error('Token refresh failed');
    }
    accessToken = localStorage.getItem(KEY_ACCESS);
  }

  const headers = {
    ...(options.headers || {}),
    'Content-Type': 'application/json'
  };
  
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  try {
    const res = await fetch(url, { ...options, headers });
    
    // Only try refresh once on 401
    if (res.status === 401 && !refreshInProgress) {
      console.log(' Got 401, attempting token refresh...');
      const refreshed = await attemptRefresh();
      
      if (refreshed) {
        const newToken = localStorage.getItem(KEY_ACCESS);
        headers['Authorization'] = `Bearer ${newToken}`;
        const retryRes = await fetch(url, { ...options, headers });
        
        // If still 401 after refresh, it's a permission/auth issue
        if (retryRes.status === 401) {
          console.warn(' Still 401 after token refresh - likely auth expired completely');
          // Only NOW should we consider logging out
          logout();
          throw new Error('Authentication expired');
        }
        
        return retryRes;
      } else {
        // Refresh failed - session is truly dead
        console.error(' Token refresh failed on 401 retry');
        logout();
        throw new Error('Authentication failed - please log in again');
      }
    }
    
    return res;
  } catch (error) {
    console.error('authFetch error:', error);
    
    // Only logout on specific auth failures, not network errors
    if (error.message && (
      error.message.includes('Authentication expired') || 
      error.message.includes('Authentication failed')
    )) {
      // Already logged out above
    }
    
    throw error;
  }
}, [refreshInProgress, attemptRefresh, logout]);

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
    
    localStorage.setItem(KEY_ACCESS, data.access_token);
    localStorage.setItem(KEY_REFRESH, data.refresh_token);
    localStorage.setItem(KEY_REFRESH_ID, data.refresh_token_id);
    
    const mergedUserData = {
      ...data.user,
      ...(data.leaders || {})
    };
    
    const userWithAvatar = ensureUserWithAvatar(mergedUserData);
    
    persistUser(userWithAvatar);
    persistLeadersData(data.leaders, data.isLeader);
    
    if (userWithAvatar.profile_picture) {
      localStorage.setItem(KEY_PROFILE_PIC, userWithAvatar.profile_picture);
    }

    setUser(userWithAvatar);
    setIsAuthenticated(true);
    
    return data;
  };

  const updateProfilePicture = useCallback((newPictureUrl) => {
    if (user) {
      const updatedUser = ensureUserWithAvatar({ 
        ...user, 
        profile_picture: newPictureUrl, 
        avatarUrl: newPictureUrl, 
        profilePicUrl: newPictureUrl 
      });
      setUser(updatedUser);
      persistUser(updatedUser);
    }
  }, [user]);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === KEY_USER || e.key === KEY_PROFILE_PIC) {
        const storedUser = localStorage.getItem(KEY_USER);
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            const userWithAvatar = ensureUserWithAvatar(parsedUser);
            setUser(userWithAvatar);
          } catch (error) {
            console.error('Error parsing user from storage:', error);
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
            console.error('Error parsing leaders from storage:', error);
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
            console.error('Error parsing isLeader from storage:', error);
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

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const access = localStorage.getItem(KEY_ACCESS);
        const storedUser = localStorage.getItem(KEY_USER);
        const storedLeaders = localStorage.getItem(KEY_LEADERS);
        const storedIsLeader = localStorage.getItem(KEY_IS_LEADER);
        
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
        
        if (storedLeaders) {
          try {
            setLeaders(JSON.parse(storedLeaders));
          } catch (error) {
            console.error('Error parsing leaders data:', error);
          }
        }
        
        if (storedIsLeader) {
          try {
            setIsLeader(JSON.parse(storedIsLeader));
          } catch (error) {
            console.error('Error parsing isLeader data:', error);
          }
        }

        if (finalAccess && finalUser) {
          if (mounted) {
            setUser(finalUser);
            setIsAuthenticated(true);
          }
        } else if (finalAccess && !finalUser) {
          if (mounted) logout();
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        logout();
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => { mounted = false; };
  }, [logout, attemptRefresh]);

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

  // Role sync
  // const fetchCurrentUser = useCallback(async () => {
  //   // Don't poll if not authenticated
  //   if (!localStorage.getItem('access_token')) return;
    
  //   try {
  //     const response = await authFetch(`${BACKEND_URL}/updated-role`);
  //     if (response.ok) {
  //       const freshUser = await response.json();
  //       setUser(prev => {
  //         if (!prev || prev.role !== freshUser.role) {
  //           console.log(`Role updated: ${prev?.role} → ${freshUser.role}`);
  //           const updated = ensureUserWithAvatar({ ...prev, ...freshUser });
  //           persistUser(updated);
  //           return updated;
  //         }
  //         return prev;
  //       });
  //     }
  //   } catch (err) {
  //     // Silently fail - don't throw, don't logout
  //     console.error('Role sync failed:', err);
  //   }
  // }, [authFetch]);
  
  // useEffect(() => {
  //   // Only poll when actually logged in
  //   if (!user?.id || !isAuthenticated) return;
  
  //   const interval = setInterval(fetchCurrentUser, 1_000);
  //   return () => clearInterval(interval);  
  // }, [user?.id, isAuthenticated, fetchCurrentUser]); 

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