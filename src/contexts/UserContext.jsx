import React, { createContext, useState, useEffect } from "react";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [profilePic, setProfilePic] = useState("https://cdn-icons-png.flaticon.com/512/147/147144.png");
  const [userProfile, setUserProfile] = useState(null);

  // Load user profile from localStorage on mount
  useEffect(() => {
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      try {
        setUserProfile(JSON.parse(savedProfile));
      } catch (error) {
        console.error('Error parsing saved profile:', error);
      }
    }
  }, []);

  // Save user profile to localStorage whenever it changes
  useEffect(() => {
    if (userProfile) {
      localStorage.setItem('userProfile', JSON.stringify(userProfile));
    } else {
      localStorage.removeItem('userProfile');
    }
  }, [userProfile]);

  // Save profile picture to localStorage
  useEffect(() => {
    if (profilePic && profilePic !== "https://cdn-icons-png.flaticon.com/512/147/147144.png") {
      localStorage.setItem('profilePic', profilePic);
    }
  }, [profilePic]);

  // Load profile picture from localStorage on mount
  useEffect(() => {
    const savedPic = localStorage.getItem('profilePic');
    if (savedPic) {
      setProfilePic(savedPic);
    }
  }, []);

  const clearUserData = () => {
    setUserProfile(null);
    setProfilePic("https://cdn-icons-png.flaticon.com/512/147/147144.png");
    localStorage.removeItem('userProfile');
    localStorage.removeItem('profilePic');
  };

  return (
    <UserContext.Provider value={{ 
      profilePic, 
      setProfilePic, 
      userProfile, 
      setUserProfile,
      clearUserData
    }}>
      {children}
    </UserContext.Provider>
  );
};