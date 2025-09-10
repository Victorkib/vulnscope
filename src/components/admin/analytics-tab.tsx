'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart3,
  TrendingUp,
  Users,
  Shield,
  Activity,
  Calendar,
  Download,
  RefreshCw,
  Loader2,
  AlertCircle,
  Eye,
  UserCheck,
  UserX,
  AlertTriangle,
  Database,
  Clock
} from 'lucide-react';

interface AnalyticsData {
  users: {
    total: number;
    active: number;
    suspended: number;
    newToday: number;
    growthRate: number;
    byRole: { role: string; count: number }[];
    byDay: { date: string; count: number }[];
  };
  system: {
    uptime: number;
    responseTime: number;
    errorRate: number;
    throughput: number;
    databaseSize: number;
    collectionCount: number;
  };
  security: {
    totalAlerts: number;
    activeAlerts: number;
    resolvedAlerts: number;
    failedLogins: number;
    suspiciousActivity: number;
    bySeverity: { severity: string; count: number }[];
    byDay: { date: string; count: number }[];
  };
  admin: {
    totalActions: number;
    actionsByAdmin: { adminEmail: string; count: number }[];
    actionsByType: { action: string; count: number }[];
    byDay: { date: string; count: number }[];
  };
}

export function AnalyticsTab() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch data from multiple endpoints
      const [usersResponse, systemResponse, securityResponse, auditResponse] = await Promise.all([
        fetch('/api/admin/regular-users'),
        fetch('/api/admin/system/performance'),
        fetch('/api/admin/security/alerts'),
        fetch('/api/admin/audit-logs?limit=1000')
      ]);

      const [usersData, systemData, securityData, auditData] = await Promise.all([
        usersResponse.json(),
        systemResponse.json(),
        securityResponse.json(),
        auditResponse.json()
      ]);

      // Process and combine the data
      const processedData: AnalyticsData = {
        users: {
          total: usersData.data?.pagination?.total || 0,
          active: usersData.data?.filter((u: any) => u.isActive).length || 0,
          suspended: usersData.data?.filter((u: any) => !u.isActive).length || 0,
          newToday: 0, // Would need additional API endpoint
          growthRate: 5.2, // Mock data
          byRole: [
            { role: 'user', count: usersData.data?.filter((u: any) => u.role === 'user').length || 0 },
            { role: 'admin', count: usersData.data?.filter((u: any) => u.role === 'admin').length || 0 },
            { role: 'moderator', count: usersData.data?.filter((u: any) => u.role === 'moderator').length || 0 },
            { role: 'analyst', count: usersData.data?.filter((u: any) => u.role === 'analyst').length || 0 }
          ],
          byDay: [] // Would need time-series data
        },
        system: {
          uptime: systemData.data?.system?.uptime || 0,
          responseTime: systemData.data?.trends?.responseTime?.average || 0,
          errorRate: systemData.data?.trends?.errorRate?.percentage || 0,
          throughput: systemData.data?.trends?.throughput?.requestsPerSecond || 0,
          databaseSize: systemData.data?.database?.stats?.dataSize || 0,
          collectionCount: systemData.data?.database?.stats?.collections || 0
        },
        security: {
          totalAlerts: securityData.data?.pagination?.total || 0,
          activeAlerts: securityData.data?.filter((a: any) => a.status === 'active').length || 0,
          resolvedAlerts: securityData.data?.filter((a: any) => a.status === 'resolved').length || 0,
          failedLogins: 0, // Mock data
          suspiciousActivity: 0, // Mock data
          bySeverity: [
            { severity: 'low', count: securityData.data?.filter((a: any) => a.severity === 'low').length || 0 },
            { severity: 'medium', count: securityData.data?.filter((a: any) => a.severity === 'medium').length || 0 },
            { severity: 'high', count: securityData.data?.filter((a: any) => a.severity === 'high').length || 0 },
            { severity: 'critical', count: securityData.data?.filter((a: any) => a.severity === 'critical').length || 0 }
          ],
          byDay: [] // Would need time-series data
        },
        admin: {
          totalActions: auditData.data?.length || 0,
          actionsByAdmin: [], // Would need aggregation
          actionsByType: [], // Would need aggregation
          byDay: [] // Would need time-series data
        }
      };

      setAnalyticsData(processedData);
    } catch (err) {
      setError('Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalyticsData();
    setRefreshing(false);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!analyticsData) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>No analytics data available</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">System performance and usage insights</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="admin">Admin Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.users.total}</div>
                <p className="text-xs text-muted-foreground">
                  +{analyticsData.users.growthRate}% from last period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatUptime(analyticsData.system.uptime)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {analyticsData.system.responseTime}ms avg response
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Security Alerts</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.security.totalAlerts}</div>
                <p className="text-xs text-muted-foreground">
                  {analyticsData.security.activeAlerts} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Admin Actions</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.admin.totalActions}</div>
                <p className="text-xs text-muted-foreground">
                  This period
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UserCheck className="h-5 w-5" />
                  <span>User Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Users</span>
                    <Badge variant="default">{analyticsData.users.active}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Suspended Users</span>
                    <Badge variant="destructive">{analyticsData.users.suspended}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">New Today</span>
                    <Badge variant="outline">{analyticsData.users.newToday}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <span>System Health</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Error Rate</span>
                    <Badge variant={analyticsData.system.errorRate > 1 ? "destructive" : "default"}>
                      {analyticsData.system.errorRate}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Throughput</span>
                    <Badge variant="outline">
                      {analyticsData.system.throughput} req/s
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Database Size</span>
                    <Badge variant="outline">
                      {formatBytes(analyticsData.system.databaseSize)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>User Analytics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-4">Users by Role</h4>
                  <div className="space-y-3">
                    {analyticsData.users.byRole.map((role) => (
                      <div key={role.role} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{role.role}</span>
                        <Badge variant="outline">{role.count}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-4">User Growth</h4>
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-2" />
                    <p>Growth chart would be displayed here</p>
                    <p className="text-xs">Requires time-series data</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>System Performance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-4">Performance Metrics</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Response Time</span>
                      <Badge variant="outline">{analyticsData.system.responseTime}ms</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Error Rate</span>
                      <Badge variant={analyticsData.system.errorRate > 1 ? "destructive" : "default"}>
                        {analyticsData.system.errorRate}%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Throughput</span>
                      <Badge variant="outline">{analyticsData.system.throughput} req/s</Badge>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-4">Database Stats</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Collections</span>
                      <Badge variant="outline">{analyticsData.system.collectionCount}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Size</span>
                      <Badge variant="outline">{formatBytes(analyticsData.system.databaseSize)}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Uptime</span>
                      <Badge variant="outline">{formatUptime(analyticsData.system.uptime)}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Security Analytics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-4">Alerts by Severity</h4>
                  <div className="space-y-3">
                    {analyticsData.security.bySeverity.map((severity) => (
                      <div key={severity.severity} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{severity.severity}</span>
                        <Badge variant="outline">{severity.count}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-4">Alert Status</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Alerts</span>
                      <Badge variant="outline">{analyticsData.security.totalAlerts}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Active</span>
                      <Badge variant="destructive">{analyticsData.security.activeAlerts}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Resolved</span>
                      <Badge variant="default">{analyticsData.security.resolvedAlerts}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admin" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Admin Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                <p>Admin activity analytics would be displayed here</p>
                <p className="text-xs">Requires aggregation of audit logs</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
