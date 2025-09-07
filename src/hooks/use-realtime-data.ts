"use client"

import { useEffect, useRef, useCallback, useState } from "react"

interface UseRealtimeDataOptions {
  fetchFunction: () => Promise<void>
  intervalMs?: number
  enabled?: boolean
  onError?: (error: Error) => void
  pauseWhenHidden?: boolean // Pause polling when tab is not visible
  smartPolling?: boolean // Adaptive polling based on activity
}

export function useRealtimeData({
  fetchFunction,
  intervalMs = 30000, // 30 seconds default
  enabled = true,
  onError,
  pauseWhenHidden = true, // Default to pausing when tab is hidden
  smartPolling = false, // Default to disabled for now
}: UseRealtimeDataOptions) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isFetchingRef = useRef<boolean>(false)
  const lastFetchRef = useRef<number>(0)
  const fetchFunctionRef = useRef(fetchFunction)
  const onErrorRef = useRef(onError)
  const [isPageVisible, setIsPageVisible] = useState(true)
  const [currentInterval, setCurrentInterval] = useState(intervalMs)
  const consecutiveNoChangesRef = useRef<number>(0)

  // Update refs when props change
  useEffect(() => {
    fetchFunctionRef.current = fetchFunction
    onErrorRef.current = onError
  }, [fetchFunction, onError])

  // Update currentInterval when intervalMs changes
  useEffect(() => {
    setCurrentInterval(intervalMs)
  }, [intervalMs])

  // Page Visibility API - pause polling when tab is hidden
  useEffect(() => {
    if (!pauseWhenHidden) return

    const handleVisibilityChange = () => {
      const isVisible = !document.hidden
      setIsPageVisible(isVisible)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [pauseWhenHidden])

  const fetchData = useCallback(async () => {
    if (isFetchingRef.current) return

    try {
      isFetchingRef.current = true
      const previousData = lastFetchRef.current
      lastFetchRef.current = Date.now()
      await fetchFunctionRef.current()
      
      // Smart polling: adjust interval based on data changes
      if (smartPolling) {
        const hasDataChanged = lastFetchRef.current !== previousData
        if (hasDataChanged) {
          consecutiveNoChangesRef.current = 0
          setCurrentInterval(intervalMs) // Reset to normal interval
        } else {
          consecutiveNoChangesRef.current += 1
          // Gradually increase interval if no changes detected
          if (consecutiveNoChangesRef.current >= 3) {
            const newInterval = Math.min(intervalMs * 2, 300000) // Max 5 minutes
            setCurrentInterval(newInterval)
          }
        }
      }
    } catch (error) {
      console.error("Error in realtime data fetch:", error)
      onErrorRef.current?.(error instanceof Error ? error : new Error("Unknown error"))
    } finally {
      isFetchingRef.current = false
    }
  }, [intervalMs, smartPolling])

  const startPolling = useCallback(() => {
    if (!enabled || intervalRef.current || (!isPageVisible && pauseWhenHidden)) return

    const effectiveInterval = smartPolling ? currentInterval : intervalMs
    intervalRef.current = setInterval(() => {
      // Only fetch if page is visible or pauseWhenHidden is disabled
      if (isPageVisible || !pauseWhenHidden) {
        fetchFunctionRef.current()
      }
    }, effectiveInterval)
  }, [enabled, intervalMs, currentInterval, isPageVisible, pauseWhenHidden, smartPolling])

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const refreshNow = useCallback(() => {
    fetchData()
  }, [fetchData])

  // Main effect for managing polling
  useEffect(() => {
    if (enabled && (isPageVisible || !pauseWhenHidden)) {
      // Start polling (initial fetch is handled by the component)
      startPolling()
    } else {
      stopPolling()
    }

    return () => {
      stopPolling()
    }
  }, [enabled, isPageVisible, pauseWhenHidden, startPolling, stopPolling])

  // Update interval when currentInterval changes (for smart polling)
  useEffect(() => {
    if (smartPolling && enabled && intervalRef.current) {
      stopPolling()
      startPolling()
    }
  }, [currentInterval, smartPolling, enabled, startPolling, stopPolling])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling()
    }
  }, [stopPolling])

  return {
    refreshNow,
    isFetching: isFetchingRef.current,
    lastFetch: lastFetchRef.current,
    startPolling,
    stopPolling,
    isPageVisible,
    currentInterval,
    isPaused: !isPageVisible && pauseWhenHidden,
  }
}
