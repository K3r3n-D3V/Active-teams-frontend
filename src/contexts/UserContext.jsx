import React, { createContext, useState, useEffect } from "react";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [profilePic, setProfilePic] = useState("https://cdn-icons-png.flaticon.com/512/147/147144.png");
  const [userProfile, setUserProfile] = useState(null);

  // Load user profile and profile picture from localStorage on mount
  useEffect(() => {
    const initializeUserData = () => {
      try {
        // Load user profile
        const savedProfile = localStorage.getItem('userProfile');
        if (savedProfile) {
          const parsedProfile = JSON.parse(savedProfile);
          setUserProfile(parsedProfile);
          
          // Set profile picture from user profile if available
          const picFromProfile = parsedProfile?.profile_picture || 
                               parsedProfile?.avatarUrl || 
                               parsedProfile?.profilePicUrl;
          if (picFromProfile) {
            setProfilePic(picFromProfile);
          }
        }

        // Load standalone profile picture (for backward compatibility)
        const savedPic = localStorage.getItem('profilePic');
        if (savedPic) {
          setProfilePic(savedPic);
        }
      } catch (error) {
        console.error('Error initializing user data:', error);
      }
    };

    initializeUserData();
  }, []);

  // Save user profile to localStorage whenever it changes
  useEffect(() => {
    if (userProfile) {
      localStorage.setItem('userProfile', JSON.stringify(userProfile));
    } else {
      localStorage.removeItem('userProfile');
    }
  }, [userProfile]);

  // Enhanced setProfilePic that also updates userProfile
  const setProfilePicEnhanced = (newProfilePic) => {
    setProfilePic(newProfilePic);
    
    // Also update the profile picture in userProfile
    if (userProfile) {
      const updatedProfile = {
        ...userProfile,
        profile_picture: newProfilePic,
        avatarUrl: newProfilePic,
        profilePicUrl: newProfilePic
      };
      setUserProfile(updatedProfile);
    }
    
    // Save to localStorage for standalone access
    if (newProfilePic && newProfilePic !== "https://cdn-icons-png.flaticon.com/512/147/147144.png") {
      localStorage.setItem('profilePic', newProfilePic);
    }
  };

  // Enhanced setUserProfile that also updates profilePic
  const setUserProfileEnhanced = (newUserProfile) => {
    setUserProfile(newUserProfile);
    
    // Update profile picture from the new user profile
    if (newUserProfile) {
      const picFromProfile = newUserProfile?.profile_picture || 
                           newUserProfile?.avatarUrl || 
                           newUserProfile?.profilePicUrl;
      if (picFromProfile && picFromProfile !== profilePic) {
        setProfilePic(picFromProfile);
        localStorage.setItem('profilePic', picFromProfile);
      }
    }
  };

  const clearUserData = () => {
    setUserProfile(null);
    setProfilePic("https://cdn-icons-png.flaticon.com/512/147/147144.png");
    localStorage.removeItem('userProfile');
    localStorage.removeItem('profilePic');
  };

  return (
    <UserContext.Provider value={{ 
      profilePic, 
      setProfilePic: setProfilePicEnhanced, 
      userProfile, 
      setUserProfile: setUserProfileEnhanced,
      clearUserData
    }}>
      {children}
    </UserContext.Provider>
  );
};