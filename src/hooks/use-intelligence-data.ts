import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { useTheme } from '@/components/theme/theme-provider';
import { usePreferences } from '@/contexts/preferences-context';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import type { 
  ThreatLandscapeData, 
  SecurityPosture,
  IntelligenceStats,
  IntelligencePreferences 
} from '@/types/intelligence';

interface UseIntelligenceDataOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  includeRecommendations?: boolean;
}

export function useIntelligenceData(options: UseIntelligenceDataOptions = {}) {
  const { user } = useAuth();
  const { preferences } = usePreferences();
  const { toast } = useToast();
  
  const {
    autoRefresh = false,
    refreshInterval = 300000, // 5 minutes
    includeRecommendations = true
  } = options;

  const [threatLandscapeData, setThreatLandscapeData] = useState<ThreatLandscapeData | null>(null);
  const [securityPosture, setSecurityPosture] = useState<SecurityPosture | null>(null);
  const [stats, setStats] = useState<IntelligenceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get intelligence preferences from user preferences
  const intelligencePrefs = preferences?.intelligence || {
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
  };

  const fetchThreatLandscapeData = useCallback(async (view: string = 'global', timeframe: string = '30d') => {
    try {
      setRefreshing(true);
      setError(null);

      const params = new URLSearchParams({
        view,
        timeframe,
        ...(intelligencePrefs.customFilters.regions.length > 0 && { 
          regions: intelligencePrefs.customFilters.regions.join(',') 
        }),
        ...(intelligencePrefs.customFilters.sectors.length > 0 && { 
          sectors: intelligencePrefs.customFilters.sectors.join(',') 
        })
      });

      const response = await apiClient.get(`/api/intelligence/threat-landscape?${params}`);
      
      if (response.success) {
        setThreatLandscapeData(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch threat landscape data');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: `Failed to fetch threat landscape data: ${errorMessage}`,
        variant: 'destructive'
      });
    } finally {
      setRefreshing(false);
    }
  }, [intelligencePrefs, toast]);

  const fetchSecurityPosture = useCallback(async () => {
    try {
      setError(null);

      const params = new URLSearchParams({
        includeRecommendations: includeRecommendations.toString()
      });

      const response = await apiClient.get(`/api/intelligence/security-posture?${params}`);
      
      if (response.success) {
        setSecurityPosture(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch security posture data');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: `Failed to fetch security posture data: ${errorMessage}`,
        variant: 'destructive'
      });
    }
  }, [includeRecommendations, toast]);

  const fetchIntelligenceStats = useCallback(async () => {
    try {
      setError(null);

      const response = await apiClient.get('/api/intelligence/stats');
      
      if (response.success) {
        setStats(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch intelligence stats');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: `Failed to fetch intelligence stats: ${errorMessage}`,
        variant: 'destructive'
      });
    }
  }, [toast]);

  const fetchAllData = useCallback(async (view: string = 'global', timeframe: string = '30d') => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchThreatLandscapeData(view, timeframe),
        fetchSecurityPosture(),
        fetchIntelligenceStats()
      ]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, fetchThreatLandscapeData, fetchSecurityPosture, fetchIntelligenceStats]);

  const updateIntelligencePreferences = useCallback(async (newPreferences: Partial<IntelligencePreferences>) => {
    try {
      setError(null);

      const updatedPrefs = { ...intelligencePrefs, ...newPreferences };
      
      const response = await apiClient.put('/api/users/preferences', {
        intelligence: updatedPrefs
      });

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Intelligence preferences updated successfully'
        });
        return true;
      } else {
        throw new Error(response.error || 'Failed to update preferences');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: `Failed to update preferences: ${errorMessage}`,
        variant: 'destructive'
      });
      return false;
    }
  }, [intelligencePrefs, toast]);

  const refreshData = useCallback((view: string = 'global', timeframe: string = '30d') => {
    fetchAllData(view, timeframe);
  }, [fetchAllData]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh || !user) return;

    const interval = setInterval(() => {
      fetchAllData(intelligencePrefs.threatLandscapeView, '30d');
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, user, fetchAllData, intelligencePrefs.threatLandscapeView]);

  // Initial data fetch
  useEffect(() => {
    if (user) {
      fetchAllData(intelligencePrefs.threatLandscapeView, '30d');
    }
  }, [user, fetchAllData, intelligencePrefs.threatLandscapeView]);

  return {
    // Data
    threatLandscapeData,
    securityPosture,
    stats,
    
    // State
    loading,
    refreshing,
    error,
    
    // Preferences
    intelligencePrefs,
    
    // Actions
    fetchThreatLandscapeData,
    fetchSecurityPosture,
    fetchIntelligenceStats,
    fetchAllData,
    updateIntelligencePreferences,
    refreshData,
    
    // Utilities
    hasData: !!(threatLandscapeData || securityPosture || stats),
    isError: !!error,
    isLoading: loading || refreshing
  };
}

export default useIntelligenceData;
