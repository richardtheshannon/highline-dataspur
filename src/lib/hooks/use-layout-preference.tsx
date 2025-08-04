// src/lib/hooks/use-layout-preference.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the possible preference values
type LayoutPreference = 'left-handed' | 'right-handed';

// Define the shape of our context
interface LayoutPreferenceContextType {
  preference: LayoutPreference;
  setPreference: (preference: LayoutPreference) => void;
}

// Create the context with a default undefined value
const LayoutPreferenceContext = createContext<LayoutPreferenceContextType | undefined>(undefined);

// Create the provider component
export function LayoutPreferenceProvider({ children }: { children: ReactNode }) {
  // State to hold the current preference, defaulting to 'left-handed'
  const [preference, setPreferenceState] = useState<LayoutPreference>('left-handed');

  // On initial load, try to get the preference from localStorage
  useEffect(() => {
    try {
      const storedPreference = localStorage.getItem('layoutPreference') as LayoutPreference;
      if (storedPreference) {
        setPreferenceState(storedPreference);
      }
    } catch (error) {
        console.error("Could not access localStorage:", error);
    }
  }, []);

  // Function to update the preference in both state and localStorage
  const setPreference = (newPreference: LayoutPreference) => {
    setPreferenceState(newPreference);
    try {
        localStorage.setItem('layoutPreference', newPreference);
    } catch (error) {
        console.error("Could not access localStorage:", error);
    }
  };

  // Provide the state and setter to all children
  return (
    <LayoutPreferenceContext.Provider value={{ preference, setPreference }}>
      {children}
    </LayoutPreferenceContext.Provider>
  );
}

// Create the custom hook for easy consumption of the context
export function useLayoutPreference() {
  const context = useContext(LayoutPreferenceContext);
  if (context === undefined) {
    throw new Error('useLayoutPreference must be used within a LayoutPreferenceProvider');
  }
  return context;
}
