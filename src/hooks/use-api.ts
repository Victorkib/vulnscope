/**
 * Custom hook for API calls with loading states and error handling
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { apiClient, type RequestOptions } from '@/lib/api-client';

interface UseApiOptions extends RequestOptions {
  immediate?: boolean; // Whether to call immediately on mount
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
}

export function useApi<T = any>(
  url: string | ((...args: any[]) => string),
  options: UseApiOptions = {}
): UseApiReturn<T> {
  const {
    immediate = false,
    onSuccess,
    onError,
    ...requestOptions
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(async (...args: any[]): Promise<T | null> => {
    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      // Build final URL (support for dynamic URLs)
      const finalUrl = typeof url === 'function' ? url(...args) : url;

      const result = await apiClient.request<T>(finalUrl, {
        ...requestOptions,
        signal: abortControllerRef.current.signal,
      });

      setData(result);
      onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      
      // Don't set error for aborted requests
      if (error.name !== 'AbortError') {
        setError(error);
        onError?.(error);
      }
      
      return null;
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [url, requestOptions, onSuccess, onError]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
    
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Execute immediately on mount if requested
  useEffect(() => {
    if (immediate) {
      execute();
    }

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [immediate, execute]);

  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
}

// Specialized hooks for common patterns
export function useVulnerabilityDetails(cveId: string) {
  const [vulnerability, setVulnerability] = useState(null);
  const [relatedVulns, setRelatedVulns] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [relatedLoading, setRelatedLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDetails = useCallback(async () => {
    if (!cveId) return;

    try {
      setLoading(true);
      setError(null);

      // Use Promise.allSettled to handle partial failures gracefully
      const [vulnResult, relatedResult, commentsResult] = await Promise.allSettled([
        apiClient.get(`/api/vulnerabilities/${cveId}`, { enableCache: true, cacheTTL: 300000 }),
        apiClient.get(`/api/vulnerabilities/${cveId}/related`, { enableCache: true, cacheTTL: 600000 }),
        apiClient.get(`/api/vulnerabilities/${cveId}/comments`, { enableCache: true, cacheTTL: 120000 }),
      ]);

      // Handle vulnerability data
      if (vulnResult.status === 'fulfilled') {
        setVulnerability(vulnResult.value);
      } else {
        console.error('Failed to fetch vulnerability:', vulnResult.reason);
        setError(vulnResult.reason);
      }

      // Handle related vulnerabilities
      if (relatedResult.status === 'fulfilled') {
        setRelatedVulns(relatedResult.value);
      } else {
        console.error('Failed to fetch related vulnerabilities:', relatedResult.reason);
      }
      setRelatedLoading(false);

      // Handle comments
      if (commentsResult.status === 'fulfilled') {
        setComments(commentsResult.value);
      } else {
        console.error('Failed to fetch comments:', commentsResult.reason);
      }
      setCommentsLoading(false);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch vulnerability details');
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [cveId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  return {
    vulnerability,
    relatedVulns,
    comments,
    loading,
    commentsLoading,
    relatedLoading,
    error,
    refetch: fetchDetails,
    setVulnerability,
    setRelatedVulns,
    setComments,
  };
}

export function useVulnerabilitiesList(filters: Record<string, any> = {}) {
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchVulnerabilities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            queryParams.set(key, value.join(','));
          } else {
            queryParams.set(key, value.toString());
          }
        }
      });

      const result = await apiClient.get(`/api/vulnerabilities?${queryParams.toString()}`, {
        enableCache: true,
        cacheTTL: 120000, // 2 minutes cache
      });

      setVulnerabilities(result.vulnerabilities || []);
      setPagination(result.pagination || null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch vulnerabilities');
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  return {
    vulnerabilities,
    pagination,
    loading,
    error,
    fetchVulnerabilities,
  };
}

// Specialized hooks for user data
export function useUserData() {
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [savedSearches, setSavedSearches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Use Promise.allSettled to handle partial failures gracefully
      const [statsResult, activityResult, bookmarksResult, searchesResult] = await Promise.allSettled([
        apiClient.get('/api/users/stats', { 
          enableCache: true, 
          cacheTTL: 300000 // 5 minutes cache
        }),
        apiClient.get('/api/users/activity?limit=20', { 
          enableCache: true, 
          cacheTTL: 120000 // 2 minutes cache
        }),
        apiClient.get('/api/users/bookmarks', { 
          enableCache: true, 
          cacheTTL: 180000 // 3 minutes cache
        }),
        apiClient.get('/api/users/saved-searches', { 
          enableCache: true, 
          cacheTTL: 600000 // 10 minutes cache
        }),
      ]);

      // Handle stats data
      if (statsResult.status === 'fulfilled') {
        setStats(statsResult.value);
      } else {
        console.error('Failed to fetch user stats:', statsResult.reason);
      }

      // Handle activity data
      if (activityResult.status === 'fulfilled') {
        setActivities(activityResult.value);
      } else {
        console.error('Failed to fetch user activity:', activityResult.reason);
      }

      // Handle bookmarks data
      if (bookmarksResult.status === 'fulfilled') {
        setBookmarks(bookmarksResult.value);
      } else {
        console.error('Failed to fetch user bookmarks:', bookmarksResult.reason);
      }

      // Handle saved searches data
      if (searchesResult.status === 'fulfilled') {
        setSavedSearches(searchesResult.value);
      } else {
        console.error('Failed to fetch saved searches:', searchesResult.reason);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch user data');
      setError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateBookmark = useCallback(async (bookmarkId: string, updates: any) => {
    try {
      await apiClient.put(`/api/users/bookmarks/${bookmarkId}`, updates);
      
      // Update local state optimistically
      setBookmarks(prev => 
        prev.map(bookmark => 
          bookmark.id === bookmarkId 
            ? { ...bookmark, ...updates, updatedAt: new Date().toISOString() }
            : bookmark
        )
      );
      
      // Clear cache to ensure fresh data on next fetch
      apiClient.clearCache('/api/users/bookmarks');
      
      return true;
    } catch (error) {
      console.error('Failed to update bookmark:', error);
      throw error;
    }
  }, []);

  const deleteBookmark = useCallback(async (bookmarkId: string) => {
    try {
      await apiClient.delete(`/api/users/bookmarks/${bookmarkId}`);
      
      // Update local state optimistically
      setBookmarks(prev => prev.filter(bookmark => bookmark.id !== bookmarkId));
      setStats(prev => prev ? { ...prev, totalBookmarks: prev.totalBookmarks - 1 } : null);
      
      // Clear cache to ensure fresh data on next fetch
      apiClient.clearCache('/api/users/bookmarks');
      apiClient.clearCache('/api/users/stats');
      
      return true;
    } catch (error) {
      console.error('Failed to delete bookmark:', error);
      throw error;
    }
  }, []);

  const logActivity = useCallback(async (activityData: any) => {
    try {
      await apiClient.post('/api/users/activity', activityData);
      
      // Clear cache to ensure fresh data on next fetch
      apiClient.clearCache('/api/users/activity');
      
      return true;
    } catch (error) {
      console.error('Failed to log activity:', error);
      // Don't throw error for activity logging as it's not critical
      return false;
    }
  }, []);

  return {
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
    setStats,
    setActivities,
    setBookmarks,
    setSavedSearches,
  };
}

// Legacy hook removed - use usePreferences from contexts/preferences-context instead
