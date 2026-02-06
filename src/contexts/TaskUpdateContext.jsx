// /contexts/TaskUpdateContext.js
import React, { createContext, useState, useContext, useCallback } from 'react';

// Create the context
export const TaskUpdateContext = createContext();

// Create the provider component
export const TaskUpdateProvider = ({ children }) => {
  const [updateCount, setUpdateCount] = useState(0);
  
  // Function to notify about task updates
  const notifyTaskUpdate = useCallback(() => {
    setUpdateCount(prev => prev + 1);
    // Also dispatch a custom event for components that aren't using context
    window.dispatchEvent(new CustomEvent('taskUpdated'));
  }, []);

  const value = {
    updateCount,
    notifyTaskUpdate,
    triggerStatsRefresh: notifyTaskUpdate, // Alias for clarity
  };

  return (
    <TaskUpdateContext.Provider value={value}>
      {children}
    </TaskUpdateContext.Provider>
  );
};

// Custom hook for easier usage
export const useTaskUpdate = () => {
  const context = useContext(TaskUpdateContext);
  if (!context) {
    throw new Error('useTaskUpdate must be used within TaskUpdateProvider');
  }
  return context;
};