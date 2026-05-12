import React, { createContext, useState, useEffect, useCallback } from "react";

export const UserContext = createContext();

const DEFAULT_AVATARS = {
  female: "https://cdn-icons-png.flaticon.com/512/6997/6997662.png",
  male: "https://cdn-icons-png.flaticon.com/512/6997/6997675.png",
  neutral: "https://cdn-icons-png.flaticon.com/512/147/147144.png",
};

const getDefaultAvatar = (userDataOrGender) => {
  if (!userDataOrGender) return DEFAULT_AVATARS.neutral;

  const gender = typeof userDataOrGender === "string"
    ? userDataOrGender
    : userDataOrGender?.gender;

  if (!gender) return DEFAULT_AVATARS.neutral;

  const normalized = String(gender).trim().toLowerCase();
  if (normalized === "female") return DEFAULT_AVATARS.female;
  if (normalized === "male") return DEFAULT_AVATARS.male;
  return DEFAULT_AVATARS.neutral;
};

const getProfilePictureFromUser = (userData) => {
  if (!userData) return DEFAULT_AVATARS.neutral;
  return (
    userData.profile_picture ||
    userData.avatarUrl ||
    userData.profilePicUrl ||
    getDefaultAvatar(userData)
  );
};

const normalizeUserProfile = (userData) => {
  if (!userData) return null;
  const profilePicture = getProfilePictureFromUser(userData);
  return {
    ...userData,
    profile_picture: profilePicture,
    avatarUrl: profilePicture,
    profilePicUrl: profilePicture,
  };
};

export const UserProvider = ({ children }) => {
  const [profilePic, setProfilePic] = useState(DEFAULT_AVATARS.neutral);
  const [userProfile, setUserProfile] = useState(null);

  const initializeUserData = useCallback(() => {
    try {
      const savedProfile = localStorage.getItem('userProfile');
      let parsedProfile = null;

      if (savedProfile) {
        parsedProfile = JSON.parse(savedProfile);
        const normalizedProfile = normalizeUserProfile(parsedProfile);
        setUserProfile(normalizedProfile);

        const savedPic = localStorage.getItem('profilePic');
        const defaultAvatarUrls = Object.values(DEFAULT_AVATARS);
        const isSavedPicCustom = savedPic && !defaultAvatarUrls.includes(savedPic);

        setProfilePic(
          !normalizedProfile.profile_picture && isSavedPicCustom
            ? savedPic
            : normalizedProfile.profile_picture
        );

        localStorage.setItem('userProfile', JSON.stringify(normalizedProfile));
      } else {
        const savedPic = localStorage.getItem('profilePic');
        if (savedPic) {
          setProfilePic(savedPic);
        } else {
          setProfilePic(DEFAULT_AVATARS.neutral);
        }
      }
    } catch (error) {
      console.error('Error initializing user data:', error);
    }
  }, []);

  useEffect(() => {
    initializeUserData();
  }, [initializeUserData]);

  //  REMOVED THIS EFFECT - Let AuthContext manage userProfile in localStorage
  // useEffect(() => {
  //   if (userProfile) {
  //     localStorage.setItem('userProfile', JSON.stringify(userProfile));
  //   } else {
  //     localStorage.removeItem('userProfile');  //  THIS WAS DELETING IT!
  //   }
  // }, [userProfile]);

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
      //  Update localStorage here since we removed the effect
      localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
    }
    
    // Save to localStorage for standalone access
    if (newProfilePic && newProfilePic !== "https://cdn-icons-png.flaticon.com/512/147/147144.png") {
      localStorage.setItem('profilePic', newProfilePic);
    }
  };

  // Enhanced setUserProfile that also updates profilePic and gender default avatars
  const setUserProfileEnhanced = (newUserProfile) => {
    if (!newUserProfile) {
      setUserProfile(null);
      localStorage.removeItem('userProfile');
      setProfilePic(DEFAULT_AVATARS.neutral);
      localStorage.removeItem('profilePic');
      return;
    }

    const normalizedProfile = normalizeUserProfile(newUserProfile);
    setUserProfile(normalizedProfile);
    localStorage.setItem('userProfile', JSON.stringify(normalizedProfile));
    setProfilePic(normalizedProfile.profile_picture);
    localStorage.setItem('profilePic', normalizedProfile.profile_picture);
  };

  const loadUserProfile = useCallback(() => {
    initializeUserData();
  }, [initializeUserData]);

  const clearUserData = () => {
    setUserProfile(null);
    setProfilePic(DEFAULT_AVATARS.neutral);
    localStorage.removeItem('userProfile');
    localStorage.removeItem('profilePic');
  };

  return (
    <UserContext.Provider value={{ 
      profilePic, 
      setProfilePic: setProfilePicEnhanced, 
      userProfile, 
      setUserProfile: setUserProfileEnhanced,
      loadUserProfile,
      clearUserData
    }}>
      {children}
    </UserContext.Provider>
  );
};