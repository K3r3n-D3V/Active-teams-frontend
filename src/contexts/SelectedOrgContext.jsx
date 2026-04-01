import React, { createContext, useState, useEffect, useCallback } from "react";

export const SelectedOrgContext = createContext();

export const SelectedOrgProvider = ({ children }) => {
  const [selectedOrg, setSelectedOrgState] = useState(() => {
    // Initialize from localStorage if available
    return localStorage.getItem("selectedOrg") || null;
  });

  // Sync selectedOrg to localStorage
  useEffect(() => {
    if (selectedOrg) {
      localStorage.setItem("selectedOrg", selectedOrg);
    } else {
      localStorage.removeItem("selectedOrg");
    }
  }, [selectedOrg]);

  const setSelectedOrg = useCallback((org) => {
    setSelectedOrgState(org);
  }, []);

  return (
    <SelectedOrgContext.Provider
      value={{
        selectedOrg,
        setSelectedOrg,
      }}
    >
      {children}
    </SelectedOrgContext.Provider>
  );
};

export const useSelectedOrg = () => {
  const ctx = React.useContext(SelectedOrgContext);
  if (!ctx) {
    throw new Error("useSelectedOrg must be inside SelectedOrgProvider");
  }
  return ctx;
};
