'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useIntelligenceData } from '@/hooks/use-intelligence-data';
import type { SecurityPosture } from '@/types/intelligence';
import {
  Shield,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Target,
  Clock,
  Users,
  Database,
  RefreshCw,
  Eye,
  Settings
} from 'lucide-react';

interface SecurityPostureCardProps {
  className?: string;
  compact?: boolean;
}

export default function SecurityPostureCard({ 
  className = '', 
  compact = false 
}: SecurityPostureCardProps) {
  const router = useRouter();
  const {
    securityPosture,
    loading,
    refreshing,
    error,
    fetchSecurityPosture
  } = useIntelligenceData({
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 40) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getTrendIcon = (trend: 'improving' | 'stable' | 'declining') => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <div className="h-4 w-4 bg-gray-400 rounded-full" />;
    }
  };

  if (loading && !securityPosture) {
    return (
      <Card className={`border-0 shadow-lg ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-green-600" />
            <span>Security Posture</span>
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
            <Shield className="h-5 w-5 text-green-600" />
            <span>Security Posture</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Security Posture Unavailable
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {error}
            </p>
            <Button 
              variant="outline" 
              onClick={() => fetchSecurityPosture()}
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

  if (!securityPosture) {
    return (
      <Card className={`border-0 shadow-lg ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-green-600" />
            <span>Security Posture</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No Security Posture Data
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Security posture assessment is not available
            </p>
            <Button 
              variant="outline" 
              onClick={() => fetchSecurityPosture()}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Load Data
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
            <Shield className="h-5 w-5 text-green-600" />
            <span>Security Posture</span>
            {refreshing && <RefreshCw className="h-4 w-4 animate-spin text-green-600" />}
          </CardTitle>
          <Badge className={getThreatLevelColor(securityPosture.metrics.threatLevel)}>
            {securityPosture.metrics.threatLevel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Risk Score */}
        <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
          <div className="flex items-center justify-center mb-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${getScoreBg(securityPosture.riskScore)}`}>
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className={`text-4xl font-bold mb-2 ${getScoreColor(securityPosture.riskScore)}`}>
            {securityPosture.riskScore}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Overall Risk Score
          </div>
          <Progress 
            value={securityPosture.riskScore} 
            className="h-3"
          />
        </div>

        {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium flex items-center space-x-2">
                <Target className="h-4 w-4 text-orange-500" />
                <span>Vulnerability Exposure</span>
              </span>
              <span className={`text-sm font-bold ${getScoreColor(100 - securityPosture.vulnerabilityExposure)}`}>
                {securityPosture.vulnerabilityExposure}%
              </span>
            </div>
            <Progress 
              value={securityPosture.vulnerabilityExposure} 
              className="h-2"
            />

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Patch Compliance</span>
              </span>
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
              <span className="text-sm font-medium flex items-center space-x-2">
                <Shield className="h-4 w-4 text-blue-500" />
                <span>Security Maturity</span>
              </span>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                {securityPosture.securityMaturity}%
              </span>
            </div>
            <Progress 
              value={securityPosture.securityMaturity} 
              className="h-2"
            />

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium flex items-center space-x-2">
                <Clock className="h-4 w-4 text-purple-500" />
                <span>Avg Patch Time</span>
              </span>
              <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                {securityPosture.metrics.averagePatchTime}d
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
              <div 
                className="h-2 bg-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (30 - securityPosture.metrics.averagePatchTime) / 30 * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Vulnerability Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold flex items-center space-x-2">
            <Database className="h-4 w-4 text-gray-500" />
            <span>Vulnerability Breakdown</span>
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="text-lg font-bold text-red-600 dark:text-red-400">
                {securityPosture.metrics.criticalVulnerabilities}
              </div>
              <div className="text-xs text-red-600 dark:text-red-400">Critical</div>
            </div>
            <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                {securityPosture.metrics.highVulnerabilities}
              </div>
              <div className="text-xs text-orange-600 dark:text-orange-400">High</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                {securityPosture.metrics.mediumVulnerabilities}
              </div>
              <div className="text-xs text-yellow-600 dark:text-yellow-400">Medium</div>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                {securityPosture.metrics.lowVulnerabilities}
              </div>
              <div className="text-xs text-green-600 dark:text-green-400">Low</div>
            </div>
          </div>
        </div>

        {/* Trends */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-gray-500" />
            <span>Security Trends</span>
          </h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                {getTrendIcon(securityPosture.trends.riskTrend)}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Risk Trend</div>
              <div className="text-sm font-medium capitalize">
                {securityPosture.trends.riskTrend}
              </div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                {getTrendIcon(securityPosture.trends.patchTrend)}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Patch Trend</div>
              <div className="text-sm font-medium capitalize">
                {securityPosture.trends.patchTrend}
              </div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                {getTrendIcon(securityPosture.trends.exposureTrend)}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Exposure Trend</div>
              <div className="text-sm font-medium capitalize">
                {securityPosture.trends.exposureTrend}
              </div>
            </div>
          </div>
        </div>

        {/* Compliance Status */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-gray-500" />
            <span>Compliance Status</span>
          </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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

        {/* Recommendations Preview */}
        {securityPosture.recommendations && securityPosture.recommendations.length > 0 && !compact && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center space-x-2">
              <Settings className="h-4 w-4 text-gray-500" />
              <span>Top Recommendations</span>
            </h4>
            <div className="space-y-2">
              {securityPosture.recommendations.slice(0, 3).map((rec, index) => (
                <div
                  key={rec.id}
                  className="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                >
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      rec.priority === 'CRITICAL' ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300' :
                      rec.priority === 'HIGH' ? 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300' :
                      rec.priority === 'MEDIUM' ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300' :
                      'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                    }`}
                  >
                    {rec.priority}
                  </Badge>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {rec.title}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {rec.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Last assessed: {new Date(securityPosture.lastAssessed).toLocaleDateString()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchSecurityPosture()}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {!compact && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push('/analytics/posture')}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
