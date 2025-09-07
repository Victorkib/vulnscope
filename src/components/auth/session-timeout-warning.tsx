"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Clock, RefreshCw } from "lucide-react"

interface SessionTimeoutWarningProps {
  timeRemaining: number
  onExtendSession: () => Promise<boolean>
  onLogout: () => void
}

export default function SessionTimeoutWarning({
  timeRemaining,
  onExtendSession,
  onLogout,
}: SessionTimeoutWarningProps) {
  const [isExtending, setIsExtending] = useState(false)
  const [extendError, setExtendError] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(timeRemaining)

  useEffect(() => {
    setTimeLeft(timeRemaining)
  }, [timeRemaining])

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const handleExtendSession = async () => {
    setIsExtending(true)
    setExtendError(null)

    try {
      const success = await onExtendSession()
      if (!success) {
        setExtendError("Failed to extend session. Please try again.")
      }
    } catch {
      setExtendError("An error occurred while extending your session.")
    } finally {
      setIsExtending(false)
    }
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const getTimeColor = (seconds: number) => {
    if (seconds <= 60) return "text-red-600"
    if (seconds <= 180) return "text-orange-600"
    return "text-yellow-600"
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-yellow-600">
            Session Timeout Warning
          </CardTitle>
          <CardDescription>
            Your session will expire soon due to inactivity.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">
              <span className={getTimeColor(timeLeft)}>
                {formatTime(timeLeft)}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Time remaining before automatic logout
            </p>
          </div>

          {extendError && (
            <Alert className="border-red-500">
              <AlertDescription>{extendError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleExtendSession}
              disabled={isExtending}
              className="w-full"
            >
              {isExtending ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Extend Session
            </Button>

            <Button
              onClick={onLogout}
              variant="outline"
              className="w-full"
            >
              Logout Now
            </Button>
          </div>

          <div className="text-center text-xs text-gray-500 dark:text-gray-400">
            <p>
              Click &quot;Extend Session&quot; to continue working, or &quot;Logout Now&quot; to end your session immediately.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
