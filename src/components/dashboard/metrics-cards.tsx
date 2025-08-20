'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { VulnerabilityStats } from '@/types/vulnerability';
import {
  AlertTriangle,
  Shield,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
} from 'lucide-react';

interface MetricsCardsProps {
  stats: VulnerabilityStats;
  isLoading?: boolean;
}

export default function MetricsCards({
  stats,
  isLoading = false,
}: MetricsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-2 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const totalVulns = stats.total;
  const criticalPercentage =
    totalVulns > 0 ? (stats.critical / totalVulns) * 100 : 0;
  const highPercentage = totalVulns > 0 ? (stats.high / totalVulns) * 100 : 0;
  const mediumPercentage =
    totalVulns > 0 ? (stats.medium / totalVulns) * 100 : 0;
  const lowPercentage = totalVulns > 0 ? (stats.low / totalVulns) * 100 : 0;

  const getChangeIndicator = (current: number, previous = 0) => {
    if (previous === 0) return null;
    const change = ((current - previous) / previous) * 100;
    const isIncrease = change > 0;

    return (
      <div
        className={`flex items-center space-x-1 text-xs ${
          isIncrease ? 'text-red-500' : 'text-green-500'
        }`}
      >
        {isIncrease ? (
          <TrendingUp className="h-3 w-3" />
        ) : (
          <TrendingDown className="h-3 w-3" />
        )}
        <span>{Math.abs(change).toFixed(1)}%</span>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Vulnerabilities */}
      <Card className="bg-white/10 border-white/20 backdrop-blur-sm hover:bg-white/15 transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-white/80">
            Total Vulnerabilities
          </CardTitle>
          <Activity className="h-4 w-4 text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="flex items-end space-x-2">
            <div className="text-2xl font-bold text-white">
              {totalVulns?.toLocaleString() || 0}
            </div>
            {getChangeIndicator(totalVulns)}
          </div>
          <Progress value={100} className="mt-3 h-2" />
          <p className="text-xs text-white/60 mt-2">
            Across all severity levels
          </p>
        </CardContent>
      </Card>

      {/* Critical Vulnerabilities */}
      <Card className="bg-gradient-to-br from-red-500/20 to-red-600/10 border-red-500/30 backdrop-blur-sm hover:from-red-500/30 hover:to-red-600/20 transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-white/80">
            Critical Issues
          </CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-400" />
        </CardHeader>
        <CardContent>
          <div className="flex items-end space-x-2">
            <div className="text-2xl font-bold text-white">
              {stats.critical}
            </div>
            <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-xs">
              {criticalPercentage.toFixed(1)}%
            </Badge>
          </div>
          <Progress value={criticalPercentage} className="mt-3 h-2" />
          <p className="text-xs text-red-200 mt-2">
            Requires immediate attention
          </p>
        </CardContent>
      </Card>

      {/* High Severity */}
      <Card className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 border-orange-500/30 backdrop-blur-sm hover:from-orange-500/30 hover:to-orange-600/20 transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-white/80">
            High Severity
          </CardTitle>
          <Zap className="h-4 w-4 text-orange-400" />
        </CardHeader>
        <CardContent>
          <div className="flex items-end space-x-2">
            <div className="text-2xl font-bold text-white">{stats.high}</div>
            <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 text-xs">
              {highPercentage.toFixed(1)}%
            </Badge>
          </div>
          <Progress value={highPercentage} className="mt-3 h-2" />
          <p className="text-xs text-orange-200 mt-2">
            Priority remediation needed
          </p>
        </CardContent>
      </Card>

      {/* Medium & Low Combined */}
      <Card className="bg-gradient-to-br from-green-500/20 to-blue-500/20 border-green-500/30 backdrop-blur-sm hover:from-green-500/30 hover:to-blue-500/30 transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-white/80">
            Medium & Low
          </CardTitle>
          <Shield className="h-4 w-4 text-green-400" />
        </CardHeader>
        <CardContent>
          <div className="flex items-end space-x-2">
            <div className="text-2xl font-bold text-white">
              {stats?.bySeverity?.medium + stats?.bySeverity?.low}
            </div>
            <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
              {(mediumPercentage + lowPercentage).toFixed(1)}%
            </Badge>
          </div>
          <div className="flex space-x-2 mt-3">
            <div className="flex-1">
              <div className="flex justify-between text-xs text-white/60 mb-1">
                <span>Medium</span>
                <span>{stats.medium}</span>
              </div>
              <Progress value={mediumPercentage} className="h-1" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-xs text-white/60 mb-1">
                <span>Low</span>
                <span>{stats.low}</span>
              </div>
              <Progress value={lowPercentage} className="h-1" />
            </div>
          </div>
          <p className="text-xs text-green-200 mt-2">Manageable risk levels</p>
        </CardContent>
      </Card>
    </div>
  );
}
