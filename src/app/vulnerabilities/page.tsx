'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { useTheme } from '@/components/theme/theme-provider';
import { useRealtimeData } from '@/hooks/use-realtime-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/components/layout/app-layout';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import type { Vulnerability, VulnerabilityStats } from '@/types/vulnerability';
import SearchFilters from '@/components/dashboard/search-filters';
import VulnerabilityTable from '@/components/dashboard/vulnerability-table';
import VulnerabilityTrends from '@/components/charts/vulnerability-trends';
import TopAffectedSoftware from '@/components/charts/top-affected-software';
import SeverityDistribution from '@/components/charts/severity-distribution';
import {
  Database,
  BarChart3,
  TrendingUp,
  RefreshCw,
  Download,
  Settings,
  AlertTriangle,
  Shield,
  Target,
  Activity,
  Calendar,
  Globe,
  Zap,
  Eye,
  Bookmark,
  Share2,
} from 'lucide-react';

interface TrendData {
  date: string;
  CRITICAL: number;
  HIGH: number;
  MEDIUM: number;
  LOW: number;
}

interface SoftwareData {
  name: string;
  count: number;
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
  startIndex: number;
  endIndex: number;
}

interface Filters {
  searchText: string;
  severities: string[];
  cvssRange: [number, number];
  dateRange: { from: Date; to: Date } | undefined;
  affectedSoftware: string[];
  sources: string[];
  exploitAvailable?: boolean;
  patchAvailable?: boolean;
  kev?: boolean;
  trending?: boolean;
  category?: string[];
  tags?: string[];
}

export default function VulnerabilitiesPage() {
  const { user: _user } = useAuth();
  const { preferences } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Apply user preferences for layout
  const getLayoutClass = () => {
    switch (preferences?.dashboardLayout) {
      case 'compact': return 'space-y-4';
      case 'spacious': return 'space-y-8';
      default: return 'space-y-6';
    }
  };

  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: preferences?.maxResultsPerPage || 25,
    hasNext: false,
    hasPrev: false,
    startIndex: 1,
    endIndex: 1,
  });
  const [stats, setStats] = useState<VulnerabilityStats>({
    total: 0,
    bySeverity: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 },
    byCategory: {},
    withExploits: 0,
    withPatches: 0,
    trending: 0,
    recentlyPublished: 0,
    lastUpdated: new Date().toISOString(),
  });
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [softwareData, setSoftwareData] = useState<SoftwareData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState('publishedDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<Filters>({
    searchText: '',
    severities: preferences?.defaultSeverityFilter || [],
    cvssRange: [0, 10] as [number, number],
    dateRange: undefined as { from: Date; to: Date } | undefined,
    affectedSoftware: [] as string[],
    sources: [] as string[],
    exploitAvailable: undefined,
    patchAvailable: undefined,
    kev: undefined,
    trending: undefined,
    category: [],
    tags: [],
  });

  // Initialize from URL params
  useEffect(() => {
    const page = Number.parseInt(searchParams.get('page') || '1');
    const limit = Number.parseInt(searchParams.get('limit') || (preferences?.maxResultsPerPage || 25).toString());
    const sort = searchParams.get('sort') || 'publishedDate';
    const order = (searchParams.get('order') || 'desc') as 'asc' | 'desc';

    // Initialize filters from URL params
    const searchText = searchParams.get('search') || '';
    const severities = searchParams.get('severities')?.split(',').filter(Boolean) || [];
    const cvssMin = Number.parseFloat(searchParams.get('cvssMin') || '0');
    const cvssMax = Number.parseFloat(searchParams.get('cvssMax') || '10');
    const affectedSoftware = searchParams.get('affectedSoftware')?.split(',').filter(Boolean) || [];
    const sources = searchParams.get('sources')?.split(',').filter(Boolean) || [];
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const exploitAvailable = searchParams.get('exploitAvailable') === 'true' ? true : undefined;
    const patchAvailable = searchParams.get('patchAvailable') === 'true' ? true : undefined;
    const kev = searchParams.get('kev') === 'true' ? true : undefined;
    const trending = searchParams.get('trending') === 'true' ? true : undefined;
    const category = searchParams.get('category')?.split(',').filter(Boolean) || [];
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || [];

    setPagination((prev) => ({ ...prev, currentPage: page, limit }));
    setSortField(sort);
    setSortDirection(order);
    
    // Set filters from URL
    setFilters({
      searchText,
      severities,
      cvssRange: [cvssMin, cvssMax],
      dateRange: dateFrom && dateTo ? {
        from: new Date(dateFrom),
        to: new Date(dateTo)
      } : undefined,
      affectedSoftware,
      sources,
      exploitAvailable,
      patchAvailable,
      kev,
      trending,
      category,
      tags,
    });
  }, [searchParams]);

  const updateURL = (
    page: number,
    limit: number,
    sort: string,
    order: string,
    currentFilters: Filters = filters
  ) => {
    const params = new URLSearchParams();
    if (page > 1) params.set('page', page.toString());
    if (limit !== (preferences?.maxResultsPerPage || 25)) params.set('limit', limit.toString());
    if (sort !== 'publishedDate') params.set('sort', sort);
    if (order !== 'desc') params.set('order', order);

    // Add filter parameters
    if (currentFilters.searchText) params.set('search', currentFilters.searchText);
    if (currentFilters.severities.length > 0) params.set('severities', currentFilters.severities.join(','));
    if (currentFilters.cvssRange[0] > 0 || currentFilters.cvssRange[1] < 10) {
      params.set('cvssMin', currentFilters.cvssRange[0].toString());
      params.set('cvssMax', currentFilters.cvssRange[1].toString());
    }
    if (currentFilters.affectedSoftware.length > 0) params.set('affectedSoftware', currentFilters.affectedSoftware.join(','));
    if (currentFilters.sources.length > 0) params.set('sources', currentFilters.sources.join(','));
    if (currentFilters.dateRange) {
      params.set('dateFrom', currentFilters.dateRange.from.toISOString().split('T')[0]);
      params.set('dateTo', currentFilters.dateRange.to.toISOString().split('T')[0]);
    }

    const newURL = params.toString() ? `?${params.toString()}` : '';
    window.history.replaceState({}, '', `/vulnerabilities${newURL}`);
  };

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query string inline to avoid dependency issues
      const params = new URLSearchParams();

      // Pagination
      params.append('page', pagination.currentPage.toString());
      params.append('limit', pagination.limit.toString());

      // Sorting
      params.append('sortBy', sortField);
      params.append('sortOrder', sortDirection);

      // Filters
      if (filters.searchText) params.append('search', filters.searchText);
      if (filters.severities.length > 0)
        params.append('severities', filters.severities.join(','));
      if (filters.cvssRange[0] > 0 || filters.cvssRange[1] < 10) {
        params.append('cvssMin', filters.cvssRange[0].toString());
        params.append('cvssMax', filters.cvssRange[1].toString());
      }
      if (filters.affectedSoftware.length > 0)
        params.append('affectedSoftware', filters.affectedSoftware.join(','));
      if (filters.sources.length > 0)
        params.append('sources', filters.sources.join(','));
      if (filters.dateRange) {
        params.append(
          'dateFrom',
          filters.dateRange.from.toISOString().split('T')[0]
        );
        params.append('dateTo', filters.dateRange.to.toISOString().split('T')[0]);
      }
      if (filters.exploitAvailable !== undefined)
        params.append('exploitAvailable', filters.exploitAvailable.toString());
      if (filters.patchAvailable !== undefined)
        params.append('patchAvailable', filters.patchAvailable.toString());
      if (filters.kev !== undefined)
        params.append('kev', filters.kev.toString());
      if (filters.trending !== undefined)
        params.append('trending', filters.trending.toString());
      if ((filters.category || []).length > 0)
        params.append('category', (filters.category || []).join(','));
      if ((filters.tags || []).length > 0)
        params.append('tags', (filters.tags || []).join(','));

      const queryParams = params.toString();

      // Use Promise.allSettled to handle partial failures gracefully
      const [vulnsResult, statsResult, trendsResult, softwareResult] = await Promise.allSettled([
        apiClient.get(`/api/vulnerabilities?${queryParams}`, { 
          cache: true, 
          cacheTTL: 120000, // 2 minutes cache
          timeout: 30000 
        }),
        apiClient.get('/api/vulnerabilities/stats', { 
          cache: true, 
          cacheTTL: 300000 // 5 minutes cache
        }),
        apiClient.get('/api/vulnerabilities/trends', { 
          cache: true, 
          cacheTTL: 600000 // 10 minutes cache
        }),
        apiClient.get('/api/vulnerabilities/top-software', { 
          cache: true, 
          cacheTTL: 600000 // 10 minutes cache
        }),
      ]);

      // Handle vulnerabilities data
      if (vulnsResult.status === 'fulfilled') {
        const vulnsData = vulnsResult.value;
        setVulnerabilities(vulnsData.vulnerabilities || []);
        setPagination(vulnsData.pagination || pagination);

        // Update URL with current state
        updateURL(
          vulnsData.pagination.currentPage,
          vulnsData.pagination.limit,
          sortField,
          sortDirection,
          filters
        );
      } else {
        console.error('Failed to fetch vulnerabilities:', vulnsResult.reason);
        throw vulnsResult.reason;
      }

      // Handle stats data
      if (statsResult.status === 'fulfilled') {
        setStats(statsResult.value);
      } else {
        console.error('Failed to fetch stats:', statsResult.reason);
      }

      // Handle trends data
      if (trendsResult.status === 'fulfilled') {
        setTrendData(trendsResult.value);
      } else {
        console.error('Failed to fetch trends:', trendsResult.reason);
      }

      // Handle software data
      if (softwareResult.status === 'fulfilled') {
        setSoftwareData(softwareResult.value);
      } else {
        console.error('Failed to fetch software data:', softwareResult.reason);
      }
    } catch (error) {
      console.error('Error fetching vulnerabilities data:', error);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          setError(
            'Request timed out. The server may be experiencing high load.'
          );
        } else {
          setError(error.message);
        }
      } else {
        setError('Failed to load vulnerabilities data');
      }

      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to load vulnerabilities data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast, pagination, sortField, sortDirection, filters]);

  // Auto-refresh functionality
  const { refreshNow, isFetching, lastFetch } = useRealtimeData({
    fetchFunction: fetchAllData,
    intervalMs: preferences?.refreshInterval || 300000, // Use user preference (default: 5 minutes)
    enabled: preferences?.autoRefresh || false, // Respect user preference
    pauseWhenHidden: true, // Pause when tab is not visible
    onError: (error) => {
      console.error('Vulnerabilities data fetch error:', error);
      toast({
        title: 'Update Error',
        description: 'Failed to refresh vulnerability data',
        variant: 'destructive',
      });
    },
  });

  useEffect(() => {
    fetchAllData();
  }, [
    pagination.currentPage,
    pagination.limit,
    sortField,
    sortDirection,
    filters,
  ]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshNow(); // Use the auto-refresh function
    toast({
      title: 'Data Refreshed',
      description: 'Vulnerability data has been updated',
    });
  };

  const handleFiltersChange = (newFilters: Filters) => {
    setFilters(newFilters);
    // Reset to first page when filters change
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    // Update URL with new filters
    updateURL(1, pagination.limit, sortField, sortDirection, newFilters);
  };

  const handleVulnerabilityFilter = (vulnFilter: Record<string, unknown>) => {
    // Convert VulnerabilityFilter to Filters format
    const newFilters: Filters = {
      searchText: (vulnFilter.query as string) || '',
      severities: (vulnFilter.severity as string[]) || [],
      cvssRange: vulnFilter.cvssScore ? [
        (vulnFilter.cvssScore as { min: number; max: number }).min, 
        (vulnFilter.cvssScore as { min: number; max: number }).max
      ] : [0, 10],
      dateRange: vulnFilter.dateRange ? {
        from: new Date((vulnFilter.dateRange as { start: string; end: string }).start),
        to: new Date((vulnFilter.dateRange as { start: string; end: string }).end)
      } : undefined,
      affectedSoftware: (vulnFilter.affectedSoftware as string[]) || [],
      sources: (vulnFilter.sources as string[]) || [],
    };
    handleFiltersChange(newFilters);
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  const handleLimitChange = (limit: number) => {
    setPagination((prev) => ({ ...prev, limit, currentPage: 1 }));
  };

  const handleSortChange = (field: string, direction: 'asc' | 'desc') => {
    setSortField(field);
    setSortDirection(direction);
    // Reset to first page when sorting changes
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleBulkAction = async (action: string, selected: string[]) => {
    try {
      switch (action) {
        case 'bookmark':
          for (const cveId of selected) {
            await apiClient.post('/api/users/bookmarks', {
              vulnerabilityId: cveId,
            });
          }
          toast({
            title: 'Success',
            description: `${selected.length} vulnerabilities bookmarked`,
          });
          break;
        case 'export':
          await handleExport(preferences?.exportFormat || 'csv', selected);
          break;
        case 'share':
          const shareText = selected
            .map((id) => `${window.location.origin}/vulnerabilities/${id}`)
            .join('\n');
          await navigator.clipboard.writeText(shareText);
          toast({
            title: 'Copied',
            description: 'Vulnerability links copied to clipboard',
          });
          break;
      }
    } catch (error) {
      console.error('Bulk action error:', error);
      toast({
        title: 'Error',
        description: 'Failed to perform bulk action',
        variant: 'destructive',
      });
    }
  };

  const handleExport = async (
    format: 'json' | 'csv' | 'pdf',
    selected?: string[]
  ) => {
    try {
      const response = await fetch('/api/vulnerabilities/export', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format,
          filters: selected ? { ...filters, cveIds: selected } : filters,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vulnerabilities${selected ? '_selected' : ''}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: 'Export Complete',
          description: `Vulnerabilities exported as ${format.toUpperCase()}`,
        });
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export vulnerabilities',
        variant: 'destructive',
      });
    }
  };

  const getQuickStats = () => {
    const criticalPercentage =
      stats.total > 0
        ? Math.round((stats.bySeverity.CRITICAL / stats.total) * 100)
        : 0;
    const patchedPercentage =
      stats.total > 0 ? Math.round((stats.withPatches / stats.total) * 100) : 0;
    const exploitPercentage =
      stats.total > 0
        ? Math.round((stats.withExploits / stats.total) * 100)
        : 0;

    return { criticalPercentage, patchedPercentage, exploitPercentage };
  };

  const quickStats = getQuickStats();

  if (loading && vulnerabilities.length === 0) {
    return (
      <AppLayout>
        <div className="p-6 space-y-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
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
      <div className={`p-6 max-w-[1800px] mx-auto ${getLayoutClass()}`}>
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Vulnerability Intelligence
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Comprehensive vulnerability tracking and analysis platform
            </p>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <Database className="h-4 w-4" />
                <span>
                  {stats.total.toLocaleString()} total vulnerabilities
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>
                  Last updated: {new Date(stats.lastUpdated).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <span>
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
            <Button variant="outline" onClick={() => handleExport(preferences?.exportFormat || 'csv')}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => router.push('/dashboard/settings')}>
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </Button>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-300">
                    Critical Threats
                  </p>
                  <p className="text-3xl font-bold text-red-900 dark:text-red-100">
                    {stats.bySeverity.CRITICAL}
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {quickStats.criticalPercentage}% of total
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700 dark:text-orange-300">
                    With Exploits
                  </p>
                  <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                    {stats.withExploits}
                  </p>
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                    {quickStats.exploitPercentage}% exploitable
                  </p>
                </div>
                <Target className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">
                    Patched
                  </p>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                    {stats.withPatches}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    {quickStats.patchedPercentage}% have patches
                  </p>
                </div>
                <Shield className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Trending
                  </p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                    {stats.trending}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Active discussions
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="database" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <TabsTrigger
              value="database"
              className="flex items-center space-x-2"
            >
              <Database className="h-4 w-4" />
              <span>Database</span>
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="flex items-center space-x-2"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Trends</span>
            </TabsTrigger>
            <TabsTrigger
              value="intelligence"
              className="flex items-center space-x-2"
            >
              <Activity className="h-4 w-4" />
              <span>Intelligence</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="database" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              <div className="xl:col-span-1">
                <SearchFilters
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  onExport={handleExport}
                  isLoading={loading}
                />
              </div>
              <div className="xl:col-span-3">
                <VulnerabilityTable
                  vulnerabilities={vulnerabilities}
                  pagination={pagination}
                  onPageChange={handlePageChange}
                  onLimitChange={handleLimitChange}
                  onSortChange={handleSortChange}
                  isLoading={loading}
                  error={error}
                  onRetry={fetchAllData}
                  onSelectionChange={(_selected) => {}}
                  onBulkAction={handleBulkAction}
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSortChange}
                  onFilter={handleVulnerabilityFilter}
                  onBookmark={(vulnerabilityId) => {
                    // TODO: Implement bookmark functionality
                    console.log('Bookmark vulnerability:', vulnerabilityId);
                  }}
                  onView={(vulnerabilityId) => {
                    router.push(`/vulnerabilities/${vulnerabilityId}`);
                  }}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <SeverityDistribution
                data={stats.bySeverity}
                isLoading={loading}
                showInsights={true}
                interactive={true}
              />
              <TopAffectedSoftware data={softwareData} isLoading={loading} />
            </div>
            <div className="grid grid-cols-1 gap-6">
              <VulnerabilityTrends data={trendData} isLoading={loading} />
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <VulnerabilityTrends data={trendData} isLoading={loading} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Globe className="h-5 w-5 text-blue-600" />
                      <span>Global Threat Landscape</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
                        <div>
                          <div className="font-medium text-red-900 dark:text-red-100">
                            Active Campaigns
                          </div>
                          <div className="text-sm text-red-600 dark:text-red-400">
                            Ongoing threat activities
                          </div>
                        </div>
                        <Badge className="bg-red-500">12</Badge>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                        <div>
                          <div className="font-medium text-orange-900 dark:text-orange-100">
                            Zero-Day Alerts
                          </div>
                          <div className="text-sm text-orange-600 dark:text-orange-400">
                            Unpatched vulnerabilities
                          </div>
                        </div>
                        <Badge className="bg-orange-500">3</Badge>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
                        <div>
                          <div className="font-medium text-yellow-900 dark:text-yellow-100">
                            Emerging Threats
                          </div>
                          <div className="text-sm text-yellow-600 dark:text-yellow-400">
                            New attack vectors
                          </div>
                        </div>
                        <Badge className="bg-yellow-500">8</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Zap className="h-5 w-5 text-purple-600" />
                      <span>Threat Intelligence</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                          <span className="font-medium text-purple-900 dark:text-purple-100">
                            Live Feed Active
                          </span>
                        </div>
                        <p className="text-sm text-purple-600 dark:text-purple-400">
                          Real-time vulnerability intelligence from 15+ sources
                        </p>
                      </div>
                      <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                        <div className="flex items-center space-x-2 mb-2">
                          <Eye className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                          <span className="font-medium text-indigo-900 dark:text-indigo-100">
                            AI Analysis
                          </span>
                        </div>
                        <p className="text-sm text-indigo-600 dark:text-indigo-400">
                          Machine learning powered threat assessment
                        </p>
                      </div>
                      <div className="p-4 bg-teal-50 dark:bg-teal-900/20 rounded-xl">
                        <div className="flex items-center space-x-2 mb-2">
                          <Share2 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                          <span className="font-medium text-teal-900 dark:text-teal-100">
                            Community Intel
                          </span>
                        </div>
                        <p className="text-sm text-teal-600 dark:text-teal-400">
                          Crowdsourced vulnerability reports and analysis
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="intelligence" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5 text-red-600" />
                    <span>High Priority</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {vulnerabilities
                      .filter((v) => v.severity === 'CRITICAL')
                      .slice(0, 5)
                      .map((vuln) => (
                        <div
                          key={vuln.cveId}
                          className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors cursor-pointer"
                          onClick={() =>
                            router.push(`/vulnerabilities/${vuln.cveId}`)
                          }
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-red-900 dark:text-red-100 text-sm">
                                {vuln.cveId}
                              </div>
                              <div className="text-xs text-red-600 dark:text-red-400 truncate max-w-[200px]">
                                {vuln.title}
                              </div>
                            </div>
                            <Badge className="bg-red-500 text-xs">
                              {vuln.cvssScore}
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-orange-600" />
                    <span>Trending Now</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {vulnerabilities
                      .filter((v) => v.trending)
                      .slice(0, 5)
                      .map((vuln) => (
                        <div
                          key={vuln.cveId}
                          className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors cursor-pointer"
                          onClick={() =>
                            router.push(`/vulnerabilities/${vuln.cveId}`)
                          }
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-orange-900 dark:text-orange-100 text-sm">
                                {vuln.cveId}
                              </div>
                              <div className="text-xs text-orange-600 dark:text-orange-400 truncate max-w-[200px]">
                                {vuln.title}
                              </div>
                            </div>
                            <div className="flex items-center space-x-1">
                              <TrendingUp className="h-3 w-3 text-orange-500" />
                              <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
                                Hot
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bookmark className="h-5 w-5 text-blue-600" />
                    <span>Recently Added</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {vulnerabilities
                      .sort(
                        (a, b) =>
                          new Date(b.publishedDate).getTime() -
                          new Date(a.publishedDate).getTime()
                      )
                      .slice(0, 5)
                      .map((vuln) => (
                        <div
                          key={vuln.cveId}
                          className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
                          onClick={() =>
                            router.push(`/vulnerabilities/${vuln.cveId}`)
                          }
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-blue-900 dark:text-blue-100 text-sm">
                                {vuln.cveId}
                              </div>
                              <div className="text-xs text-blue-600 dark:text-blue-400 truncate max-w-[200px]">
                                {vuln.title}
                              </div>
                            </div>
                            <div className="text-xs text-blue-500 dark:text-blue-400">
                              {new Date(
                                vuln.publishedDate
                              ).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Intelligence Summary */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-purple-600" />
                  <span>Intelligence Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-xl">
                    <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
                      {stats.bySeverity.CRITICAL + stats.bySeverity.HIGH}
                    </div>
                    <div className="text-sm text-red-700 dark:text-red-300">
                      High Risk Vulnerabilities
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl">
                    <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                      {stats.withExploits}
                    </div>
                    <div className="text-sm text-orange-700 dark:text-orange-300">
                      Active Exploits
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                      {stats.withPatches}
                    </div>
                    <div className="text-sm text-green-700 dark:text-green-300">
                      Patches Available
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl">
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                      {stats.recentlyPublished}
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      Recent Discoveries
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
