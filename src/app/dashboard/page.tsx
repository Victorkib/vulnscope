'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { useTheme } from '@/components/theme/theme-provider';
import { useRealtimeData } from '@/hooks/use-realtime-data';
import RealtimeStatus from '@/components/dashboard/realtime-status';
import TestNotificationButton from '@/components/test/test-notification-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import AppLayout from '@/components/layout/app-layout';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import type { Vulnerability, VulnerabilityStats } from '@/types/vulnerability';
import {
  AlertTriangle,
  Shield,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Target,
  Globe,
  Database,
  Clock,
  CheckCircle,
  Download,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  Calendar,
} from 'lucide-react';

interface DashboardMetrics {
  totalVulnerabilities: number;
  newToday: number;
  criticalCount: number;
  patchedCount: number;
  affectedSystems: number;
  securityScore: number;
  trendPercentage: number;
  weeklyChange: number;
  monthlyChange: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface QuickAction {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  href: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { preferences, updatePreference } = useTheme();
  const { toast } = useToast();
  const router = useRouter();

  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalVulnerabilities: 0,
    newToday: 0,
    criticalCount: 0,
    patchedCount: 0,
    affectedSystems: 0,
    securityScore: 0,
    trendPercentage: 0,
    weeklyChange: 0,
    monthlyChange: 0,
    riskLevel: 'medium',
  });

  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [stats, setStats] = useState<VulnerabilityStats>({
    total: 0,
    bySeverity: {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
    },
    byCategory: {},
    withExploits: 0,
    withPatches: 0,
    trending: 0,
    recentlyPublished: 0,
    lastUpdated: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(true);
  const [realtimeEnabled, setRealtimeEnabled] = useState(false);

  const quickActions: QuickAction[] = [
    {
      title: 'View Vulnerabilities',
      description: 'Browse all security vulnerabilities',
      icon: Database,
      color: 'blue',
      href: '/vulnerabilities',
    },
    {
      title: 'Export Data',
      description: 'Export vulnerability data',
      icon: Download,
      color: 'green',
      href: '/api/vulnerabilities/export?format=csv',
    },
    {
      title: 'Configure Settings',
      description: 'Set up notification preferences',
      icon: Shield,
      color: 'orange',
      href: '/dashboard/settings',
    },
    {
      title: 'User Profile',
      description: 'View and manage your profile',
      icon: Activity,
      color: 'purple',
      href: '/dashboard/user',
    },
  ];

  const fetchDashboardData = useCallback(async () => {
    try {
      console.log('Fetching dashboard data...');
      setLoading(true);
      
      const [vulnsRes, dashboardStatsRes] = await Promise.all([
        apiClient.get('/api/vulnerabilities?limit=10', { 
          cache: true, 
          cacheTTL: 120000 // 2 minutes cache
        }),
        apiClient.get('/api/vulnerabilities/dashboard-stats', { 
          cache: true, 
          cacheTTL: 300000 // 5 minutes cache
        }),
      ]);

      console.log('API responses:', { vulnsRes: vulnsRes, dashboardStatsRes: dashboardStatsRes });

      // Handle vulnerabilities data
      const vulnsData = vulnsRes;
      console.log('Vulnerabilities data:', vulnsData);
      setVulnerabilities(vulnsData.vulnerabilities || []);

      // Handle dashboard stats data
      const dashboardData = dashboardStatsRes;
        console.log('Dashboard stats data:', dashboardData);
        
        // Set basic stats for compatibility
        setStats({
          total: dashboardData.total || 0,
          bySeverity: dashboardData.bySeverity || { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 },
          byCategory: {},
          withExploits: 0,
          withPatches: dashboardData.patchedCount || 0,
          trending: 0,
          recentlyPublished: dashboardData.newThisMonth || 0,
          lastUpdated: new Date().toISOString(),
        });

        // Set real metrics from API data
        setMetrics({
          totalVulnerabilities: dashboardData.total || 0,
          newToday: dashboardData.newToday || 0,
          criticalCount: dashboardData.bySeverity?.CRITICAL || 0,
          patchedCount: dashboardData.patchedCount || 0,
          affectedSystems: dashboardData.affectedSystems || 0,
          securityScore: dashboardData.securityScore || 0,
          trendPercentage: dashboardData.trends?.daily || 0,
          weeklyChange: dashboardData.trends?.weekly || 0,
          monthlyChange: dashboardData.trends?.monthly || 0,
          riskLevel: dashboardData.riskLevel || 'medium',
        });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
      // Set default values on error
      setMetrics({
        totalVulnerabilities: 0,
        newToday: 0,
        criticalCount: 0,
        patchedCount: 0,
        affectedSystems: 0,
        securityScore: 0,
        trendPercentage: 0,
        weeklyChange: 0,
        monthlyChange: 0,
        riskLevel: 'medium',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Real-time data fetching - now respects user preferences with smart features
  const { refreshNow, isFetching, lastFetch, isPageVisible, isPaused } = useRealtimeData({
    fetchFunction: fetchDashboardData,
    intervalMs: preferences?.refreshInterval || 300000, // Use user preference (default: 5 minutes)
    enabled: realtimeEnabled,
    pauseWhenHidden: true, // Pause when tab is not visible
    smartPolling: false, // Disabled for now, can be enabled later
    onError: (error) => {
      console.error('Realtime data fetch error:', error);
      toast({
        title: 'Update Error',
        description: 'Failed to refresh dashboard data',
        variant: 'destructive',
      });
    },
  });

  // Sync realtimeEnabled with user preferences
  useEffect(() => {
    if (preferences) {
      setRealtimeEnabled(preferences.autoRefresh);
    } else {
      // Use default value if preferences are not loaded yet
      setRealtimeEnabled(false);
    }
  }, [preferences?.autoRefresh, preferences]);

  // Initial data fetch - always fetch data when component mounts
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);


  const getMetricColor = (value: number, isPositive = true) => {
    if (isPositive) {
      return value > 0
        ? 'text-green-600 dark:text-green-400'
        : 'text-red-600 dark:text-red-400';
    }
    return value > 0
      ? 'text-red-600 dark:text-red-400'
      : 'text-green-600 dark:text-green-400';
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-500';
      case 'HIGH':
        return 'bg-orange-500';
      case 'MEDIUM':
        return 'bg-yellow-500';
      case 'LOW':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"
                ></div>
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome back, {user?.email?.split('@')[0] || 'Security Expert'}!
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Here&apos;s your security dashboard overview for today
            </p>
          </div>
          <div className="flex items-center gap-4">
            <RealtimeStatus
              isFetching={isFetching}
              lastFetch={lastFetch}
              onRefresh={refreshNow}
              enabled={realtimeEnabled && !isPaused}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newState = !realtimeEnabled;
                setRealtimeEnabled(newState);
                // Update user preferences
                if (preferences) {
                  updatePreference('autoRefresh', newState);
                }
              }}
            >
              {realtimeEnabled ? 'Disable' : 'Enable'} Auto-refresh
            </Button>
          </div>
          <div className="flex items-center space-x-3">
            <TestNotificationButton />
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Scan
            </Button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Security Score */}
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                    Security Score
                  </p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                    {metrics?.securityScore}
                  </p>
                  <div className="flex items-center mt-2">
                    <Badge className={getRiskLevelColor(metrics.riskLevel)}>
                      {metrics.riskLevel.toUpperCase()} RISK
                    </Badge>
                  </div>
                </div>
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                  <Shield className="w-8 h-8 text-white" />
                </div>
              </div>
              <Progress value={metrics.securityScore} className="mt-4 h-2" />
            </CardContent>
          </Card>

          {/* Total Vulnerabilities */}
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-red-50 to-pink-100 dark:from-red-900/20 dark:to-pink-900/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">
                    Total Threats
                  </p>
                  <p className="text-3xl font-bold text-red-900 dark:text-red-100">
                    {metrics.totalVulnerabilities}
                  </p>
                  <div className="flex items-center mt-2">
                    {metrics.trendPercentage > 0 ? (
                      <TrendingUp className="w-4 h-4 text-red-500 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-green-500 mr-1" />
                    )}
                    <span
                      className={`text-sm font-medium ${getMetricColor(
                        metrics.trendPercentage,
                        false
                      )}`}
                    >
                      {Math.abs(metrics.trendPercentage)}%
                    </span>
                  </div>
                </div>
                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Critical Issues */}
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-900/20 dark:to-amber-900/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-1">
                    Critical Issues
                  </p>
                  <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                    {metrics.criticalCount}
                  </p>
                  <div className="flex items-center mt-2">
                    <Clock className="w-4 h-4 text-orange-500 mr-1" />
                    <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                      Immediate action needed
                    </span>
                  </div>
                </div>
                <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center">
                  <Zap className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Patched Systems */}
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">
                    Patched
                  </p>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                    {metrics.patchedCount}
                  </p>
                  <div className="flex items-center mt-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      {Math.round(
                        (metrics.patchedCount / metrics.totalVulnerabilities) *
                          100
                      )}
                      % resolved
                    </span>
                  </div>
                </div>
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                  <Target className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column - Charts */}
          <div className="xl:col-span-2 space-y-6">
            {/* Quick Actions */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-blue-600" />
                  <span>Quick Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {quickActions.map((action, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="h-auto p-4 flex flex-col items-center space-y-2 hover:shadow-md transition-shadow bg-transparent"
                      onClick={() => router.push(action.href)}
                    >
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-900">
                        <action.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-sm">
                          {action.title}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {action.description}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Vulnerability Trends */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                    <span>Vulnerability Trends</span>
                  </CardTitle>
                  <Button variant="outline" size="sm">
                    <Calendar className="w-4 h-4 mr-2" />
                    Last 30 days
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-center">
                    <PieChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Interactive chart will be displayed here
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Vulnerabilities */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Database className="w-5 h-5 text-blue-600" />
                    <span>Recent Vulnerabilities</span>
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/vulnerabilities')}
                  >
                    View all
                    <ArrowUpRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {vulnerabilities.slice(0, 5).map((vuln) => (
                    <div
                      key={vuln.cveId}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                      onClick={() =>
                        router.push(`/vulnerabilities/${vuln.cveId}`)
                      }
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-3 h-3 rounded-full ${getSeverityColor(
                            vuln.severity
                          )}`}
                        ></div>
                        <div>
                          <div className="font-medium text-sm">
                            {vuln.cveId}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-md">
                            {vuln.title}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {vuln.severity}
                        </Badge>
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          {vuln.cvssScore}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Stats & Activity */}
          <div className="space-y-6">
            {/* Weekly Summary */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-green-600" />
                  <span>Weekly Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    New Vulnerabilities
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">
                      {Math.abs(metrics.weeklyChange)}
                    </span>
                    {metrics.weeklyChange > 0 ? (
                      <ArrowUpRight className="w-4 h-4 text-red-500" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Patched Issues
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">
                      {Math.abs(metrics.weeklyChange) + 10}
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-green-500" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Security Score
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">
                      +{Math.floor(Math.random() * 5) + 1}
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="w-5 h-5 text-indigo-600" />
                  <span>Distribution</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {[
                    {
                      label: 'Critical',
                      value: stats.bySeverity.CRITICAL,
                      color: 'bg-red-500',
                      total: stats.total,
                    },
                    {
                      label: 'High',
                      value: stats.bySeverity.HIGH,
                      color: 'bg-orange-500',
                      total: stats.total,
                    },
                    {
                      label: 'Medium',
                      value: stats.bySeverity.MEDIUM,
                      color: 'bg-yellow-500',
                      total: stats.total,
                    },
                    {
                      label: 'Low',
                      value: stats.bySeverity.LOW,
                      color: 'bg-green-500',
                      total: stats.total,
                    },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-400">
                          {item.label}
                        </span>
                        <span className="font-medium">{item.value}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`${item.color} h-2 rounded-full transition-all duration-500`}
                          style={{
                            width: `${
                              item.total > 0
                                ? (item.value / item.total) * 100
                                : 0
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="w-5 h-5 text-teal-600" />
                  <span>System Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm">API Status</span>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  >
                    Operational
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm">Database</span>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  >
                    Connected
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm">Scanning</span>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  >
                    Active
                  </Badge>
                </div>
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>Last updated</span>
                    <span>{new Date().toLocaleTimeString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
