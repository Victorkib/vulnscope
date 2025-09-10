import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import type { 
  ThreatIntelligence,
  SecurityPosture,
  PredictiveAnalytics,
  ThreatActor,
  ThreatActorIntelligenceData
} from '@/types/intelligence';
import type { ThreatActor as ThreatActorType } from '@/types/threat-actor';

interface UnifiedIntelligenceData {
  threatLandscape: ThreatIntelligence | null;
  threatActors: ThreatActorIntelligenceData | null;
  securityPosture: SecurityPosture | null;
  predictiveAnalytics: PredictiveAnalytics | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

interface UnifiedIntelligenceOptions {
  includeRecommendations?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

export function useUnifiedIntelligence(options: UnifiedIntelligenceOptions = {}) {
  const { user } = useAuth();
  const [data, setData] = useState<UnifiedIntelligenceData>({
    threatLandscape: null,
    threatActors: null,
    securityPosture: null,
    predictiveAnalytics: null,
    loading: true,
    error: null,
    lastUpdated: null
  });

  const {
    includeRecommendations = false,
    autoRefresh = false,
    refreshInterval = 30000 // 30 seconds default
  } = options;

  const fetchAllData = useCallback(async () => {
    if (!user) {
      setData(prev => ({ ...prev, loading: false, error: 'User not authenticated' }));
      return;
    }

    setData(prev => ({ ...prev, loading: true, error: null }));

    try {
      const baseUrl = '/api/intelligence';
      
      // Fetch all intelligence data in parallel
      const [landscapeRes, actorsRes, postureRes, predictiveRes] = await Promise.allSettled([
        fetch(`${baseUrl}/threat-landscape`),
        fetch(`${baseUrl}/threat-actors`),
        fetch(`${baseUrl}/security-posture${includeRecommendations ? '?includeRecommendations=true' : ''}`),
        fetch(`${baseUrl}/predictive`) // This might not exist yet, so we use allSettled
      ]);

      const results = {
        threatLandscape: null as ThreatIntelligence | null,
        threatActors: null as ThreatActorIntelligenceData | null,
        securityPosture: null as SecurityPosture | null,
        predictiveAnalytics: null as PredictiveAnalytics | null
      };

      // Process threat landscape data
      if (landscapeRes.status === 'fulfilled' && landscapeRes.value.ok) {
        const landscapeData = await landscapeRes.value.json();
        results.threatLandscape = landscapeData.data;
      }

      // Process threat actors data
      if (actorsRes.status === 'fulfilled' && actorsRes.value.ok) {
        const actorsData = await actorsRes.value.json();
        results.threatActors = actorsData.data;
      }

      // Process security posture data
      if (postureRes.status === 'fulfilled' && postureRes.value.ok) {
        const postureData = await postureRes.value.json();
        results.securityPosture = postureData.data;
      }

      // Process predictive analytics data (if available)
      if (predictiveRes.status === 'fulfilled' && predictiveRes.value.ok) {
        const predictiveData = await predictiveRes.value.json();
        results.predictiveAnalytics = predictiveData.data;
      }

      setData({
        ...results,
        loading: false,
        error: null,
        lastUpdated: new Date()
      });

    } catch (error) {
      console.error('Error fetching unified intelligence data:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch intelligence data'
      }));
    }
  }, [user, includeRecommendations]);

  const refreshData = useCallback(() => {
    return fetchAllData();
  }, [fetchAllData]);

  const refreshSpecificData = useCallback(async (dataType: keyof Omit<UnifiedIntelligenceData, 'loading' | 'error' | 'lastUpdated'>) => {
    if (!user) return;

    setData(prev => ({ ...prev, loading: true, error: null }));

    try {
      const baseUrl = '/api/intelligence';
      let endpoint = '';

      switch (dataType) {
        case 'threatLandscape':
          endpoint = `${baseUrl}/threat-landscape`;
          break;
        case 'threatActors':
          endpoint = `${baseUrl}/threat-actors`;
          break;
        case 'securityPosture':
          endpoint = `${baseUrl}/security-posture${includeRecommendations ? '?includeRecommendations=true' : ''}`;
          break;
        case 'predictiveAnalytics':
          endpoint = `${baseUrl}/predictive`;
          break;
        default:
          throw new Error(`Unknown data type: ${dataType}`);
      }

      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${dataType}: ${response.statusText}`);
      }

      const responseData = await response.json();
      
      setData(prev => ({
        ...prev,
        [dataType]: responseData.data,
        loading: false,
        error: null,
        lastUpdated: new Date()
      }));

    } catch (error) {
      console.error(`Error fetching ${dataType}:`, error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : `Failed to fetch ${dataType}`
      }));
    }
  }, [user, includeRecommendations]);

  // Initial data fetch
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh || !user) return;

    const interval = setInterval(fetchAllData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchAllData, user]);

  // Computed properties for easy access
  const hasData = data.threatLandscape || data.threatActors || data.securityPosture || data.predictiveAnalytics;
  const isFullyLoaded = !data.loading && hasData && !data.error;
  const hasError = !!data.error;

  // Statistics aggregator
  const getAggregatedStats = useCallback(() => {
    const stats = {
      totalThreats: 0,
      activeThreats: 0,
      criticalVulnerabilities: 0,
      riskScore: 0,
      lastActivity: null as Date | null
    };

    // Aggregate from threat landscape
    if (data.threatLandscape) {
      stats.totalThreats += data.threatLandscape.globalThreats?.length || 0;
      stats.activeThreats += data.threatLandscape.activeThreats || 0;
    }

    // Aggregate from threat actors
    if (data.threatActors) {
      stats.totalThreats += data.threatActors.statistics?.totalActors || 0;
      stats.activeThreats += data.threatActors.statistics?.activeActors || 0;
    }

    // Aggregate from security posture
    if (data.securityPosture) {
      stats.criticalVulnerabilities = data.securityPosture.metrics?.criticalVulnerabilities || 0;
      stats.riskScore = data.securityPosture.riskScore || 0;
    }

    // Find most recent activity
    const dates = [
      data.threatLandscape?.lastUpdated,
      data.threatActors?.lastUpdated,
      data.securityPosture?.lastUpdated,
      data.predictiveAnalytics?.lastUpdated
    ].filter(Boolean) as Date[];

    if (dates.length > 0) {
      stats.lastActivity = new Date(Math.max(...dates.map(d => d.getTime())));
    }

    return stats;
  }, [data]);

  return {
    // Data
    data,
    
    // Individual data accessors
    threatLandscape: data.threatLandscape,
    threatActors: data.threatActors,
    securityPosture: data.securityPosture,
    predictiveAnalytics: data.predictiveAnalytics,
    
    // State
    loading: data.loading,
    error: data.error,
    lastUpdated: data.lastUpdated,
    
    // Computed properties
    hasData,
    isFullyLoaded,
    hasError,
    
    // Actions
    refreshData,
    refreshSpecificData,
    fetchAllData,
    
    // Utilities
    getAggregatedStats
  };
}
