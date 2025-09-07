"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { RefreshCw, WifiOff, Clock } from "lucide-react"

interface RealtimeStatusProps {
  isFetching: boolean
  lastFetch: number
  onRefresh: () => void
  enabled?: boolean
}

export default function RealtimeStatus({
  isFetching,
  lastFetch,
  onRefresh,
  enabled = true,
}: RealtimeStatusProps) {
  const [timeSinceLastFetch, setTimeSinceLastFetch] = useState(0)

  useEffect(() => {
    if (!enabled || lastFetch === 0) return

    const updateTimeSince = () => {
      const now = Date.now()
      const timeDiff = Math.floor((now - lastFetch) / 1000)
      setTimeSinceLastFetch(timeDiff)
    }

    // Update immediately
    updateTimeSince()

    // Update every 5 seconds instead of every second for better performance
    const interval = setInterval(updateTimeSince, 5000)

    return () => clearInterval(interval)
  }, [lastFetch, enabled])

  const formatTimeSince = (seconds: number) => {
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    return `${Math.floor(seconds / 3600)}h ago`
  }

  const getStatusColor = (seconds: number) => {
    if (seconds < 60) return "bg-green-500"
    if (seconds < 300) return "bg-yellow-500"
    return "bg-red-500"
  }

  const getStatusText = (seconds: number) => {
    if (seconds < 60) return "Live"
    if (seconds < 300) return "Recent"
    return "Stale"
  }

  if (!enabled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="flex items-center gap-1">
              <WifiOff className="w-3 h-3" />
              Offline
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Real-time updates are disabled</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="outline" 
              className={`flex items-center gap-1 ${getStatusColor(timeSinceLastFetch)} text-white`}
            >
              <div className={`w-2 h-2 rounded-full ${getStatusColor(timeSinceLastFetch)}`} />
              {getStatusText(timeSinceLastFetch)}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Last updated: {formatTimeSince(timeSinceLastFetch)}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={isFetching}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className={`w-3 h-3 ${isFetching ? "animate-spin" : ""}`} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isFetching ? "Refreshing..." : "Refresh now"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {lastFetch > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                {formatTimeSince(timeSinceLastFetch)}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Data last updated: {new Date(lastFetch).toLocaleTimeString()}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}
