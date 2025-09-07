"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { auth } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, Eye, EyeOff } from "lucide-react"

export default function UpdatePasswordForm() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isValidSession, setIsValidSession] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await auth.getSession()
        if (session) {
          setIsValidSession(true)
        } else {
          setMessage({ 
            type: "error", 
            text: "Invalid or expired reset link. Please request a new password reset." 
          })
        }
              } catch {
          setMessage({ 
            type: "error", 
            text: "Error validating reset link. Please try again." 
          })
      } finally {
        setCheckingSession(false)
      }
    }

    checkSession()
  }, [])

  const validatePassword = (password: string) => {
    const minLength = 8
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

    return {
      isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
      errors: [
        password.length < minLength && `At least ${minLength} characters`,
        !hasUpperCase && "One uppercase letter",
        !hasLowerCase && "One lowercase letter", 
        !hasNumbers && "One number",
        !hasSpecialChar && "One special character"
      ].filter(Boolean)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match." })
      setLoading(false)
      return
    }

    const validation = validatePassword(password)
    if (!validation.isValid) {
      setMessage({ 
        type: "error", 
        text: `Password requirements not met: ${validation.errors.join(", ")}` 
      })
      setLoading(false)
      return
    }

    try {
      const { error } = await auth.updatePassword(password)
      if (error) throw error
      
      setMessage({ 
        type: "success", 
        text: "Password updated successfully! Redirecting to dashboard..." 
      })
      
      // Redirect to dashboard after successful password update
      setTimeout(() => {
        router.push("/dashboard")
      }, 2000)
    } catch (error: unknown) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "An error occurred" })
    } finally {
      setLoading(false)
    }
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-2">Validating reset link...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-red-600">Invalid Reset Link</CardTitle>
            <CardDescription>
              This password reset link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {message && (
              <Alert className={`mb-4 ${message.type === "error" ? "border-red-500" : "border-green-500"}`}>
                <AlertDescription>{message.text}</AlertDescription>
              </Alert>
            )}
            <Button 
              onClick={() => router.push("/")} 
              className="w-full"
            >
              Return to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const validation = validatePassword(password)
  const passwordsMatch = password && confirmPassword && password === confirmPassword

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Set New Password</CardTitle>
          <CardDescription>
            Enter your new password below. Make sure it&apos;s secure and easy to remember.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Password Requirements */}
            {password && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Password Requirements:</Label>
                <div className="space-y-1 text-xs">
                  <div className={`flex items-center ${password.length >= 8 ? "text-green-600" : "text-gray-500"}`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${password.length >= 8 ? "bg-green-600" : "bg-gray-300"}`} />
                    At least 8 characters
                  </div>
                  <div className={`flex items-center ${/[A-Z]/.test(password) ? "text-green-600" : "text-gray-500"}`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${/[A-Z]/.test(password) ? "bg-green-600" : "bg-gray-300"}`} />
                    One uppercase letter
                  </div>
                  <div className={`flex items-center ${/[a-z]/.test(password) ? "text-green-600" : "text-gray-500"}`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${/[a-z]/.test(password) ? "bg-green-600" : "bg-gray-300"}`} />
                    One lowercase letter
                  </div>
                  <div className={`flex items-center ${/\d/.test(password) ? "text-green-600" : "text-gray-500"}`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${/\d/.test(password) ? "bg-green-600" : "bg-gray-300"}`} />
                    One number
                  </div>
                  <div className={`flex items-center ${/[!@#$%^&*(),.?":{}|<>]/.test(password) ? "text-green-600" : "text-gray-500"}`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${/[!@#$%^&*(),.?":{}|<>]/.test(password) ? "bg-green-600" : "bg-gray-300"}`} />
                    One special character
                  </div>
                </div>
              </div>
            )}

            {/* Password Match Indicator */}
            {confirmPassword && (
              <div className={`text-xs ${passwordsMatch ? "text-green-600" : "text-red-600"}`}>
                {passwordsMatch ? "✓ Passwords match" : "✗ Passwords do not match"}
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !validation.isValid || !passwordsMatch}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Password
            </Button>
          </form>

          {message && (
            <Alert className={`mt-4 ${message.type === "error" ? "border-red-500" : "border-green-500"}`}>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
