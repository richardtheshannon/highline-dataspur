'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the shape of the context data
type ViewPreference = 'table' | 'card';

interface ViewPreferenceContextType {
  preference: ViewPreference;
  setPreference: (preference: ViewPreference) => void;
}

// Create the context with a default value
const ViewPreferenceContext = createContext<ViewPreferenceContextType | undefined>(undefined);

// Create the Provider component
export const ViewPreferenceProvider = ({ children }: { children: ReactNode }) => {
  // Initialize state, trying to get the value from sessionStorage first
  const [preference, setPreference] = useState<ViewPreference>('table'); // Default to 'table'

  // On initial mount, check sessionStorage for a saved preference
  useEffect(() => {
    try {
      const savedPreference = sessionStorage.getItem('viewPreference') as ViewPreference;
      if (savedPreference && ['table', 'card'].includes(savedPreference)) {
        setPreference(savedPreference);
      }
    } catch (error) {
      console.error("Could not access sessionStorage:", error);
    }
  }, []);

  // Update sessionStorage whenever the preference changes
  const handleSetPreference = (newPreference: ViewPreference) => {
    setPreference(newPreference);
    try {
      sessionStorage.setItem('viewPreference', newPreference);
    } catch (error)      {
      console.error("Could not access sessionStorage:", error);
    }
  };

  const value = { preference, setPreference: handleSetPreference };

  return (
    <ViewPreferenceContext.Provider value={value}>
      {children}
    </ViewPreferenceContext.Provider>
  );
};

// Create the custom hook for easy consumption
export const useViewPreference = () => {
  const context = useContext(ViewPreferenceContext);
  if (context === undefined) {
    throw new Error('useViewPreference must be used within a ViewPreferenceProvider');
  }
  return context;
};
