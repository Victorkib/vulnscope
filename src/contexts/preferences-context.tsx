'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/components/auth/auth-provider';

// Unified preferences interface
export interface UnifiedPreferences {
  // User identification
  userId: string;
  
  // Appearance
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  dashboardLayout: 'compact' | 'comfortable' | 'spacious';
  showAnimations: boolean;
  sidebarCollapsed: boolean;
  
  // Notifications
  emailNotifications: boolean;
  pushNotifications: boolean;
  criticalAlerts: boolean;
  weeklyDigest: boolean;
  enableSounds: boolean;
  
  // Data & Export
  exportFormat: 'json' | 'csv' | 'pdf';
  maxResultsPerPage: number;
  showPreviewCards: boolean;
  defaultSeverityFilter: string[];
  
  // Behavior
  autoRefresh: boolean;
  refreshInterval: number;
  
  // Accessibility
  language: string;
  timezone: string;
  highContrast: boolean;
  reduceMotion: boolean;
  screenReader: boolean;
  
  // Intelligence & Threat Analysis
  intelligence: {
    threatLandscapeView: 'global' | 'regional' | 'sector';
    threatActorFocus: string[];
    attackVectorFilter: string[];
    intelligenceAlerts: boolean;
    threatHeatMapStyle: 'geographic' | 'temporal' | 'severity';
    securityPostureMetrics: string[];
    complianceTracking: string[];
    predictiveAnalytics: boolean;
    zeroDayTracking: boolean;
    alertFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
    notificationChannels: string[];
    customFilters: {
      severity: string[];
      sectors: string[];
      regions: string[];
      threatActors: string[];
    };
  };
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// Default preferences - single source of truth
const defaultPreferences: UnifiedPreferences = {
  userId: '',
  theme: 'system',
  fontSize: 'medium',
  dashboardLayout: 'comfortable',
  showAnimations: true,
  sidebarCollapsed: false,
  
  // Notifications
  emailNotifications: true,
  pushNotifications: false,
  criticalAlerts: true,
  weeklyDigest: true,
  enableSounds: false,
  
  // Data & Export
  exportFormat: 'csv',
  maxResultsPerPage: 25,
  showPreviewCards: true,
  defaultSeverityFilter: ['CRITICAL', 'HIGH'],
  
  // Behavior
  autoRefresh: false,
  refreshInterval: 300000, // 5 minutes
  
  // Accessibility
  language: 'en',
  timezone: 'UTC',
  highContrast: false,
  reduceMotion: false,
  screenReader: false,
  
  // Intelligence
  intelligence: {
    threatLandscapeView: 'global',
    threatActorFocus: [],
    attackVectorFilter: [],
    intelligenceAlerts: true,
    threatHeatMapStyle: 'geographic',
    securityPostureMetrics: ['riskScore', 'vulnerabilityExposure', 'patchCompliance', 'securityMaturity'],
    complianceTracking: ['gdpr', 'sox', 'hipaa', 'pci'],
    predictiveAnalytics: true,
    zeroDayTracking: true,
    alertFrequency: 'daily',
    notificationChannels: ['email'],
    customFilters: {
      severity: ['CRITICAL', 'HIGH'],
      sectors: [],
      regions: [],
      threatActors: []
    }
  },
  
  // Timestamps
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

interface PreferencesContextType {
  preferences: UnifiedPreferences;
  loading: boolean;
  error: Error | null;
  saving: boolean;
  updatePreference: <K extends keyof UnifiedPreferences>(key: K, value: UnifiedPreferences[K]) => void;
  savePreferences: (preferences: UnifiedPreferences) => Promise<boolean>;
  resetToDefaults: () => Promise<void>;
  refreshPreferences: () => Promise<void>;
  isDarkMode: boolean;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

// Debounce utility with cleanup
function useDebounce<T extends (...args: any[]) => any>(callback: T, delay: number): T {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  
  const debouncedCallback = useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]) as T;

  // Cleanup function
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
  }, []);

  // Add cleanup method to the returned function
  (debouncedCallback as any).cleanup = cleanup;
  
  return debouncedCallback;
}

// Apply preferences to DOM
const applyPreferences = (prefs: UnifiedPreferences) => {
  if (typeof window === 'undefined') return;
  
  const root = document.documentElement;
  
  // Apply theme
  root.classList.remove('light', 'dark');
  if (prefs.theme === 'system') {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    root.classList.add(systemTheme);
  } else {
    root.classList.add(prefs.theme);
  }
  
  // Apply font size
  root.classList.remove('font-size-small', 'font-size-medium', 'font-size-large');
  root.classList.add(`font-size-${prefs.fontSize}`);
  
  // Apply layout
  root.classList.remove('layout-compact', 'layout-comfortable', 'layout-spacious');
  root.classList.add(`layout-${prefs.dashboardLayout}`);
  
  // Apply animations
  if (prefs.showAnimations) {
    root.classList.remove('motion-reduce');
  } else {
    root.classList.add('motion-reduce');
  }
  
  // Apply high contrast
  if (prefs.highContrast) {
    root.classList.add('high-contrast');
  } else {
    root.classList.remove('high-contrast');
  }
  
  // Apply reduce motion
  if (prefs.reduceMotion) {
    root.classList.add('reduce-motion');
  } else {
    root.classList.remove('reduce-motion');
  }
  
  // Apply screen reader optimization
  if (prefs.screenReader) {
    root.classList.add('screen-reader-optimized');
    root.setAttribute('aria-live', 'polite');
  } else {
    root.classList.remove('screen-reader-optimized');
    root.removeAttribute('aria-live');
  }
  
  // Apply CSS custom properties
  root.style.setProperty('--font-scale', 
    prefs.fontSize === 'small' ? '0.875' : 
    prefs.fontSize === 'large' ? '1.125' : '1'
  );
  
  root.style.setProperty('--layout-spacing',
    prefs.dashboardLayout === 'compact' ? '0.5rem' :
    prefs.dashboardLayout === 'spacious' ? '2rem' : '1rem'
  );
  
  root.style.setProperty('--card-padding',
    prefs.dashboardLayout === 'compact' ? '1rem' :
    prefs.dashboardLayout === 'spacious' ? '2rem' : '1.5rem'
  );
  
  root.style.setProperty('--contrast-multiplier', prefs.highContrast ? '1.5' : '1');
  root.style.setProperty('--motion-scale', prefs.reduceMotion ? '0' : '1');
  root.style.setProperty('--animation-duration', prefs.showAnimations ? '0.3s' : '0s');
};

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<UnifiedPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [saving, setSaving] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Track if we're currently loading to prevent race conditions
  const loadingRef = useRef(false);
  const pendingSaveRef = useRef<AbortController | null>(null);
  const retryCountRef = useRef(0);
  
  // Load preferences from API
  const loadPreferences = useCallback(async () => {
    if (!user || loadingRef.current) return;
    
    try {
      loadingRef.current = true;
      setLoading(true);
      setError(null);
      
      console.log('Loading preferences for user:', user.id);
      
      const data = await apiClient.get('/api/users/preferences', {
        cache: false, // Disable cache to ensure fresh data
      });
      
      // Merge with defaults to ensure all fields are present
      const mergedPreferences = { 
        ...defaultPreferences, 
        ...data,
        userId: user.id // Ensure userId is set to current user
      };
      setPreferences(mergedPreferences);
      
      // Apply preferences immediately
      applyPreferences(mergedPreferences);
      
      console.log('Preferences loaded successfully:', mergedPreferences);
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load preferences');
      setError(error);
      console.error('Failed to load preferences:', error);
      
      // Use defaults on error
      setPreferences(defaultPreferences);
      applyPreferences(defaultPreferences);
      
      toast({
        title: 'Settings Warning',
        description: 'Using default settings. Some preferences may not be saved.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      loadingRef.current = false;
      setIsInitialized(true);
    }
  }, [user, toast]);
  
  // Save preferences to API with retry logic and race condition prevention
  const savePreferences = useCallback(async (newPreferences: UnifiedPreferences, retryCount = 0): Promise<boolean> => {
    if (!user) return false;
    
    // Cancel any pending save operation
    if (pendingSaveRef.current) {
      pendingSaveRef.current.abort();
    }
    
    // Create new abort controller for this save operation
    const abortController = new AbortController();
    pendingSaveRef.current = abortController;
    
    try {
      setSaving(true);
      
      // Ensure userId is set when saving
      const preferencesToSave = {
        ...newPreferences,
        userId: user.id
      };
      
      console.log('Saving preferences:', preferencesToSave, 'retry:', retryCount);
      
      // Add abort signal to API call
      await apiClient.put('/api/users/preferences', preferencesToSave, {
        signal: abortController.signal
      });
      
      // Check if operation was aborted
      if (abortController.signal.aborted) {
        console.log('Save operation was aborted');
        return false;
      }
      
      // Update local state
      setPreferences(newPreferences);
      
      // Apply preferences immediately
      applyPreferences(newPreferences);
      
      // Clear cache to ensure fresh data on next fetch
      apiClient.clearCache('/api/users/preferences');
      
      // Reset retry count on success
      retryCountRef.current = 0;
      
      console.log('Preferences saved successfully');
      return true;
    } catch (error) {
      // Don't retry if operation was aborted
      if (abortController.signal.aborted) {
        console.log('Save operation was aborted, not retrying');
        return false;
      }
      
      console.error('Failed to save preferences:', error);
      
      // Retry with exponential backoff (max 3 retries)
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        console.log(`Retrying save in ${delay}ms (attempt ${retryCount + 1}/3)`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return savePreferences(newPreferences, retryCount + 1);
      }
      
      // All retries failed
      retryCountRef.current = 0;
      toast({
        title: 'Save Failed',
        description: 'Failed to save preferences after multiple attempts. Please try again.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setSaving(false);
      pendingSaveRef.current = null;
    }
  }, [user, toast]);
  
  // Debounced save function
  const debouncedSave = useDebounce(savePreferences, 1000);
  
  // Update a single preference
  const updatePreference = useCallback(<K extends keyof UnifiedPreferences>(
    key: K,
    value: UnifiedPreferences[K]
  ) => {
    if (!isInitialized) return;
    
    const updatedPreferences = { 
      ...preferences, 
      [key]: value,
      userId: user?.id || preferences.userId, // Maintain userId
      updatedAt: new Date().toISOString()
    };
    
    // Update local state immediately for instant UI feedback
    setPreferences(updatedPreferences);
    
    // Apply the specific preference change immediately
    if (key === 'theme') {
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      if (value === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        root.classList.add(systemTheme);
      } else {
        root.classList.add(value as string);
      }
    } else if (key === 'fontSize') {
      const root = document.documentElement;
      root.classList.remove('font-size-small', 'font-size-medium', 'font-size-large');
      root.classList.add(`font-size-${value}`);
      root.style.setProperty('--font-scale', 
        value === 'small' ? '0.875' : 
        value === 'large' ? '1.125' : '1'
      );
    } else if (key === 'dashboardLayout') {
      const root = document.documentElement;
      root.classList.remove('layout-compact', 'layout-comfortable', 'layout-spacious');
      root.classList.add(`layout-${value}`);
      root.style.setProperty('--layout-spacing',
        value === 'compact' ? '0.5rem' :
        value === 'spacious' ? '2rem' : '1rem'
      );
      root.style.setProperty('--card-padding',
        value === 'compact' ? '1rem' :
        value === 'spacious' ? '2rem' : '1.5rem'
      );
    } else if (key === 'showAnimations') {
      const root = document.documentElement;
      if (value) {
        root.classList.remove('motion-reduce');
        root.style.setProperty('--animation-duration', '0.3s');
      } else {
        root.classList.add('motion-reduce');
        root.style.setProperty('--animation-duration', '0s');
      }
    } else if (key === 'highContrast') {
      const root = document.documentElement;
      if (value) {
        root.classList.add('high-contrast');
        root.style.setProperty('--contrast-multiplier', '1.5');
      } else {
        root.classList.remove('high-contrast');
        root.style.setProperty('--contrast-multiplier', '1');
      }
    } else if (key === 'reduceMotion') {
      const root = document.documentElement;
      if (value) {
        root.classList.add('reduce-motion');
        root.style.setProperty('--motion-scale', '0');
      } else {
        root.classList.remove('reduce-motion');
        root.style.setProperty('--motion-scale', '1');
      }
    } else if (key === 'screenReader') {
      const root = document.documentElement;
      if (value) {
        root.classList.add('screen-reader-optimized');
        root.setAttribute('aria-live', 'polite');
      } else {
        root.classList.remove('screen-reader-optimized');
        root.removeAttribute('aria-live');
      }
    }
    
    // Save to API with debouncing
    debouncedSave(updatedPreferences);
  }, [preferences, debouncedSave, isInitialized]);
  
  // Reset to defaults
  const resetToDefaults = useCallback(async () => {
    try {
      const defaultPrefsWithUserId = {
        ...defaultPreferences,
        userId: user?.id || ''
      };
      const success = await savePreferences(defaultPrefsWithUserId);
      if (success) {
        toast({
          title: 'Settings Reset',
          description: 'All settings have been reset to defaults.',
        });
      }
    } catch (error) {
      toast({
        title: 'Reset Failed',
        description: 'Failed to reset settings. Please try again.',
        variant: 'destructive',
      });
    }
  }, [savePreferences, toast, user]);
  
  // Refresh preferences
  const refreshPreferences = useCallback(async () => {
    await loadPreferences();
  }, [loadPreferences]);
  
  // Load preferences when user changes
  useEffect(() => {
    if (user && !isInitialized) {
      loadPreferences();
    } else if (!user) {
      // Reset to defaults when user logs out
      setPreferences(defaultPreferences);
      applyPreferences(defaultPreferences);
      setIsInitialized(false);
    }
  }, [user, loadPreferences, isInitialized]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cancel any pending save operations
      if (pendingSaveRef.current) {
        pendingSaveRef.current.abort();
      }
      
      // Cleanup debounced save function
      if (debouncedSave && (debouncedSave as any).cleanup) {
        (debouncedSave as any).cleanup();
      }
    };
  }, [debouncedSave]);
  
  // Calculate dark mode
  const isDarkMode = preferences.theme === 'dark' || 
    (preferences.theme === 'system' && typeof window !== 'undefined' && 
     window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  const value: PreferencesContextType = {
    preferences,
    loading,
    error,
    saving,
    updatePreference,
    savePreferences,
    resetToDefaults,
    refreshPreferences,
    isDarkMode,
  };
  
  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}

// Export default preferences for use in other files
export { defaultPreferences };
