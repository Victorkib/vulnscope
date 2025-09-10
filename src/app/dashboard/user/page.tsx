'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { useTheme } from '@/components/theme/theme-provider';
import { usePreferences } from '@/contexts/preferences-context';
import { useRealtimeData } from '@/hooks/use-realtime-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/components/layout/app-layout';
import { useToast } from '@/hooks/use-toast';
import { useUserData } from '@/hooks/use-api';
import { formatRelativeTime, getSeverityBadgeColor } from '@/lib/utils';
import type { Vulnerability } from '@/types/vulnerability';
import {
  Plus,
  Settings,
  Bell,
  Search,
  Filter,
  Zap,
  Target,
  Calendar,
  Clock,
  BarChart3,
  PieChart,
  ActivityIcon,
  RefreshCw,
  Bookmark,
  Eye,
  Download,
} from 'lucide-react';
import type { UserActivity, UserBookmark, UserStats } from '@/types/user';
import UserStatsCards from '@/components/dashboard/user-stats-cards';
import ActivityFeed from '@/components/dashboard/activity-feed';
import BookmarksManager from '@/components/dashboard/bookmarks-manager';

interface SavedSearch {
  id: string;
  name: string;
  description?: string;
  filters: Record<string, unknown>;
  createdAt: string;
  lastUsed: string;
  useCount: number;
}

export default function UserDashboardPage() {
  const { user } = useAuth();
  const { preferences } = usePreferences();
  const router = useRouter();
  const { toast } = useToast();

  const [refreshing, setRefreshing] = useState(false);

  // Use the optimized hook for user data
  const {
    stats,
    activities,
    bookmarks,
    savedSearches,
    loading,
    error,
    fetchUserData,
    updateBookmark,
    deleteBookmark,
    logActivity,
  } = useUserData();

  // Handle errors from the hook
  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load user data. Please refresh the page.',
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  // Auto-refresh functionality
  const { refreshNow, isFetching, lastFetch } = useRealtimeData({
    fetchFunction: fetchUserData,
    intervalMs: preferences?.refreshInterval || 300000, // Use user preference (default: 5 minutes)
    enabled: preferences?.autoRefresh || false, // Respect user preference
    pauseWhenHidden: true, // Pause when tab is not visible
    onError: (error) => {
      console.error('User dashboard data fetch error:', error);
      toast({
        title: 'Update Error',
        description: 'Failed to refresh user data',
        variant: 'destructive',
      });
    },
  });

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user, fetchUserData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshNow(); // Use the auto-refresh function
    setRefreshing(false);
    toast({
      title: 'Data Refreshed',
      description:
        'Your dashboard has been updated with the latest information.',
    });
  };

  const handleUpdateBookmark = async (
    bookmarkId: string,
    updates: Partial<UserBookmark>
  ) => {
    try {
      await updateBookmark(bookmarkId, updates);
      toast({
        title: 'Bookmark Updated',
        description: 'Your bookmark has been successfully updated.',
      });
    } catch (error) {
      console.error('Error updating bookmark:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to update bookmark. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleDeleteBookmark = async (bookmarkId: string) => {
    try {
      await deleteBookmark(bookmarkId);
      toast({
        title: 'Bookmark Deleted',
        description: 'Your bookmark has been successfully removed.',
      });
    } catch (error) {
      console.error('Error deleting bookmark:', error);
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete bookmark. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleViewVulnerability = (vulnerabilityId: string) => {
    // Log view activity (non-blocking)
    logActivity({
      type: 'view',
      description: `Viewed vulnerability ${vulnerabilityId}`,
      vulnerabilityId,
      metadata: { source: 'user_dashboard' },
    });

    router.push(`/vulnerabilities/${vulnerabilityId}`);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getActivitySummary = () => {
    const today = new Date().toDateString();
    const todayActivities = activities.filter(
      (activity) => new Date(activity.timestamp).toDateString() === today
    );
    return todayActivities.length;
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 space-y-6">
          <div className="animate-pulse space-y-8">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"
                ></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-600/10 rounded-2xl" />
          <div className="relative p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/20 shadow-2xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-6 lg:space-y-0">
              <div className="flex items-center space-x-6">
                <Avatar className="h-24 w-24 border-4 border-white dark:border-gray-700 shadow-xl">
                  <AvatarFallback className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                    {user?.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                    {getGreeting()},{' '}
                    {user?.email?.split('@')[0] || 'Security Expert'}!
                  </h1>
                  <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
                    Here&apos;s your personalized vulnerability intelligence
                    dashboard
                  </p>
                  <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-2">
                      <ActivityIcon className="h-4 w-4" />
                      <span>{getActivitySummary()} activities today</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>
                        Last active:{' '}
                        {activities[0]
                          ? new Date(
                              activities[0].timestamp
                            ).toLocaleTimeString()
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>{stats.weeklyActivity} actions this week</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3">
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700"
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${
                      refreshing ? 'animate-spin' : ''
                    }`}
                  />
                  Refresh
                </Button>
                <Button
                  onClick={() => router.push('/dashboard/settings')}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
                <Button
                  variant="outline"
                  className="bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Alert
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <UserStatsCards stats={stats} isLoading={loading} />

        {/* Quick Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                    Security Focus
                  </p>
                  <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                    {stats.mostViewedSeverity}
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                    Most viewed severity
                  </p>
                </div>
                <Target className="h-8 w-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                    Engagement
                  </p>
                  <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                    {Math.round(stats.averageSessionTime)}m
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    Average session time
                  </p>
                </div>
                <Clock className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-violet-700 dark:text-violet-300">
                    Productivity
                  </p>
                  <p className="text-2xl font-bold text-violet-900 dark:text-violet-100">
                    {stats.monthlyActivity}
                  </p>
                  <p className="text-xs text-violet-600 dark:text-violet-400 mt-1">
                    Monthly actions
                  </p>
                </div>
                <Zap className="h-8 w-8 text-violet-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 lg:w-auto bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <TabsTrigger
              value="overview"
              className="flex items-center space-x-2"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger
              value="bookmarks"
              className="flex items-center space-x-2"
            >
              <Bookmark className="h-4 w-4" />
              <span>Bookmarks</span>
              <Badge variant="secondary" className="ml-1">
                {bookmarks.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="flex items-center space-x-2"
            >
              <ActivityIcon className="h-4 w-4" />
              <span>Activity</span>
            </TabsTrigger>
            <TabsTrigger
              value="recent-views"
              className="flex items-center space-x-2"
            >
              <Eye className="h-4 w-4" />
              <span>Recent Views</span>
              <Badge variant="secondary" className="ml-1">
                {activities.filter(activity => activity.type === 'view').length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="searches"
              className="flex items-center space-x-2"
            >
              <Filter className="h-4 w-4" />
              <span>Searches</span>
              <Badge variant="secondary" className="ml-1">
                {savedSearches.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center space-x-2">
              <Bell className="h-4 w-4" />
              <span>Alerts</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <ActivityFeed
                activities={activities.slice(0, 10)}
                isLoading={loading}
                onRefresh={handleRefresh}
              />
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <PieChart className="h-5 w-5 text-indigo-500" />
                    <span>Quick Stats</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <Bookmark className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                          Total Bookmarks
                        </span>
                      </div>
                      <Badge className="bg-blue-500">
                        {stats.totalBookmarks}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <Eye className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-medium text-green-900 dark:text-green-100">
                          Vulnerabilities Viewed
                        </span>
                      </div>
                      <Badge className="bg-green-500">{stats.totalViews}</Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <Search className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
                          Searches Performed
                        </span>
                      </div>
                      <Badge className="bg-purple-500">
                        {stats.totalSearches}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <Download className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        <span className="text-sm font-medium text-orange-900 dark:text-orange-100">
                          Data Exports
                        </span>
                      </div>
                      <Badge className="bg-orange-500">
                        {stats.totalExports}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="bookmarks" className="space-y-6">
            <BookmarksManager
              bookmarks={bookmarks}
              isLoading={loading}
              onUpdateBookmark={handleUpdateBookmark}
              onDeleteBookmark={handleDeleteBookmark}
              onViewVulnerability={handleViewVulnerability}
            />
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <ActivityFeed
              activities={activities}
              isLoading={loading}
              onRefresh={handleRefresh}
            />
          </TabsContent>

          <TabsContent value="recent-views" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="h-5 w-5 text-green-500" />
                  <span>Recent Vulnerability Views</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activities.filter(activity => activity.type === 'view').length > 0 ? (
                  <div className="space-y-3">
                    {activities
                      .filter(activity => activity.type === 'view')
                      .slice(0, 10)
                      .map((activity) => (
                        <div
                          key={activity.id}
                          className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-green-300 dark:hover:border-green-600 transition-colors bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 hover:from-green-50 hover:to-emerald-50 dark:hover:from-green-900/20 dark:hover:to-emerald-900/20 cursor-pointer"
                          onClick={() => handleViewVulnerability(activity.vulnerabilityId || '')}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-mono text-sm text-green-600 dark:text-green-400 font-medium">
                                  {activity.vulnerabilityId}
                                </span>
                                {activity.vulnerability && (
                                  <Badge 
                                    variant="outline" 
                                    className={getSeverityBadgeColor(activity.vulnerability.severity)}
                                  >
                                    {activity.vulnerability.severity}
                                  </Badge>
                                )}
                              </div>
                              {activity.vulnerability && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                  {activity.vulnerability.title}
                                </p>
                              )}
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                Viewed {formatRelativeTime(activity.timestamp)}
                              </p>
                            </div>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      No Recent Views
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Start exploring vulnerabilities to see your viewing history here
                    </p>
                    <Button onClick={() => router.push('/vulnerabilities')}>
                      <Search className="h-4 w-4 mr-2" />
                      Browse Vulnerabilities
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="searches" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Search className="h-5 w-5 text-purple-500" />
                  <span>Saved Searches</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {savedSearches.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {savedSearches.map((search) => (
                      <div
                        key={search.id}
                        className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-purple-300 dark:hover:border-purple-600 transition-colors bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 hover:from-purple-50 hover:to-indigo-50 dark:hover:from-purple-900/20 dark:hover:to-indigo-900/20"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {search.name}
                          </h4>
                          <Button variant="ghost" size="sm">
                            <Search className="h-4 w-4" />
                          </Button>
                        </div>
                        {search.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {search.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span>Used {search.useCount} times</span>
                          <span>
                            Last used:{' '}
                            {new Date(search.lastUsed).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Filter className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No saved searches
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Save your frequent searches for quick access
                    </p>
                    <Button onClick={() => router.push('/vulnerabilities')}>
                      <Search className="h-4 w-4 mr-2" />
                      Start Searching
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5 text-red-500" />
                  <span>Alert Management</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Bell className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Advanced Alert System
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Set up intelligent alerts for new vulnerabilities matching
                    your criteria
                  </p>
                  <div className="space-y-2 mb-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      • Real-time notifications
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      • Custom severity filters
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      • Multi-channel delivery
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      • Smart deduplication
                    </p>
                  </div>
                  <Button className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Alert
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
