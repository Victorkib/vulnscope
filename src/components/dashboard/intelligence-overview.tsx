'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useIntelligenceData } from '@/hooks/use-intelligence-data';
import { usePreferences } from '@/contexts/preferences-context';
import type { 
  ThreatLandscapeData, 
  SecurityPosture,
  IntelligenceStats 
} from '@/types/intelligence';
import {
  Shield,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Globe,
  Target,
  Zap,
  Eye,
  RefreshCw,
  Activity,
  Users,
  Database,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  Map,
  Building
} from 'lucide-react';

interface IntelligenceOverviewProps {
  className?: string;
  compact?: boolean;
}

export default function IntelligenceOverview({ 
  className = '', 
  compact = false 
}: IntelligenceOverviewProps) {
  const { preferences } = usePreferences();
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(!compact);
  
  const {
    threatLandscapeData,
    securityPosture,
    stats,
    loading,
    refreshing,
    error,
    fetchAllData,
    intelligencePrefs
  } = useIntelligenceData({
    autoRefresh: preferences?.autoRefresh || false,
    refreshInterval: preferences?.refreshInterval || 300000,
    includeRecommendations: true
  });

  const getThreatLevelColor = (level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL') => {
    switch (level) {
      case 'CRITICAL': return 'bg-red-500 text-white';
      case 'HIGH': return 'bg-orange-500 text-white';
      case 'MEDIUM': return 'bg-yellow-500 text-black';
      case 'LOW': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getTrendIcon = (trend: 'improving' | 'stable' | 'declining') => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <div className="h-4 w-4 bg-gray-400 rounded-full" />;
    }
  };

  const getSecurityScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 40) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getSecurityScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  if (loading && !stats) {
    return (
      <Card className={`border-0 shadow-lg ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <span>Threat Intelligence Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`border-0 shadow-lg ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <span>Threat Intelligence Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Intelligence Data Unavailable
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {error}
            </p>
            <Button 
              variant="outline" 
              onClick={() => fetchAllData()}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-0 shadow-lg ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <span>Threat Intelligence Overview</span>
            {refreshing && <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              {intelligencePrefs?.threatLandscapeView || 'global'} view
            </Badge>
            {compact && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? 'Collapse' : 'Expand'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Global Threat Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
            <div className="text-center p-3 lg:p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl">
              <div className="flex items-center justify-center mb-2">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <div className="text-2xl font-bold text-red-900 dark:text-red-100">
                {stats.totalThreats}
              </div>
              <div className="text-xs text-red-600 dark:text-red-400">
                Total Threats
              </div>
            </div>

            <div className="text-center p-3 lg:p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl">
              <div className="flex items-center justify-center mb-2">
                <Activity className="h-6 w-6 text-orange-500" />
              </div>
              <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                {stats.activeThreats}
              </div>
              <div className="text-xs text-orange-600 dark:text-orange-400">
                Active Threats
              </div>
            </div>

            <div className="text-center p-3 lg:p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {stats.threatActors}
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400">
                Threat Actors
              </div>
            </div>

            <div className="text-center p-3 lg:p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl">
              <div className="flex items-center justify-center mb-2">
                <Target className="h-6 w-6 text-purple-500" />
              </div>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {stats.attackVectors}
              </div>
              <div className="text-xs text-purple-600 dark:text-purple-400">
                Attack Vectors
              </div>
            </div>
          </div>
        )}

        {/* Security Posture */}
        {securityPosture && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center space-x-2">
                <Shield className="h-5 w-5 text-green-600" />
                <span>Security Posture</span>
              </h3>
              <Badge className={getThreatLevelColor(securityPosture.metrics.threatLevel)}>
                {securityPosture.metrics.threatLevel}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Risk Score</span>
                  <span className={`text-sm font-bold ${getSecurityScoreColor(securityPosture.riskScore)}`}>
                    {securityPosture.riskScore}/100
                  </span>
                </div>
                <Progress 
                  value={securityPosture.riskScore} 
                  className="h-2"
                />

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Patch Compliance</span>
                  <span className="text-sm font-bold text-green-600 dark:text-green-400">
                    {securityPosture.patchCompliance}%
                  </span>
                </div>
                <Progress 
                  value={securityPosture.patchCompliance} 
                  className="h-2"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Vulnerability Exposure</span>
                  <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                    {securityPosture.vulnerabilityExposure}%
                  </span>
                </div>
                <Progress 
                  value={securityPosture.vulnerabilityExposure} 
                  className="h-2"
                />

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Security Maturity</span>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    {securityPosture.securityMaturity}%
                  </span>
                </div>
                <Progress 
                  value={securityPosture.securityMaturity} 
                  className="h-2"
                />
              </div>
            </div>

            {/* Trends */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  {getTrendIcon(securityPosture.trends.riskTrend)}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Risk Trend</div>
                <div className="text-sm font-medium capitalize">
                  {securityPosture.trends.riskTrend}
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  {getTrendIcon(securityPosture.trends.patchTrend)}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Patch Trend</div>
                <div className="text-sm font-medium capitalize">
                  {securityPosture.trends.patchTrend}
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  {getTrendIcon(securityPosture.trends.exposureTrend)}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Exposure Trend</div>
                <div className="text-sm font-medium capitalize">
                  {securityPosture.trends.exposureTrend}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Threat Landscape Summary */}
        {threatLandscapeData && isExpanded && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <Globe className="h-5 w-5 text-blue-600" />
              <span>Threat Landscape</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium">New Threats</span>
                  </div>
                  <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300">
                    {threatLandscapeData.global.newThreats}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium">Active Threats</span>
                  </div>
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300">
                    {threatLandscapeData.global.activeThreats}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Resolved</span>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300">
                    {stats?.resolvedThreats || 0}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">Zero Days</span>
                  </div>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300">
                    {stats?.zeroDays || 0}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Compliance Status */}
        {securityPosture?.complianceStatus && isExpanded && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Compliance Status</span>
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(securityPosture.complianceStatus).map(([framework, status]) => (
                <div
                  key={framework}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    status 
                      ? 'bg-green-50 dark:bg-green-900/20' 
                      : 'bg-red-50 dark:bg-red-900/20'
                  }`}
                >
                  <span className="text-sm font-medium uppercase">
                    {framework}
                  </span>
                  {status ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Last updated: {stats?.lastUpdated ? new Date(stats.lastUpdated).toLocaleTimeString() : 'Never'}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/analytics')}
            >
              <Eye className="h-4 w-4 mr-2" />
              View Analytics
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchAllData()}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
