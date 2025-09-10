'use client';

import { useState, useEffect } from 'react';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { useAuth } from '@/components/auth/auth-provider';
import { usePreferences } from '@/contexts/preferences-context';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Users,
  Shield,
  Database,
  Activity,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Settings,
  UserCheck,
  FileText,
  BarChart3,
  Bug
} from 'lucide-react';
import type { AdminDashboardStats } from '@/types/admin';
import { UserManagementTab } from '@/components/admin/user-management-tab';
import { SecurityAuditTab } from '@/components/admin/security-audit-tab';
import { SystemManagementTab } from '@/components/admin/system-management-tab';
import { AnalyticsTab } from '@/components/admin/analytics-tab';
import { VulnerabilityManagementTab } from '@/components/admin/vulnerability-management-tab';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { preferences } = usePreferences();
  const router = useRouter();
  const { isAdmin, adminUser, loading, error, hasPermission } = useAdminAuth();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Redirect if not admin
  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/dashboard');
    }
  }, [isAdmin, loading, router]);

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      setStatsError(null);
      
      const response = await fetch('/api/admin/dashboard/stats');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      } else {
        setStatsError(data.error || 'Failed to fetch stats');
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      setStatsError('Failed to fetch dashboard stats');
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
    }
  }, [isAdmin]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (error || !isAdmin) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Alert className="max-w-md">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              {error || 'Admin access required'}
            </AlertDescription>
          </Alert>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className={`space-y-6 ${preferences.dashboardLayout === 'compact' ? 'space-y-4' : preferences.dashboardLayout === 'spacious' ? 'space-y-8' : 'space-y-6'}`}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className={`font-bold tracking-tight ${preferences.fontSize === 'small' ? 'text-2xl' : preferences.fontSize === 'large' ? 'text-4xl' : 'text-3xl'}`}>
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">
              Welcome back, {adminUser?.email} ({adminUser?.role})
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-sm">
              {adminUser?.role}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchStats}
              disabled={statsLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${statsLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className={`grid gap-4 ${preferences.dashboardLayout === 'compact' ? 'gap-3' : preferences.dashboardLayout === 'spacious' ? 'gap-6' : 'gap-4'} md:grid-cols-2 lg:grid-cols-4`}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  stats?.totalUsers || 0
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.newUsersToday || 0} new today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  stats?.activeUsers || 0
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.suspendedUsers || 0} suspended
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vulnerabilities</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  stats?.totalVulnerabilities || 0
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.newVulnerabilitiesToday || 0} new today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <Badge variant={stats?.systemHealth.databaseStatus === 'healthy' ? 'default' : 'destructive'}>
                    {stats?.systemHealth.databaseStatus || 'Unknown'}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.systemHealth.uptime || 0}% uptime
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className={`space-y-4 ${preferences.dashboardLayout === 'compact' ? 'space-y-3' : preferences.dashboardLayout === 'spacious' ? 'space-y-6' : 'space-y-4'}`}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            {hasPermission('user_management') && (
              <TabsTrigger value="users">User Management</TabsTrigger>
            )}
            {hasPermission('vulnerability_management') && (
              <TabsTrigger value="vulnerabilities">Vulnerabilities</TabsTrigger>
            )}
            {hasPermission('security_audit') && (
              <TabsTrigger value="security">Security</TabsTrigger>
            )}
            {hasPermission('analytics_access') && (
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            )}
            {hasPermission('system_config') && (
              <TabsTrigger value="system">System</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Recent Admin Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>Recent Admin Actions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {statsLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : stats?.recentAdminActions && stats.recentAdminActions.length > 0 ? (
                    <div className="space-y-3">
                      {stats.recentAdminActions.slice(0, 5).map((action, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <div>
                            <p className="font-medium">{action.action}</p>
                            <p className="text-muted-foreground">
                              by {action.adminEmail}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-muted-foreground">
                              {new Date(action.timestamp).toLocaleDateString()}
                            </p>
                            <Badge variant={action.success ? 'default' : 'destructive'} className="text-xs">
                              {action.success ? 'Success' : 'Failed'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      No recent admin actions
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Security Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5" />
                    <span>Security Alerts</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {statsLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Failed Logins</span>
                        <Badge variant="outline">
                          {stats?.securityAlerts.failedLogins || 0}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Suspicious Activity</span>
                        <Badge variant="outline">
                          {stats?.securityAlerts.suspiciousActivity || 0}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Policy Violations</span>
                        <Badge variant="outline">
                          {stats?.securityAlerts.policyViolations || 0}
                        </Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            {hasPermission('user_management') ? (
              <UserManagementTab />
            ) : (
              <Alert>
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  You don't have permission to access user management.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="vulnerabilities" className="space-y-4">
            {hasPermission('vulnerability_management') ? (
              <VulnerabilityManagementTab />
            ) : (
              <Alert>
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  You don't have permission to access vulnerability management.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            {hasPermission('security_audit') ? (
              <SecurityAuditTab />
            ) : (
              <Alert>
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  You don't have permission to access security features.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            {hasPermission('analytics_access') ? (
              <AnalyticsTab />
            ) : (
              <Alert>
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  You don't have permission to access analytics.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            {hasPermission('system_config') ? (
              <SystemManagementTab />
            ) : (
              <Alert>
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  You don't have permission to access system configuration.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
