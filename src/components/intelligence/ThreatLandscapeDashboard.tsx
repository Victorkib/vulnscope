'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { useTheme } from '@/components/theme/theme-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useIntelligenceRealtime } from '@/hooks/use-intelligence-realtime';
import IntelligenceAlerts from './IntelligenceAlerts';
import RealtimePerformanceMonitor from './RealtimePerformanceMonitor';
import { apiClient } from '@/lib/api-client';
import type { 
  ThreatLandscapeData, 
  SecurityPosture,
  IntelligenceStats 
} from '@/types/intelligence';
import {
  Globe,
  Shield,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Activity,
  BarChart3,
  Map,
  Building,
  Clock,
  Target,
  Zap,
  Eye,
  RefreshCw,
  Settings,
  Download,
  Bell,
  Users,
  Database,
  PieChart,
  LineChart,
  Wifi,
  WifiOff
} from 'lucide-react';

interface ThreatLandscapeDashboardProps {
  className?: string;
}

export default function ThreatLandscapeDashboard({ className }: ThreatLandscapeDashboardProps) {
  const { user } = useAuth();
  const { preferences } = useTheme();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeView, setActiveView] = useState<'global' | 'regional' | 'sector' | 'temporal'>('global');
  const [timeframe, setTimeframe] = useState('30d');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedSector, setSelectedSector] = useState<string>('');

  // Real-time intelligence data
  const {
    threatLandscape: realtimeThreatLandscape,
    securityPosture: realtimeSecurityPosture,
    stats: realtimeStats,
    alerts: realtimeAlerts,
    isConnected,
    connectionStatus,
    error: realtimeError,
    refreshData: refreshRealtimeData
  } = useIntelligenceRealtime({
    enableThreatLandscape: true,
    enableSecurityPosture: true,
    enableStats: true,
    enableAlerts: true,
    autoReconnect: true
  });

  // Fallback data states for when real-time is not available
  const [threatLandscapeData, setThreatLandscapeData] = useState<ThreatLandscapeData | null>(null);
  const [securityPosture, setSecurityPosture] = useState<SecurityPosture | null>(null);
  const [stats, setStats] = useState<IntelligenceStats | null>(null);

  const fetchThreatLandscapeData = useCallback(async () => {
    try {
      setRefreshing(true);
      
      const params = new URLSearchParams({
        view: activeView,
        timeframe,
        ...(selectedRegion && { region: selectedRegion }),
        ...(selectedSector && { sector: selectedSector })
      });

      const [threatResponse, postureResponse] = await Promise.all([
        apiClient.get(`/api/intelligence/threat-landscape?${params}`),
        apiClient.get('/api/intelligence/security-posture?includeRecommendations=true')
      ]);

      if (threatResponse.success) {
        setThreatLandscapeData(threatResponse.data);
      }

      if (postureResponse.success) {
        setSecurityPosture(postureResponse.data);
      }

      // Calculate stats from the data
      if (threatResponse.success && postureResponse.success) {
        const calculatedStats: IntelligenceStats = {
          totalThreats: threatResponse.data.global.totalThreats,
          activeThreats: threatResponse.data.global.activeThreats,
          newThreats: threatResponse.data.global.newThreats,
          resolvedThreats: threatResponse.data.global.totalThreats - threatResponse.data.global.activeThreats,
          threatActors: threatResponse.data.geographic.reduce((acc, region) => acc + region.topThreatActors.length, 0),
          attackVectors: threatResponse.data.geographic.reduce((acc, region) => acc + region.topAttackVectors.length, 0),
          zeroDays: 0, // Will be implemented in future
          securityPostureScore: postureResponse.data.riskScore,
          complianceScore: Object.values(postureResponse.data.complianceStatus).filter(Boolean).length * 16.67, // 6 compliance frameworks
          predictionAccuracy: 85, // Placeholder
          lastUpdated: new Date().toISOString()
        };
        setStats(calculatedStats);
      }

    } catch (error) {
      console.error('Error fetching threat landscape data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch threat landscape data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeView, timeframe, selectedRegion, selectedSector, toast]);

  // Use real-time data when available, fallback to API data
  const currentThreatLandscape = realtimeThreatLandscape || threatLandscapeData;
  const currentSecurityPosture = realtimeSecurityPosture || securityPosture;
  const currentStats = realtimeStats || stats;

  useEffect(() => {
    fetchThreatLandscapeData();
  }, [fetchThreatLandscapeData]);

  const handleRefresh = () => {
    fetchThreatLandscapeData();
    refreshRealtimeData();
  };

  const handleViewChange = (view: 'global' | 'regional' | 'sector' | 'temporal') => {
    setActiveView(view);
  };

  const getThreatLevelColor = (level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL') => {
    switch (level) {
      case 'CRITICAL': return 'bg-red-500 text-white';
      case 'HIGH': return 'bg-orange-500 text-white';
      case 'MEDIUM': return 'bg-yellow-500 text-black';
      case 'LOW': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getThreatLevelIcon = (level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL') => {
    switch (level) {
      case 'CRITICAL': return AlertTriangle;
      case 'HIGH': return Zap;
      case 'MEDIUM': return Target;
      case 'LOW': return Shield;
      default: return Shield;
    }
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Threat Landscape Analysis</h1>
            <p className="text-muted-foreground">Loading intelligence data...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Threat Landscape Analysis</h1>
          <p className="text-muted-foreground">
            Real-time threat intelligence and security posture assessment
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {/* Real-time connection status */}
          <div className="flex items-center space-x-1">
            {isConnected ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            <span className="text-xs text-muted-foreground">
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
          
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      {currentStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Threats</p>
                  <p className="text-2xl font-bold">{currentStats.totalThreats.toLocaleString()}</p>
                </div>
                <Globe className="h-8 w-8 text-blue-500" />
              </div>
              <div className="mt-2">
                <Badge variant="outline" className="text-xs">
                  {currentThreatLandscape?.global.threatLevel}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Threats</p>
                  <p className="text-2xl font-bold">{currentStats.activeThreats.toLocaleString()}</p>
                </div>
                <Activity className="h-8 w-8 text-orange-500" />
              </div>
              <div className="mt-2">
                <Badge variant="outline" className="text-xs">
                  {((currentStats.activeThreats / currentStats.totalThreats) * 100).toFixed(1)}% active
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Security Posture</p>
                  <p className="text-2xl font-bold">{currentStats.securityPostureScore}/100</p>
                </div>
                <Shield className="h-8 w-8 text-green-500" />
              </div>
              <div className="mt-2">
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getThreatLevelColor(currentSecurityPosture?.metrics.threatLevel || 'LOW')}`}
                >
                  {currentSecurityPosture?.metrics.threatLevel}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Compliance Score</p>
                  <p className="text-2xl font-bold">{Math.round(currentStats.complianceScore)}%</p>
                </div>
                <Database className="h-8 w-8 text-purple-500" />
              </div>
              <div className="mt-2">
                <Badge variant="outline" className="text-xs">
                  {Object.values(currentSecurityPosture?.complianceStatus || {}).filter(Boolean).length}/6 frameworks
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Real-time Intelligence Alerts */}
      <IntelligenceAlerts 
        className="mb-6"
        maxAlerts={5}
        showFilters={true}
        autoRefresh={true}
      />

      {/* Real-time Performance Monitor */}
      <RealtimePerformanceMonitor 
        className="mb-6"
        showDetails={true}
        autoRefresh={true}
      />

      {/* Main Dashboard Tabs */}
      <Tabs value={activeView} onValueChange={handleViewChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="global" className="flex items-center space-x-2">
            <Globe className="h-4 w-4" />
            <span>Global</span>
          </TabsTrigger>
          <TabsTrigger value="regional" className="flex items-center space-x-2">
            <Map className="h-4 w-4" />
            <span>Regional</span>
          </TabsTrigger>
          <TabsTrigger value="sector" className="flex items-center space-x-2">
            <Building className="h-4 w-4" />
            <span>Sector</span>
          </TabsTrigger>
          <TabsTrigger value="temporal" className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Temporal</span>
          </TabsTrigger>
        </TabsList>

        {/* Global View */}
        <TabsContent value="global" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-5 w-5" />
                  <span>Global Threat Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentThreatLandscape && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Threat Level</span>
                      <Badge className={getThreatLevelColor(currentThreatLandscape.global.threatLevel)}>
                        {currentThreatLandscape.global.threatLevel}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Total Threats</span>
                      <span className="font-bold">{currentThreatLandscape.global.totalThreats.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Active Threats</span>
                      <span className="font-bold">{currentThreatLandscape.global.activeThreats.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">New Threats</span>
                      <span className="font-bold text-green-600">{currentThreatLandscape.global.newThreats.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Security Posture</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {securityPosture && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Risk Score</span>
                      <span className="font-bold">{currentSecurityPosture.riskScore}/100</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Vulnerability Exposure</span>
                      <span className="font-bold">{currentSecurityPosture.vulnerabilityExposure}/100</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Patch Compliance</span>
                      <span className="font-bold">{currentSecurityPosture.patchCompliance}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Security Maturity</span>
                      <span className="font-bold">{currentSecurityPosture.securityMaturity}/100</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Regional View */}
        <TabsContent value="regional" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Map className="h-5 w-5" />
                <span>Geographic Threat Distribution</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
                {currentThreatLandscape && (
                <div className="space-y-4">
                  {currentThreatLandscape.geographic.map((region, index) => {
                    const ThreatIcon = getThreatLevelIcon(region.threatLevel);
                    return (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <ThreatIcon className="h-5 w-5" />
                          <div>
                            <p className="font-medium">{region.region}</p>
                            <p className="text-sm text-muted-foreground">
                              {region.threatCount} threats
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getThreatLevelColor(region.threatLevel)}>
                            {region.threatLevel}
                          </Badge>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sector View */}
        <TabsContent value="sector" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5" />
                <span>Sector-Based Threat Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
                {currentThreatLandscape && (
                <div className="space-y-4">
                  {currentThreatLandscape.sector.map((sector, index) => {
                    const ThreatIcon = getThreatLevelIcon(sector.threatLevel);
                    return (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <ThreatIcon className="h-5 w-5" />
                          <div>
                            <p className="font-medium">{sector.sector}</p>
                            <p className="text-sm text-muted-foreground">
                              {sector.vulnerabilities} vulnerabilities
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getThreatLevelColor(sector.threatLevel)}>
                            {sector.threatLevel}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Avg patch: {sector.avgPatchTime} days
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Temporal View */}
        <TabsContent value="temporal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Threat Trends Over Time</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
                {currentThreatLandscape && (
                <div className="space-y-4">
                  {currentThreatLandscape.temporal.slice(-10).map((day, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{new Date(day.date).toLocaleDateString()}</p>
                        <p className="text-sm text-muted-foreground">
                          {day.threatCount} total threats
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <p className="text-sm font-medium text-green-600">+{day.newThreats}</p>
                          <p className="text-xs text-muted-foreground">New</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-blue-600">-{day.resolvedThreats}</p>
                          <p className="text-xs text-muted-foreground">Resolved</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Security Recommendations */}
      {securityPosture && currentSecurityPosture.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Security Recommendations</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentSecurityPosture.recommendations.slice(0, 3).map((recommendation) => (
                <div key={recommendation.id} className="flex items-start space-x-3 p-4 border rounded-lg">
                  <div className="flex-shrink-0">
                    <Badge 
                      className={getThreatLevelColor(recommendation.priority)}
                    >
                      {recommendation.priority}
                    </Badge>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{recommendation.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {recommendation.description}
                    </p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-xs text-muted-foreground">
                        Impact: {recommendation.impact}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Effort: {recommendation.effort}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Timeframe: {recommendation.timeframe}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
