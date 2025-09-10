'use client';

import type React from 'react';
import { createContext, useContext } from 'react';
import { usePreferences } from '@/contexts/preferences-context';

type Theme = 'dark' | 'light' | 'system';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  preferences: any;
  setTheme: (theme: Theme) => void;
  updatePreference: (key: string, value: unknown) => void;
  loadPreferences: () => Promise<void>;
  savePreferences: () => Promise<void>;
  isDarkMode: boolean;
  isLoading: boolean;
};

const initialState: ThemeProviderState = {
  theme: 'system',
  preferences: null,
  setTheme: () => null,
  updatePreference: () => {},
  loadPreferences: async () => {},
  savePreferences: async () => {},
  isDarkMode: false,
  isLoading: true,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey: _storageKey = 'vulnscope-theme',
  ...props
}: ThemeProviderProps) {
  // Use the centralized preferences hook
  const {
    preferences,
    loading: isLoading,
    updatePreference,
    savePreferences,
    refreshPreferences: loadPreferences,
    isDarkMode,
  } = usePreferences();

  const setTheme = (theme: Theme) => {
    updatePreference('theme', theme);
  };

  // Get current theme from preferences
  const theme = preferences?.theme || defaultTheme;

  const value = {
    theme,
    preferences,
    setTheme,
    updatePreference,
    loadPreferences,
    savePreferences,
    isDarkMode,
    isLoading,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};
