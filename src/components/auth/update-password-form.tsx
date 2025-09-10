"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { auth } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, Eye, EyeOff, Key, Shield, Sparkles, Lock, Zap } from "lucide-react"

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-green-900/20 dark:to-emerald-900/20 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-green-400/30 to-emerald-400/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-emerald-400/30 to-teal-400/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-teal-400/20 to-green-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <Card className="w-full max-w-md bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 shadow-2xl relative z-10">
          <CardContent className="p-8">
            <div className="text-center">
              {/* Animated Loading Icon */}
              <div className="relative mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg relative overflow-hidden">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                </div>
                <div className="absolute inset-0 w-16 h-16 mx-auto">
                  <div className="w-full h-full border-2 border-green-400/30 rounded-2xl animate-ping" />
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Validating Reset Link</h3>
              <p className="text-gray-600 dark:text-gray-400">Please wait while we verify your reset link...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-red-900/20 dark:to-orange-900/20 relative overflow-hidden px-4">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-red-400/30 to-orange-400/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-orange-400/30 to-yellow-400/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <Card className="w-full max-w-md bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-0 shadow-2xl relative z-10">
          <CardHeader className="text-center pb-8 pt-12">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Lock className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-red-600 mb-4">Invalid Reset Link</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400 text-lg">
              This password reset link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            {message && (
              <Alert className={`mb-6 ${message.type === "error" ? "border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800" : "border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800"} rounded-xl`}>
                <AlertDescription className={message.type === "error" ? "text-red-800 dark:text-red-200" : "text-green-800 dark:text-green-200"}>
                  {message.text}
                </AlertDescription>
              </Alert>
            )}
            <Button 
              onClick={() => router.push("/")} 
              className="w-full h-12 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] rounded-xl"
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-green-900/20 dark:to-emerald-900/20 relative">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large background orbs */}
        <div className="absolute -top-20 -right-20 sm:-top-40 sm:-right-40 w-60 h-60 sm:w-80 sm:h-80 bg-gradient-to-r from-green-400/30 to-emerald-400/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-20 -left-20 sm:-bottom-40 sm:-left-40 w-60 h-60 sm:w-80 sm:h-80 bg-gradient-to-r from-emerald-400/30 to-teal-400/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 sm:w-96 sm:h-96 bg-gradient-to-r from-teal-400/20 to-green-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* Floating Icons - Responsive positioning */}
        <div className="absolute top-10 left-10 sm:top-20 sm:left-20 animate-float">
          <Key className="w-4 h-4 sm:w-6 sm:h-6 text-green-400/60" />
        </div>
        <div className="absolute top-16 right-16 sm:top-32 sm:right-32 animate-float" style={{ animationDelay: '1s' }}>
          <Shield className="w-3 h-3 sm:w-5 sm:h-5 text-emerald-400/60" />
        </div>
        <div className="absolute bottom-16 left-16 sm:bottom-32 sm:left-32 animate-float" style={{ animationDelay: '2s' }}>
          <Lock className="w-3 h-3 sm:w-5 sm:h-5 text-teal-400/60" />
        </div>
        <div className="absolute bottom-10 right-10 sm:bottom-20 sm:right-20 animate-float" style={{ animationDelay: '3s' }}>
          <Zap className="w-3 h-3 sm:w-5 sm:h-5 text-green-400/60" />
        </div>
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header Spacer */}
        <div className="flex-1 flex items-center justify-center py-8 sm:py-12 lg:py-16">
          <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg mx-4 sm:mx-6 lg:mx-8">

            <Card className="w-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-0 shadow-2xl">
        <CardHeader className="text-center pb-6 sm:pb-8 pt-8 sm:pt-12">
          {/* Animated Lock Icon */}
          <div className="flex items-center justify-center mb-6 sm:mb-8">
            <div className="relative">
              {/* Glow Effect */}
              <div className="absolute inset-0 w-16 h-16 sm:w-20 sm:h-20 mx-auto">
                <div className="w-full h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl blur-lg opacity-50 animate-pulse" />
              </div>
              
              {/* Main Icon Container */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl flex items-center justify-center shadow-2xl relative overflow-hidden">
                <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-white relative z-10" />
                
                {/* Shimmer Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
              </div>
              
              {/* Rotating Ring */}
              <div className="absolute inset-0 w-16 h-16 sm:w-20 sm:h-20 mx-auto">
                <div className="w-full h-full border-4 border-transparent border-t-green-500 border-r-emerald-500 rounded-3xl animate-spin" style={{ animationDuration: '3s' }} />
              </div>
            </div>
          </div>
          
          <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent mb-3 sm:mb-4">
            Create New Password
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400 text-base sm:text-lg leading-relaxed">
            You&apos;re almost there! <br />
            Choose a strong, secure password for your account.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8 space-y-6 sm:space-y-8">
          <form onSubmit={handleUpdatePassword} className="space-y-4 sm:space-y-6">
            <div className="space-y-2 sm:space-y-3">
              <Label htmlFor="new-password" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                <Key className="w-4 h-4 mr-2 text-green-500" />
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="h-12 sm:h-14 px-4 pl-12 pr-12 border-gray-200 dark:border-gray-600 focus:border-green-500 focus:ring-green-500/20 dark:focus:border-green-400 dark:focus:ring-green-400/20 transition-all duration-200 rounded-xl text-base sm:text-lg"
                />
                <Key className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2 sm:space-y-3">
              <Label htmlFor="confirm-password" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                <Shield className="w-4 h-4 mr-2 text-green-500" />
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="h-12 sm:h-14 px-4 pl-12 pr-12 border-gray-200 dark:border-gray-600 focus:border-green-500 focus:ring-green-500/20 dark:focus:border-green-400 dark:focus:ring-green-400/20 transition-all duration-200 rounded-xl text-base sm:text-lg"
                />
                <Shield className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>

            {/* Password Requirements */}
            {password && (
              <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20 p-4 sm:p-6 rounded-2xl border border-green-200/50 dark:border-green-800/50 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute top-4 left-4 w-2 h-2 bg-green-500 rounded-full" />
                  <div className="absolute top-8 right-8 w-1 h-1 bg-emerald-500 rounded-full" />
                  <div className="absolute bottom-6 left-8 w-1.5 h-1.5 bg-teal-500 rounded-full" />
                  <div className="absolute bottom-4 right-4 w-2 h-2 bg-green-500 rounded-full" />
                </div>
                
                <h4 className="font-bold text-green-900 dark:text-green-100 mb-3 sm:mb-4 flex items-center text-base sm:text-lg">
                  <Zap className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-green-500" />
                  Password Requirements
                </h4>
                
                <div className="space-y-2 sm:space-y-3">
                  {[
                    { text: "At least 8 characters", valid: password.length >= 8 },
                    { text: "One uppercase letter", valid: /[A-Z]/.test(password) },
                    { text: "One lowercase letter", valid: /[a-z]/.test(password) },
                    { text: "One number", valid: /\d/.test(password) },
                    { text: "One special character", valid: /[!@#$%^&*(),.?":{}|<>]/.test(password) }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center space-x-2 sm:space-x-3 p-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all duration-200">
                      <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center ${item.valid ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"}`}>
                        {item.valid ? (
                          <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                        ) : (
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full" />
                        )}
                      </div>
                      <p className={`font-medium text-xs sm:text-sm ${item.valid ? "text-green-800 dark:text-green-200" : "text-gray-600 dark:text-gray-400"}`}>
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Password Match Indicator */}
            {confirmPassword && (
              <div className={`flex items-center space-x-2 p-2 sm:p-3 rounded-xl ${passwordsMatch ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"}`}>
                {passwordsMatch ? (
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                ) : (
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-red-500 rounded-full" />
                )}
                <span className={`font-medium text-sm sm:text-base ${passwordsMatch ? "text-green-800 dark:text-green-200" : "text-red-800 dark:text-red-200"}`}>
                  {passwordsMatch ? "Passwords match perfectly!" : "Passwords do not match"}
                </span>
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full h-12 sm:h-14 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold text-base sm:text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] rounded-xl relative overflow-hidden group" 
              disabled={loading || !validation.isValid || !passwordsMatch}
            >
              {loading ? (
                <Loader2 className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
              ) : (
                <Lock className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" />
              )}
              <span className="relative z-10">
                {loading ? "Updating Password..." : "Update Password"}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </Button>
          </form>

          {message && (
            <Alert className={`${message.type === "error" ? "border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800" : "border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800"} rounded-xl`}>
              <AlertDescription className={message.type === "error" ? "text-red-800 dark:text-red-200" : "text-green-800 dark:text-green-200"}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          <div className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 bg-gray-50/80 dark:bg-gray-700/50 p-4 sm:p-6 rounded-xl border border-gray-200/50 dark:border-gray-600/50">
            <p className="flex items-center justify-center space-x-2">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Your new password will be encrypted and securely stored.</span>
            </p>
          </div>
        </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer Spacer */}
        <div className="flex-shrink-0 py-4 sm:py-6">
          <div className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            <p>VulnScope Security Intelligence Platform</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
