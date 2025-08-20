'use client';

import type React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';

export interface UserPreferences {
  theme: Theme;
  language: string;
  timezone: string;
  dashboardLayout: 'compact' | 'comfortable' | 'spacious';
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklyDigest: boolean;
  criticalAlerts: boolean;
  exportFormat: 'json' | 'csv' | 'pdf';
  autoRefresh: boolean;
  refreshInterval: number;
  defaultSeverityFilter: string[];
  maxResultsPerPage: number;
  showPreviewCards: boolean;
  enableSounds: boolean;
  sidebarCollapsed: boolean;
  showAnimations: boolean;
  fontSize: 'small' | 'medium' | 'large';
  highContrast: boolean;
  reduceMotion: boolean;
  screenReader: boolean;
}

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  preferences: UserPreferences | null;
  setTheme: (theme: Theme) => void;
  updatePreference: (key: keyof UserPreferences, value: any) => void;
  loadPreferences: () => Promise<void>;
  savePreferences: () => Promise<void>;
  isDarkMode: boolean;
  isLoading: boolean;
};

const defaultPreferences: UserPreferences = {
  theme: 'system',
  language: 'en',
  timezone: 'UTC',
  dashboardLayout: 'comfortable',
  emailNotifications: true,
  pushNotifications: false,
  weeklyDigest: true,
  criticalAlerts: true,
  exportFormat: 'json',
  autoRefresh: false,
  refreshInterval: 300000,
  defaultSeverityFilter: ['CRITICAL', 'HIGH'],
  maxResultsPerPage: 25,
  showPreviewCards: true,
  enableSounds: false,
  sidebarCollapsed: false,
  showAnimations: true,
  fontSize: 'medium',
  highContrast: false,
  reduceMotion: false,
  screenReader: false,
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
  storageKey = 'vulnscope-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  useEffect(() => {
    if (preferences) {
      applyTheme(preferences.theme);
      applyFontSize(preferences.fontSize);
      applyAnimations(preferences.showAnimations);
      applyHighContrast(preferences.highContrast);
      applyReduceMotion(preferences.reduceMotion);
      applyScreenReader(preferences.screenReader);
      applyDashboardLayout(preferences.dashboardLayout);
    }
  }, [preferences]);

  const loadPreferences = async () => {
    try {
      const response = await fetch('/api/users/preferences');
      if (response.ok) {
        const data = await response.json();
        const mergedPreferences = { ...defaultPreferences, ...data };
        setPreferences(mergedPreferences);
        setTheme(mergedPreferences.theme);
      } else {
        setPreferences(defaultPreferences);
        setTheme(defaultPreferences.theme);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
      setPreferences(defaultPreferences);
      setTheme(defaultPreferences.theme);
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!preferences) return;

    try {
      await fetch('/api/users/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  };

  const updatePreference = (key: keyof UserPreferences, value: any) => {
    if (!preferences) return;
    const updatedPreferences = { ...preferences, [key]: value };
    setPreferences(updatedPreferences);

    if (key === 'theme') {
      setTheme(value);
    }

    // Apply changes immediately
    switch (key) {
      case 'fontSize':
        applyFontSize(value);
        break;
      case 'showAnimations':
        applyAnimations(value);
        break;
      case 'highContrast':
        applyHighContrast(value);
        break;
      case 'reduceMotion':
        applyReduceMotion(value);
        break;
      case 'screenReader':
        applyScreenReader(value);
        break;
      case 'dashboardLayout':
        applyDashboardLayout(value);
        break;
    }
  };

  const applyTheme = (theme: Theme) => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
      setIsDarkMode(systemTheme === 'dark');
    } else {
      root.classList.add(theme);
      setIsDarkMode(theme === 'dark');
    }
  };

  const applyFontSize = (fontSize: string) => {
    const root = window.document.documentElement;
    root.classList.remove(
      'font-size-small',
      'font-size-medium',
      'font-size-large'
    );
    root.classList.add(`font-size-${fontSize}`);

    // Apply CSS custom properties for font scaling
    switch (fontSize) {
      case 'small':
        root.style.setProperty('--font-scale', '0.875');
        break;
      case 'large':
        root.style.setProperty('--font-scale', '1.125');
        break;
      default:
        root.style.setProperty('--font-scale', '1');
    }
  };

  const applyAnimations = (enabled: boolean) => {
    const root = window.document.documentElement;
    if (enabled) {
      root.classList.remove('motion-reduce');
      root.style.setProperty('--animation-duration', '0.3s');
    } else {
      root.classList.add('motion-reduce');
      root.style.setProperty('--animation-duration', '0s');
    }
  };

  const applyHighContrast = (enabled: boolean) => {
    const root = window.document.documentElement;
    if (enabled) {
      root.classList.add('high-contrast');
      root.style.setProperty('--contrast-multiplier', '1.5');
    } else {
      root.classList.remove('high-contrast');
      root.style.setProperty('--contrast-multiplier', '1');
    }
  };

  const applyReduceMotion = (enabled: boolean) => {
    const root = window.document.documentElement;
    if (enabled) {
      root.classList.add('reduce-motion');
      root.style.setProperty('--motion-scale', '0');
    } else {
      root.classList.remove('reduce-motion');
      root.style.setProperty('--motion-scale', '1');
    }
  };

  const applyScreenReader = (enabled: boolean) => {
    const root = window.document.documentElement;
    if (enabled) {
      root.classList.add('screen-reader-optimized');
      root.setAttribute('aria-live', 'polite');
    } else {
      root.classList.remove('screen-reader-optimized');
      root.removeAttribute('aria-live');
    }
  };

  const applyDashboardLayout = (layout: string) => {
    const root = window.document.documentElement;
    root.classList.remove(
      'layout-compact',
      'layout-comfortable',
      'layout-spacious'
    );
    root.classList.add(`layout-${layout}`);

    // Apply spacing variables
    switch (layout) {
      case 'compact':
        root.style.setProperty('--layout-spacing', '0.5rem');
        root.style.setProperty('--card-padding', '1rem');
        break;
      case 'spacious':
        root.style.setProperty('--layout-spacing', '2rem');
        root.style.setProperty('--card-padding', '2rem');
        break;
      default:
        root.style.setProperty('--layout-spacing', '1rem');
        root.style.setProperty('--card-padding', '1.5rem');
    }
  };

  const value = {
    theme,
    preferences,
    setTheme: (theme: Theme) => {
      setTheme(theme);
      updatePreference('theme', theme);
    },
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
