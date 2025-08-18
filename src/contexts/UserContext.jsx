import React, { createContext, useState } from "react";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [profilePic, setProfilePic] = useState("https://cdn-icons-png.flaticon.com/512/147/147144.png");

  return (
    <UserContext.Provider value={{ profilePic, setProfilePic }}>
      {children}
    </UserContext.Provider>
  );
};