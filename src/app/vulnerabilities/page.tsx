"use client"

import { useEffect, useState, useCallback, useMemo, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"
import { useTheme } from "@/components/theme/theme-provider"
import { usePreferences } from "@/contexts/preferences-context"
import { useRealtimeData } from "@/hooks/use-realtime-data"
import { useUserData } from "@/hooks/use-api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AppLayout from "@/components/layout/app-layout"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import type { Vulnerability, VulnerabilityStats } from "@/types/vulnerability"
import type { Team } from "@/types/collaboration"
import SearchFilters from "@/components/dashboard/search-filters"
import VulnerabilityTable from "@/components/dashboard/vulnerability-table"
import VulnerabilityTrends from "@/components/charts/vulnerability-trends"
import TopAffectedSoftware from "@/components/charts/top-affected-software"
import SeverityDistribution from "@/components/charts/severity-distribution"
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
  Bookmark,
  Share2,
  Users,
  MessageSquare,
} from "lucide-react"

interface TrendData {
  date: string
  CRITICAL: number
  HIGH: number
  MEDIUM: number
  LOW: number
}

interface SoftwareData {
  name: string
  count: number
}

interface PaginationData {
  currentPage: number
  totalPages: number
  totalCount: number
  limit: number
  hasNext: boolean
  hasPrev: boolean
  startIndex: number
  endIndex: number
}

interface Filters {
  searchText: string
  severities: string[]
  cvssRange: [number, number]
  dateRange: { from: Date; to: Date } | undefined
  affectedSoftware: string[]
  sources: string[]
  exploitAvailable?: boolean
  patchAvailable?: boolean
  kev?: boolean
  trending?: boolean
  category?: string[]
  tags?: string[]
}

export default function VulnerabilitiesPage() {
  const { user: _user } = useAuth()
  const { preferences } = usePreferences()
  const { preferences: themePreferences, isDarkMode } = useTheme()

  // Debug: Log when preferences change
  useEffect(() => {
    console.log('Preferences loaded/changed:', {
      hasPreferences: !!preferences,
      maxResultsPerPage: preferences?.maxResultsPerPage,
      defaultSeverityFilter: preferences?.defaultSeverityFilter
    });
  }, [preferences])
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // Get user data hook for activity logging
  const { logActivity } = useUserData()

  // Refs to prevent infinite loops and track state
  const isInitializedRef = useRef(false)
  const isFetchingRef = useRef(false)
  const urlUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastFetchParamsRef = useRef<string>("")

  // Apply user preferences for layout
  const getLayoutClass = () => {
    switch (preferences?.dashboardLayout) {
      case "compact":
        return "space-y-4"
      case "spacious":
        return "space-y-8"
      default:
        return "space-y-6"
    }
  }

  const getFontSizeClass = () => {
    switch (preferences?.fontSize) {
      case "small":
        return "text-sm"
      case "large":
        return "text-lg"
      default:
        return "text-base"
    }
  }

  const getHighContrastClass = () => {
    return preferences?.highContrast ? "border-2 border-gray-300 dark:border-gray-600" : ""
  }

  const getAnimationClass = () => {
    if (preferences?.reduceMotion || !preferences?.showAnimations) {
      return "transition-none"
    }
    return "transition-colors"
  }

  const getAnimationClasses = () => {
    if (preferences?.reduceMotion || !preferences?.showAnimations) {
      return {
        pulse: "",
        spin: "",
        transition: "transition-none",
      }
    }
    return {
      pulse: "animate-pulse",
      spin: "animate-spin",
      transition: "transition-colors",
    }
  }

  // Handle vulnerability click with view tracking
  const handleVulnerabilityClick = useCallback(
    (vulnerability: Vulnerability) => {
      // Log view activity (non-blocking)
      if (logActivity) {
        logActivity({
          type: "view",
          description: `Viewed vulnerability ${vulnerability.cveId}`,
          vulnerabilityId: vulnerability.cveId,
          metadata: {
            source: "vulnerabilities_list",
            severity: vulnerability.severity,
            title: vulnerability.title,
            publishedDate: vulnerability.publishedDate,
          },
        }).catch((error) => {
          console.error("Failed to log vulnerability view:", error)
          // Don't show error to user as this is non-critical
        })
      }

      // Navigate to vulnerability details
      router.push(`/vulnerabilities/${vulnerability.cveId}`)
    },
    [logActivity, router],
  )

  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([])
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: preferences?.maxResultsPerPage || 25, // Use preferences if available
    hasNext: false,
    hasPrev: false,
    startIndex: 1,
    endIndex: 1,
  })

  // Debug: Log pagination state changes
  useEffect(() => {
    console.log('Pagination state changed:', pagination);
  }, [pagination])
  const [stats, setStats] = useState<VulnerabilityStats>({
    total: 0,
    bySeverity: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 },
    byCategory: {},
    withExploits: 0,
    withPatches: 0,
    trending: 0,
    recentlyPublished: 0,
    lastUpdated: new Date().toISOString(),
  })
  const [trendData, setTrendData] = useState<TrendData[]>([])
  const [softwareData, setSoftwareData] = useState<SoftwareData[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [initialLoad, setInitialLoad] = useState(true)
  const [loadTimeout, setLoadTimeout] = useState<NodeJS.Timeout | null>(null)
  const [sortField, setSortField] = useState("publishedDate")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [teams, setTeams] = useState<Team[]>([])
  const [loadingTeams, setLoadingTeams] = useState(false)
  const [teamActivity, setTeamActivity] = useState<any[]>([])
  const [loadingActivity, setLoadingActivity] = useState(false)
  const [sharedVulnerabilities, setSharedVulnerabilities] = useState<any[]>([])
  const [loadingShared, setLoadingShared] = useState(false)
  const [activeTab, setActiveTab] = useState("database")
  const [filters, setFilters] = useState<Filters>({
    searchText: "",
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
  })

  const currentPage = pagination.currentPage
  const pageLimit = pagination.limit

  // Memoize filters with stable references to prevent infinite re-renders
  const memoizedFilters = useMemo(() => {
    return {
      searchText: filters.searchText,
      severities: filters.severities,
      cvssRange: filters.cvssRange,
      dateRange: filters.dateRange,
      affectedSoftware: filters.affectedSoftware,
      sources: filters.sources,
      exploitAvailable: filters.exploitAvailable,
      patchAvailable: filters.patchAvailable,
      kev: filters.kev,
      trending: filters.trending,
      category: filters.category || [],
      tags: filters.tags || [],
    }
  }, [
    filters.searchText,
    filters.severities,
    filters.cvssRange,
    filters.dateRange,
    filters.affectedSoftware,
    filters.sources,
    filters.exploitAvailable,
    filters.patchAvailable,
    filters.kev,
    filters.trending,
    filters.category,
    filters.tags,
  ])

  // Initialize from URL params and user preferences - only run once on mount
  useEffect(() => {
    if (isInitializedRef.current || !preferences) return

    const page = Number.parseInt(searchParams.get("page") || "1")
    // Prioritize URL parameter, then user preference, then default
    const urlLimit = searchParams.get("limit")
    const limit = urlLimit ? Number.parseInt(urlLimit) : preferences.maxResultsPerPage
    const sort = searchParams.get("sort") || "publishedDate"
    const order = (searchParams.get("order") || "desc") as "asc" | "desc"

    // Initialize filters from URL params with user preference fallbacks
    const searchText = searchParams.get("search") || ""
    const severities =
      searchParams.get("severities")?.split(",").filter(Boolean) || preferences.defaultSeverityFilter || []
    const cvssMin = Number.parseFloat(searchParams.get("cvssMin") || "0")
    const cvssMax = Number.parseFloat(searchParams.get("cvssMax") || "10")
    const affectedSoftware = searchParams.get("affectedSoftware")?.split(",").filter(Boolean) || []
    const sources = searchParams.get("sources")?.split(",").filter(Boolean) || []
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")
    const exploitAvailable = searchParams.get("exploitAvailable") === "true" ? true : undefined
    const patchAvailable = searchParams.get("patchAvailable") === "true" ? true : undefined
    const kev = searchParams.get("kev") === "true" ? true : undefined
    const trending = searchParams.get("trending") === "true" ? true : undefined
    const category = searchParams.get("category")?.split(",").filter(Boolean) || []
    const tags = searchParams.get("tags")?.split(",").filter(Boolean) || []

    setPagination((prev) => ({ ...prev, currentPage: page, limit }))
    setSortField(sort)
    setSortDirection(order)

    // Set filters from URL with user preference defaults
    setFilters({
      searchText,
      severities,
      cvssRange: [cvssMin, cvssMax],
      dateRange:
        dateFrom && dateTo
          ? {
              from: new Date(dateFrom),
              to: new Date(dateTo),
            }
          : undefined,
      affectedSoftware,
      sources,
      exploitAvailable,
      patchAvailable,
      kev,
      trending,
      category,
      tags,
    })

    isInitializedRef.current = true
  }, [searchParams, preferences])

  // Debounced URL update to prevent rapid changes
  const updateURL = useCallback(
    (page: number, limit: number, sort: string, order: string, currentFilters: Filters = filters) => {
      // Clear any existing timeout
      if (urlUpdateTimeoutRef.current) {
        clearTimeout(urlUpdateTimeoutRef.current)
      }

      // Debounce URL updates
      urlUpdateTimeoutRef.current = setTimeout(() => {
        const params = new URLSearchParams()
        if (page > 1) params.set("page", page.toString())
        if (limit !== (preferences?.maxResultsPerPage || 25)) params.set("limit", limit.toString())
        if (sort !== "publishedDate") params.set("sort", sort)
        if (order !== "desc") params.set("order", order)

        // Add filter parameters
        if (currentFilters.searchText) params.set("search", currentFilters.searchText)
        if (currentFilters.severities.length > 0) params.set("severities", currentFilters.severities.join(","))
        if (currentFilters.cvssRange[0] > 0 || currentFilters.cvssRange[1] < 10) {
          params.set("cvssMin", currentFilters.cvssRange[0].toString())
          params.set("cvssMax", currentFilters.cvssRange[1].toString())
        }
        if (currentFilters.affectedSoftware.length > 0)
          params.set("affectedSoftware", currentFilters.affectedSoftware.join(","))
        if (currentFilters.sources.length > 0) params.set("sources", currentFilters.sources.join(","))
        if (currentFilters.dateRange) {
          params.set("dateFrom", currentFilters.dateRange.from.toISOString().split("T")[0])
          params.set("dateTo", currentFilters.dateRange.to.toISOString().split("T")[0])
        }

        const newURL = params.toString() ? `?${params.toString()}` : ""
        window.history.replaceState({}, "", `/vulnerabilities${newURL}`)
      }, 100) // 100ms debounce
    },
    [filters, preferences?.maxResultsPerPage],
  )

  const fetchTeams = useCallback(async () => {
    try {
      setLoadingTeams(true)
      const data = await apiClient.get("/api/teams", {
        enableCache: true,
        cacheTTL: 300000, // 5 minutes cache
      })
      setTeams(data)
    } catch (error) {
      console.error("Error fetching teams:", error)
    } finally {
      setLoadingTeams(false)
    }
  }, [])

  const fetchTeamActivity = useCallback(async () => {
    try {
      setLoadingActivity(true)
      // Fetch recent team activity (shared vulnerabilities, discussions, etc.)
      const activityData = await apiClient.get("/api/teams/activity", {
        enableCache: true,
        cacheTTL: 120000, // 2 minutes cache
      })
      setTeamActivity(activityData || [])
    } catch (error) {
      console.error("Error fetching team activity:", error)
      setTeamActivity([])
    } finally {
      setLoadingActivity(false)
    }
  }, [])

  const fetchSharedVulnerabilities = useCallback(async () => {
    try {
      setLoadingShared(true)
      // Fetch vulnerabilities shared with teams
      const sharedData = await apiClient.get("/api/vulnerabilities/shared", {
        enableCache: true,
        cacheTTL: 120000, // 2 minutes cache
      })
      setSharedVulnerabilities(sharedData || [])
    } catch (error) {
      console.error("Error fetching shared vulnerabilities:", error)
      setSharedVulnerabilities([])
    } finally {
      setLoadingShared(false)
    }
  }, [])

  // Handle tab changes and fetch team data when collaboration tab is active
  useEffect(() => {
    if (activeTab === "collaboration") {
      fetchTeams()
      fetchTeamActivity()
      fetchSharedVulnerabilities()
    }
  }, [activeTab, fetchTeams, fetchTeamActivity, fetchSharedVulnerabilities])

  const fetchAllData = useCallback(async () => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) return

    try {
      isFetchingRef.current = true
      setLoading(true)
      setError(null)

      // Build query string inline to avoid dependency issues
      const params = new URLSearchParams()

      // Pagination - use destructured values
      params.append("page", currentPage.toString())
      params.append("limit", pageLimit.toString())

      // Sorting
      params.append("sortBy", sortField)
      params.append("sortOrder", sortDirection)

      // Filters - use memoized filters
      if (memoizedFilters.searchText) params.append("search", memoizedFilters.searchText)
      if (memoizedFilters.severities.length > 0) params.append("severities", memoizedFilters.severities.join(","))
      if (memoizedFilters.cvssRange[0] > 0 || memoizedFilters.cvssRange[1] < 10) {
        params.append("cvssMin", memoizedFilters.cvssRange[0].toString())
        params.append("cvssMax", memoizedFilters.cvssRange[1].toString())
      }
      if (memoizedFilters.affectedSoftware.length > 0)
        params.append("affectedSoftware", memoizedFilters.affectedSoftware.join(","))
      if (memoizedFilters.sources.length > 0) params.append("sources", memoizedFilters.sources.join(","))
      if (memoizedFilters.dateRange) {
        params.append("dateFrom", memoizedFilters.dateRange.from.toISOString().split("T")[0])
        params.append("dateTo", memoizedFilters.dateRange.to.toISOString().split("T")[0])
      }
      if (memoizedFilters.exploitAvailable !== undefined)
        params.append("exploitAvailable", memoizedFilters.exploitAvailable.toString())
      if (memoizedFilters.patchAvailable !== undefined)
        params.append("patchAvailable", memoizedFilters.patchAvailable.toString())
      if (memoizedFilters.kev !== undefined) params.append("kev", memoizedFilters.kev.toString())
      if (memoizedFilters.trending !== undefined) params.append("trending", memoizedFilters.trending.toString())
      if ((memoizedFilters.category || []).length > 0)
        params.append("category", (memoizedFilters.category || []).join(","))
      if ((memoizedFilters.tags || []).length > 0) params.append("tags", (memoizedFilters.tags || []).join(","))

      const queryParams = params.toString()

      // Check if we're fetching the same parameters to avoid unnecessary requests
      if (lastFetchParamsRef.current === queryParams && vulnerabilities.length > 0) {
        return
      }
      lastFetchParamsRef.current = queryParams

      // Fetch vulnerabilities first (most critical)
      const vulnsResult = await apiClient.get(`/api/vulnerabilities?${queryParams}`, {
        enableCache: false, // Disable cache to ensure fresh data with user preferences
        timeout: 30000,
      })

      // Handle vulnerabilities data
      if (vulnsResult) {
        setVulnerabilities(vulnsResult.vulnerabilities || [])
        setPagination(vulnsResult.pagination || pagination)

        // Update URL with current state (debounced)
        updateURL(
          vulnsResult.pagination.currentPage,
          vulnsResult.pagination.limit,
          sortField,
          sortDirection,
          memoizedFilters,
        )
      }

      // Fetch other data in parallel (non-critical)
      const [statsResult, trendsResult, softwareResult, teamsResult] = await Promise.allSettled([
        apiClient.get("/api/vulnerabilities/stats", {
          enableCache: true,
          cacheTTL: 300000, // 5 minutes cache
        }),
        apiClient.get("/api/vulnerabilities/trends", {
          enableCache: true,
          cacheTTL: 600000, // 10 minutes cache
        }),
        apiClient.get("/api/vulnerabilities/top-software", {
          enableCache: true,
          cacheTTL: 600000, // 10 minutes cache
        }),
        apiClient.get("/api/teams", {
          enableCache: true,
          cacheTTL: 300000, // 5 minutes cache
        }),
      ])

      // Handle stats data
      if (statsResult.status === "fulfilled") {
        setStats(statsResult.value)
      } else {
        console.error("Failed to fetch stats:", statsResult.reason)
      }

      // Handle trends data
      if (trendsResult.status === "fulfilled") {
        setTrendData(trendsResult.value)
      } else {
        console.error("Failed to fetch trends:", trendsResult.reason)
      }

      // Handle software data
      if (softwareResult.status === "fulfilled") {
        setSoftwareData(softwareResult.value)
      } else {
        console.error("Failed to fetch software data:", softwareResult.reason)
      }

      // Handle teams data
      if (teamsResult.status === "fulfilled") {
        setTeams(teamsResult.value)
      } else {
        console.error("Failed to fetch teams:", teamsResult.reason)
      }
    } catch (error) {
      console.error("Error fetching vulnerabilities data:", error)

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          setError("Request timed out. The server may be experiencing high load.")
        } else {
          setError(error.message)
        }
      } else {
        setError("Failed to load vulnerabilities data")
      }

      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load vulnerabilities data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
      setInitialLoad(false)
      isFetchingRef.current = false
    }
  }, [toast, currentPage, pageLimit, sortField, sortDirection, memoizedFilters, vulnerabilities.length, updateURL])

  // Auto-refresh functionality - only enable after initial load
  const { refreshNow, isFetching, lastFetch } = useRealtimeData({
    fetchFunction: fetchAllData,
    intervalMs: preferences?.refreshInterval || 300000, // Use user preference (default: 5 minutes)
    enabled: (preferences?.autoRefresh || false) && !initialLoad, // Only enable after initial load
    pauseWhenHidden: true, // Pause when tab is not visible
    onError: (error) => {
      console.error("Vulnerabilities data fetch error:", error)
      toast({
        title: "Update Error",
        description: "Failed to refresh vulnerability data",
        variant: "destructive",
      })
    },
  })

  // Separate effect for data fetching - only run when initialized and parameters change
  useEffect(() => {
    if (!isInitializedRef.current) return

    // Clear any existing timeout
    if (loadTimeout) {
      clearTimeout(loadTimeout)
    }

    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (loading && initialLoad) {
        console.warn("Vulnerabilities page loading timeout - forcing load completion")
        setLoading(false)
        setInitialLoad(false)
        setError("Loading timeout - please refresh the page")
      }
    }, 30000) // 30 second timeout

    setLoadTimeout(timeout)

    // Add error boundary for fetchAllData
    fetchAllData().catch((error) => {
      console.error("Critical error in fetchAllData:", error)
      setLoading(false)
      setInitialLoad(false)
      setError("Critical error occurred. Please refresh the page.")
    })

    return () => {
      if (timeout) {
        clearTimeout(timeout)
      }
    }
  }, [currentPage, pageLimit, sortField, sortDirection, memoizedFilters])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (loadTimeout) {
        clearTimeout(loadTimeout)
      }
      if (urlUpdateTimeoutRef.current) {
        clearTimeout(urlUpdateTimeoutRef.current)
      }
    }
  }, [loadTimeout])

  const handleRefresh = async () => {
    setRefreshing(true)
    await refreshNow() // Use the auto-refresh function
    toast({
      title: "Data Refreshed",
      description: "Vulnerability data has been updated",
    })
  }

  const handleFiltersChange = useCallback(
    (newFilters: Filters) => {
      setFilters(newFilters)
      // Reset to first page when filters change
      setPagination((prev) => ({ ...prev, currentPage: 1 }))
      // Update URL with new filters
      updateURL(1, pageLimit, sortField, sortDirection, newFilters)
    },
    [pageLimit, sortField, sortDirection, updateURL],
  )

  const handleVulnerabilityFilter = useCallback(
    (vulnFilter: Record<string, unknown>) => {
      // Convert VulnerabilityFilter to Filters format
      const newFilters: Filters = {
        searchText: (vulnFilter.query as string) || "",
        severities: (vulnFilter.severity as string[]) || [],
        cvssRange: vulnFilter.cvssScore
          ? [
              (vulnFilter.cvssScore as { min: number; max: number }).min,
              (vulnFilter.cvssScore as { min: number; max: number }).max,
            ]
          : [0, 10],
        dateRange: vulnFilter.dateRange
          ? {
              from: new Date((vulnFilter.dateRange as { start: string; end: string }).start),
              to: new Date((vulnFilter.dateRange as { start: string; end: string }).end),
            }
          : undefined,
        affectedSoftware: (vulnFilter.affectedSoftware as string[]) || [],
        sources: (vulnFilter.sources as string[]) || [],
      }
      handleFiltersChange(newFilters)
    },
    [handleFiltersChange],
  )

  const handlePageChange = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }))
  }, [])

  const handleLimitChange = useCallback((limit: number) => {
    setPagination((prev) => ({ ...prev, limit, currentPage: 1 }))
  }, [])

  // Update pagination limit when preferences change (but not from URL)
  useEffect(() => {
    if (!preferences?.maxResultsPerPage || !isInitializedRef.current) return;
    
    // Only update if there's no URL limit parameter
    const urlLimit = searchParams.get("limit");
    if (urlLimit) {
      console.log('URL limit parameter present, not updating from preferences');
      return;
    }
    
    console.log('Preferences useEffect triggered:', {
      hasPreferences: !!preferences,
      maxResultsPerPage: preferences?.maxResultsPerPage,
      currentPageLimit: pagination.limit,
      shouldUpdate: preferences.maxResultsPerPage !== pagination.limit
    });
    
    if (preferences.maxResultsPerPage !== pagination.limit) {
      console.log('Updating pagination limit from', pagination.limit, 'to', preferences.maxResultsPerPage)
      setPagination((prev) => ({
        ...prev,
        limit: preferences.maxResultsPerPage,
        currentPage: 1,
      }))
    }
  }, [preferences?.maxResultsPerPage, pagination.limit, searchParams])

  const handleSortChange = useCallback((field: string, direction: "asc" | "desc") => {
    setSortField(field)
    setSortDirection(direction)
    // Reset to first page when sorting changes
    setPagination((prev) => ({ ...prev, currentPage: 1 }))
  }, [])

  const handleBulkAction = async (action: string, selected: string[]) => {
    try {
      switch (action) {
        case "bookmark":
          for (const cveId of selected) {
            await apiClient.post("/api/users/bookmarks", {
              vulnerabilityId: cveId,
            })
          }
          toast({
            title: "Success",
            description: `${selected.length} vulnerabilities bookmarked`,
          })
          break
        case "export":
          await handleExport(preferences?.exportFormat || "csv", selected)
          break
        case "share":
          const shareText = selected.map((id) => `${window.location.origin}/vulnerabilities/${id}`).join("\n")
          await navigator.clipboard.writeText(shareText)
          toast({
            title: "Copied",
            description: "Vulnerability links copied to clipboard",
          })
          break
      }
    } catch (error) {
      console.error("Bulk action error:", error)
      toast({
        title: "Error",
        description: "Failed to perform bulk action",
        variant: "destructive",
      })
    }
  }

  const handleExport = async (format: "json" | "csv" | "pdf", selected?: string[]) => {
    try {
      const response = await fetch("/api/vulnerabilities/export", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format: format || preferences?.exportFormat || "csv",
          filters: selected ? { ...filters, cveIds: selected } : filters,
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `vulnerabilities${selected ? "_selected" : ""}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "Export Complete",
          description: `Vulnerabilities exported as ${format.toUpperCase()}`,
        })
      } else {
        throw new Error("Export failed")
      }
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Export Failed",
        description: "Failed to export vulnerabilities",
        variant: "destructive",
      })
    }
  }

  const getQuickStats = () => {
    const totalVulns = stats.total || 0
    const criticalCount = stats.bySeverity?.CRITICAL || 0
    const highCount = stats.bySeverity?.HIGH || 0
    const patchedCount = stats.withPatches || 0
    const exploitCount = stats.withExploits || 0
    const trendingCount = stats.trending || 0
    
    const criticalPercentage = totalVulns > 0 ? Math.round((criticalCount / totalVulns) * 100) : 0
    const highPercentage = totalVulns > 0 ? Math.round((highCount / totalVulns) * 100) : 0
    const patchedPercentage = totalVulns > 0 ? Math.round((patchedCount / totalVulns) * 100) : 0
    const exploitPercentage = totalVulns > 0 ? Math.round((exploitCount / totalVulns) * 100) : 0
    const trendingPercentage = totalVulns > 0 ? Math.round((trendingCount / totalVulns) * 100) : 0
    const highRiskCount = criticalCount + highCount

    return { 
      criticalPercentage, 
      highPercentage,
      patchedPercentage, 
      exploitPercentage,
      trendingPercentage,
      highRiskCount,
      totalVulns
    }
  }

  const quickStats = getQuickStats()

  if (loading && initialLoad && vulnerabilities.length === 0) {
    return (
      <AppLayout>
        <div className="p-6 space-y-6">
          <div className={`${getAnimationClasses().pulse} space-y-6`}>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          </div>
        </div>
      </AppLayout>
    )
  }

  // Error state with retry option
  if (error && vulnerabilities.length === 0) {
    return (
      <AppLayout>
        <div className="p-6 space-y-6">
          <div className="text-center py-12">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">System Overload Detected</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <div className="space-x-4">
              <Button onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Page
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setError(null)
                  setLoading(true)
                  fetchAllData()
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className={`p-6 max-w-[1800px] mx-auto ${getLayoutClass()} ${getFontSizeClass()} ${getAnimationClass()}`}>
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2 truncate">
              Vulnerability Intelligence
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-300">
              Comprehensive vulnerability tracking and analysis platform
            </p>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <Database className="h-4 w-4" />
                <span>{stats.total.toLocaleString()} total vulnerabilities</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>
                  Last updated:{" "}
                  {new Date(stats.lastUpdated).toLocaleString(undefined, {
                    timeZone: preferences?.timezone || "UTC",
                  })}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <span>
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="w-full sm:w-auto bg-transparent"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? getAnimationClasses().spin : ""}`} />
              <span className="hidden xs:inline">Refresh</span>
              <span className="xs:hidden">Sync</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport(preferences?.exportFormat || "csv")}
              className="w-full sm:w-auto"
            >
              <Download className="h-4 w-4 mr-2" />
              <span className="hidden xs:inline">Export</span>
              <span className="xs:hidden">Export</span>
            </Button>
            <Button onClick={() => router.push("/dashboard/settings")} className="w-full sm:w-auto">
              <Settings className="h-4 w-4 mr-2" />
              <span className="hidden xs:inline">Configure</span>
              <span className="xs:hidden">Settings</span>
            </Button>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Total Vulnerabilities */}
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                    Total Vulnerabilities
                  </p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                    {quickStats.totalVulns.toLocaleString()}
                  </p>
                  <div className="flex items-center mt-2">
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      Database
                    </Badge>
                  </div>
                </div>
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                  <Database className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* High Risk Vulnerabilities */}
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-red-50 to-pink-100 dark:from-red-900/20 dark:to-pink-900/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">
                    High Risk Threats
                  </p>
                  <p className="text-3xl font-bold text-red-900 dark:text-red-100">
                    {quickStats.highRiskCount}
                  </p>
                  <div className="flex items-center mt-2">
                    <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                      {quickStats.criticalPercentage + quickStats.highPercentage}% of total
                    </Badge>
                  </div>
                </div>
                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Exploitable Vulnerabilities */}
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-900/20 dark:to-amber-900/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-1">
                    With Exploits
                  </p>
                  <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                    {stats.withExploits || 0}
                  </p>
                  <div className="flex items-center mt-2">
                    <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                      {quickStats.exploitPercentage}% exploitable
                    </Badge>
                  </div>
                </div>
                <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center">
                  <Target className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Patched Vulnerabilities */}
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">
                    Patched
                  </p>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                    {stats.withPatches || 0}
                  </p>
                  <div className="flex items-center mt-2">
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      {quickStats.patchedPercentage}% resolved
                    </Badge>
                  </div>
                </div>
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                  <Shield className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
            <TabsTrigger
              value="database"
              className="flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-sm"
            >
              <Database className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Database</span>
              <span className="sm:hidden">DB</span>
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-sm"
            >
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Analytics</span>
              <span className="sm:hidden">Stats</span>
            </TabsTrigger>
            <TabsTrigger
              value="trends"
              className="flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-sm"
            >
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Trends</span>
              <span className="sm:hidden">Trend</span>
            </TabsTrigger>
            <TabsTrigger
              value="intelligence"
              className="flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-sm"
            >
              <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Intelligence</span>
              <span className="sm:hidden">Intel</span>
            </TabsTrigger>
            <TabsTrigger
              value="collaboration"
              className="flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-sm"
            >
              <Users className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Teams</span>
              <span className="sm:hidden">Team</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="database" className="space-y-6">
            {/* Mobile-first responsive layout */}
            <div className="space-y-6">
              {/* Filters - Full width on mobile, sidebar on desktop */}
              <div className="block xl:hidden">
                <SearchFilters
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  onExport={handleExport}
                  isLoading={loading}
                />
              </div>

              {/* Desktop layout with sidebar */}
              <div className="hidden xl:grid xl:grid-cols-4 gap-6">
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
                    onVulnerabilityClick={handleVulnerabilityClick}
                    onBookmark={(vulnerabilityId) => {
                      // TODO: Implement bookmark functionality
                      console.log("Bookmark vulnerability:", vulnerabilityId)
                    }}
                    onView={(vulnerabilityId) => {
                      router.push(`/vulnerabilities/${vulnerabilityId}`)
                    }}
                  />
                </div>
              </div>

              {/* Mobile/Tablet layout - full width table */}
              <div className="block xl:hidden">
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
                  onVulnerabilityClick={handleVulnerabilityClick}
                  onBookmark={(vulnerabilityId) => {
                    // TODO: Implement bookmark functionality
                    console.log("Bookmark vulnerability:", vulnerabilityId)
                  }}
                  onView={(vulnerabilityId) => {
                    router.push(`/vulnerabilities/${vulnerabilityId}`)
                  }}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
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
              {preferences?.showPreviewCards !== false && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">{/* Cards here */}</div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="intelligence" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
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
                      .filter((v) => v.severity === "CRITICAL")
                      .slice(0, 5)
                      .map((vuln) => (
                        <div
                          key={vuln.cveId}
                          className={`p-3 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 ${getAnimationClasses().transition} cursor-pointer`}
                          onClick={() => handleVulnerabilityClick(vuln)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-red-900 dark:text-red-100 text-sm">{vuln.cveId}</div>
                              <div className="text-xs text-red-600 dark:text-red-400 truncate max-w-[200px]">
                                {vuln.title}
                              </div>
                            </div>
                            <Badge className="bg-red-500 text-xs">{vuln.cvssScore}</Badge>
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
                          className={`p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 ${getAnimationClasses().transition} cursor-pointer`}
                          onClick={() => handleVulnerabilityClick(vuln)}
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
                              <span className="text-xs font-medium text-orange-600 dark:text-orange-400">Hot</span>
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
                      .sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime())
                      .slice(0, 5)
                      .map((vuln) => (
                        <div
                          key={vuln.cveId}
                          className={`p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 ${getAnimationClasses().transition} cursor-pointer`}
                          onClick={() => handleVulnerabilityClick(vuln)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-blue-900 dark:text-blue-100 text-sm">{vuln.cveId}</div>
                              <div className="text-xs text-blue-600 dark:text-blue-400 truncate max-w-[200px]">
                                {vuln.title}
                              </div>
                            </div>
                            <div className="text-xs text-blue-500 dark:text-blue-400">
                              {new Date(vuln.publishedDate).toLocaleDateString(undefined, {
                                timeZone: preferences?.timezone || "UTC",
                              })}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                  <div className="text-center p-4 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-xl">
                    <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
                      {stats.bySeverity.CRITICAL + stats.bySeverity.HIGH}
                    </div>
                    <div className="text-sm text-red-700 dark:text-red-300">High Risk Vulnerabilities</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-orange-900/20 rounded-xl">
                    <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                      {stats.withExploits}
                    </div>
                    <div className="text-sm text-orange-700 dark:text-orange-300">Active Exploits</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                      {stats.withPatches}
                    </div>
                    <div className="text-sm text-green-700 dark:text-green-300">Patches Available</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl">
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                      {stats.recentlyPublished}
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">Recent Discoveries</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Collaboration Tab */}
          <TabsContent value="collaboration" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              {/* My Teams */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <span>My Teams</span>
                    <Badge variant="outline">{teams.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingTeams ? (
                    <div className={`${getAnimationClasses().pulse} space-y-3`}>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ) : teams.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Teams Yet</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Create or join teams to collaborate on vulnerability research
                      </p>
                      <Button onClick={() => router.push("/dashboard/settings?tab=teams")}>
                        <Users className="h-4 w-4 mr-2" />
                        Manage Teams
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {teams.map((team) => (
                        <div
                          key={team.id}
                          className={`p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 ${getAnimationClasses().transition} cursor-pointer`}
                          onClick={() => router.push("/dashboard/settings?tab=teams")}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-gray-100">{team.name}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{team.members.length} members</p>
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(team.createdAt).toLocaleDateString(undefined, {
                                timeZone: preferences?.timezone || "UTC",
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Team Activity */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-green-600" />
                    <span>Recent Team Activity</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingActivity ? (
                    <div className={`${getAnimationClasses().pulse} space-y-3`}>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  ) : teamActivity.length === 0 ? (
                    <div className="text-center py-8">
                      <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Recent Activity</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Team activity will appear here when members share vulnerabilities or start discussions
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {teamActivity.slice(0, 5).map((activity, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {activity.type === 'share' ? 'Vulnerability shared' : 
                               activity.type === 'discussion' ? 'Discussion started' : 
                               'Team activity'}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {activity.description || 'Team member activity'}
                            </p>
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(activity.createdAt || Date.now()).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Shared Vulnerabilities */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Share2 className="h-5 w-5 text-purple-600" />
                  <span>Shared Vulnerabilities</span>
                  <Badge variant="outline">{sharedVulnerabilities.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingShared ? (
                  <div className={`${getAnimationClasses().pulse} space-y-3`}>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ) : sharedVulnerabilities.length === 0 ? (
                  <div className="text-center py-8">
                    <Share2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Shared Vulnerabilities</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Vulnerabilities shared with your teams will appear here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sharedVulnerabilities.slice(0, 5).map((share) => (
                      <div 
                        key={share.id} 
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                        onClick={() => router.push(`/vulnerabilities/${share.vulnerabilityId}`)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {share.vulnerabilityId}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Shared with {share.shareType === 'team' ? 'Team' : 'User'}
                            </p>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(share.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Share2 className="h-5 w-5 text-purple-600" />
                  <span>Quick Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center space-y-2 bg-transparent"
                    onClick={() => router.push("/dashboard/settings?tab=teams")}
                  >
                    <Users className="h-6 w-6 text-blue-600" />
                    <span className="font-medium">Manage Teams</span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">Create, edit, or invite members</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center space-y-2 bg-transparent"
                    onClick={() => router.push("/vulnerabilities")}
                  >
                    <Share2 className="h-6 w-6 text-green-600" />
                    <span className="font-medium">Share Vulnerabilities</span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">Share with teams or individuals</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center space-y-2 bg-transparent"
                    onClick={() => router.push("/vulnerabilities")}
                  >
                    <MessageSquare className="h-6 w-6 text-purple-600" />
                    <span className="font-medium">Start Discussions</span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      Collaborate on vulnerability analysis
                    </span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
