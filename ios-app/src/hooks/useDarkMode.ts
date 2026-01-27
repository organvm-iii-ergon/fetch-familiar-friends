/**
 * useDarkMode Hook
 * Custom hook for managing dark mode state in React Native
 */

import { useState, useEffect, useCallback } from 'react';
import { useColorScheme, Appearance } from 'react-native';
import { storage } from '../utils/storage';

export interface UseDarkModeReturn {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  enableDarkMode: () => void;
  disableDarkMode: () => void;
  setDarkMode: (value: boolean) => void;
}

export function useDarkMode(): UseDarkModeReturn {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkModeState] = useState(
    systemColorScheme === 'dark'
  );
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved preference on mount
  useEffect(() => {
    const loadPreference = async () => {
      const savedMode = await storage.get<boolean | null>('darkMode', null);
      if (savedMode !== null) {
        setIsDarkModeState(savedMode);
      } else {
        setIsDarkModeState(systemColorScheme === 'dark');
      }
      setIsLoaded(true);
    };

    loadPreference();
  }, [systemColorScheme]);

  // Listen for system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      // Only update if user hasn't set a preference
      storage.get<boolean | null>('darkMode', null).then((savedMode) => {
        if (savedMode === null) {
          setIsDarkModeState(colorScheme === 'dark');
        }
      });
    });

    return () => subscription.remove();
  }, []);

  const setDarkMode = useCallback((value: boolean) => {
    setIsDarkModeState(value);
    storage.set('darkMode', value);
  }, []);

  const toggleDarkMode = useCallback(() => {
    setIsDarkModeState((prev) => {
      const newValue = !prev;
      storage.set('darkMode', newValue);
      return newValue;
    });
  }, []);

  const enableDarkMode = useCallback(() => {
    setDarkMode(true);
  }, [setDarkMode]);

  const disableDarkMode = useCallback(() => {
    setDarkMode(false);
  }, [setDarkMode]);

  return {
    isDarkMode: isLoaded ? isDarkMode : systemColorScheme === 'dark',
    toggleDarkMode,
    enableDarkMode,
    disableDarkMode,
    setDarkMode,
  };
}

export default useDarkMode;
