"use client"

import { useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { auth } from "@/lib/supabase"

interface UseSessionTimeoutOptions {
  timeoutMinutes?: number
  warningMinutes?: number
  onTimeout?: () => void
  onWarning?: () => void
  enabled?: boolean
}

export function useSessionTimeout({
  timeoutMinutes = 30,
  warningMinutes = 5,
  onTimeout,
  onWarning,
  enabled = true,
}: UseSessionTimeoutOptions = {}) {
  const router = useRouter()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const warningRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = useRef<number>(Date.now())
  const warningShownRef = useRef<boolean>(false)

  const resetTimers = useCallback(() => {
    // Clear existing timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current)
    }

    // Reset warning state
    warningShownRef.current = false

    // Update last activity time
    lastActivityRef.current = Date.now()

    if (!enabled) return

    // Set warning timer
    const warningTime = (timeoutMinutes - warningMinutes) * 60 * 1000
    warningRef.current = setTimeout(() => {
      warningShownRef.current = true
      onWarning?.()
    }, warningTime)

    // Set timeout timer
    const timeoutTime = timeoutMinutes * 60 * 1000
    timeoutRef.current = setTimeout(async () => {
      try {
        await auth.signOut()
        onTimeout?.()
        router.push("/")
      } catch (error) {
        console.error("Error during session timeout:", error)
        router.push("/")
      }
    }, timeoutTime)
  }, [timeoutMinutes, warningMinutes, onTimeout, onWarning, enabled, router])

  const extendSession = useCallback(async () => {
    try {
      // Refresh the session
      const { data: { session } } = await auth.getSession()
      if (session) {
        resetTimers()
        return true
      }
      return false
    } catch (error) {
      console.error("Error extending session:", error)
      return false
    }
  }, [resetTimers])

  const handleUserActivity = useCallback(() => {
    if (enabled) {
      resetTimers()
    }
  }, [enabled, resetTimers])

  useEffect(() => {
    if (!enabled) return

    // Set up activity listeners
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ]

    events.forEach((event) => {
      document.addEventListener(event, handleUserActivity, true)
    })

    // Initial timer setup
    resetTimers()

    // Cleanup function
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleUserActivity, true)
      })

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (warningRef.current) {
        clearTimeout(warningRef.current)
      }
    }
  }, [enabled, handleUserActivity, resetTimers])

  return {
    extendSession,
    resetTimers,
    isWarningShown: warningShownRef.current,
    timeUntilTimeout: Math.max(0, timeoutMinutes * 60 - Math.floor((Date.now() - lastActivityRef.current) / 1000)),
  }
}
