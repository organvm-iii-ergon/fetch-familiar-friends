/**
 * Theme Context
 * Manages app theme (park, beach, forest, etc.) and dark mode
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';
import { storage } from '../utils/storage';

// Theme definitions
export interface Theme {
  name: string;
  label: string;
}

export const themes: Theme[] = [
  { name: 'park', label: 'Park' },
  { name: 'beach', label: 'Beach' },
  { name: 'forest', label: 'Forest' },
  { name: 'tundra', label: 'Tundra' },
  { name: 'sunset', label: 'Sunset' },
  { name: 'night', label: 'Night' },
  { name: 'snow', label: 'Snow' },
  { name: 'autumn', label: 'Autumn' },
];

// Theme color mappings
export const themeColors = {
  park: {
    accent: '#10b981', // emerald-500
    border: '#d1fae5', // emerald-200
    borderDark: '#065f46', // emerald-800
    badge: '#d1fae5',
    badgeDark: 'rgba(6, 78, 59, 0.3)',
    text: '#059669', // emerald-600
    textDark: '#34d399', // emerald-400
  },
  beach: {
    accent: '#0ea5e9', // sky-500
    border: '#bae6fd', // sky-200
    borderDark: '#075985', // sky-800
    badge: '#bae6fd',
    badgeDark: 'rgba(7, 89, 133, 0.3)',
    text: '#0284c7', // sky-600
    textDark: '#38bdf8', // sky-400
  },
  forest: {
    accent: '#15803d', // green-700
    border: '#bbf7d0', // green-200
    borderDark: '#166534', // green-800
    badge: '#bbf7d0',
    badgeDark: 'rgba(22, 101, 52, 0.3)',
    text: '#15803d', // green-700
    textDark: '#4ade80', // green-400
  },
  tundra: {
    accent: '#0891b2', // cyan-600
    border: '#a5f3fc', // cyan-200
    borderDark: '#155e75', // cyan-800
    badge: '#a5f3fc',
    badgeDark: 'rgba(21, 94, 117, 0.3)',
    text: '#0891b2', // cyan-600
    textDark: '#22d3ee', // cyan-400
  },
  sunset: {
    accent: '#f97316', // orange-500
    border: '#fed7aa', // orange-200
    borderDark: '#9a3412', // orange-800
    badge: '#fed7aa',
    badgeDark: 'rgba(154, 52, 18, 0.3)',
    text: '#ea580c', // orange-600
    textDark: '#fb923c', // orange-400
  },
  night: {
    accent: '#4f46e5', // indigo-600
    border: '#c7d2fe', // indigo-200
    borderDark: '#3730a3', // indigo-800
    badge: '#c7d2fe',
    badgeDark: 'rgba(55, 48, 163, 0.3)',
    text: '#4f46e5', // indigo-600
    textDark: '#818cf8', // indigo-400
  },
  snow: {
    accent: '#60a5fa', // blue-400
    border: '#bfdbfe', // blue-200
    borderDark: '#1e40af', // blue-800
    badge: '#bfdbfe',
    badgeDark: 'rgba(30, 64, 175, 0.3)',
    text: '#3b82f6', // blue-500
    textDark: '#60a5fa', // blue-400
  },
  autumn: {
    accent: '#d97706', // amber-600
    border: '#fde68a', // amber-200
    borderDark: '#92400e', // amber-800
    badge: '#fde68a',
    badgeDark: 'rgba(146, 64, 14, 0.3)',
    text: '#d97706', // amber-600
    textDark: '#fbbf24', // amber-400
  },
} as const;

export type ThemeName = keyof typeof themeColors;

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
  toggleDarkMode: () => void;
  colors: (typeof themeColors)[ThemeName];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeName>('park');
  const [isDarkMode, setIsDarkModeState] = useState(
    systemColorScheme === 'dark'
  );
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      const savedTheme = await storage.get<ThemeName>('theme', 'park');
      const savedDarkMode = await storage.get<boolean | null>('darkMode', null);

      setThemeState(savedTheme);

      if (savedDarkMode !== null) {
        setIsDarkModeState(savedDarkMode);
      } else {
        setIsDarkModeState(systemColorScheme === 'dark');
      }

      setIsLoaded(true);
    };

    loadPreferences();
  }, [systemColorScheme]);

  // Save theme when it changes
  const setTheme = (newTheme: ThemeName) => {
    setThemeState(newTheme);
    storage.set('theme', newTheme);
  };

  // Save dark mode when it changes
  const setIsDarkMode = (value: boolean) => {
    setIsDarkModeState(value);
    storage.set('darkMode', value);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const colors = themeColors[theme];

  // Don't render children until preferences are loaded
  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        isDarkMode,
        setIsDarkMode,
        toggleDarkMode,
        colors,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
