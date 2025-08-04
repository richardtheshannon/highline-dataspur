import { useState, useEffect } from 'react';

// Define the type for the layout preference
type LayoutPreference = 'left-handed' | 'right-handed';

/**
 * Custom hook to manage the user's layout preference (left-handed or right-handed).
 * It persists the preference to local storage and provides a setter function.
 */
export const useLayoutPreference = () => {
  // Initialize state from local storage or default to 'left-handed'
  const [preference, setPreference] = useState<LayoutPreference>(() => {
    if (typeof window !== 'undefined') {
      const storedPreference = localStorage.getItem('layout-preference');
      return (storedPreference as LayoutPreference) || 'left-handed';
    }
    return 'left-handed';
  });

  // Use a derived state to make the hook more readable in components
  const isRightHanded = preference === 'right-handed';

  // Persist the preference to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem('layout-preference', preference);
  }, [preference]);

  return { preference, setPreference, isRightHanded };
};
