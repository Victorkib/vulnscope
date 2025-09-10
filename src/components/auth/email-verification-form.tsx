"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { auth } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, Mail, RefreshCw, ArrowLeft, Sparkles, Shield, Clock, Users } from "lucide-react"
import VerificationSuccessLoader from "./verification-success-loader"

interface EmailVerificationFormProps {
  email?: string
  onBack?: () => void
}

export default function EmailVerificationForm({ email, onBack }: EmailVerificationFormProps) {
  // const [loading, setLoading] = useState(false) // Removed unused variable
  const [resending, setResending] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isVerified, setIsVerified] = useState(false)
  const [checkingVerification, setCheckingVerification] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Check if user is coming from email verification link
  useEffect(() => {
    const checkVerificationStatus = async () => {
      const token = searchParams.get('token')
      const type = searchParams.get('type')
      
      if (token && type === 'signup') {
        setCheckingVerification(true)
        try {
          // The verification is handled automatically by Supabase when the user clicks the link
          // We just need to check if the user is now verified
          const user = await auth.getUser()
          if (user?.email_confirmed_at) {
            setIsVerified(true)
            setMessage({ 
              type: "success", 
              text: "Email verified successfully! Redirecting to dashboard..." 
            })
            
            // Redirect to dashboard after successful verification
            setTimeout(() => {
              router.push("/dashboard")
            }, 3000)
          }
        } catch {
          setMessage({ 
            type: "error", 
            text: "Email verification failed. Please try again or request a new verification email." 
          })
        } finally {
          setCheckingVerification(false)
        }
      }
    }

    checkVerificationStatus()
  }, [searchParams, router])

  const handleResendVerification = async () => {
    if (!email) {
      setMessage({ type: "error", text: "No email address available for resending verification." })
      return
    }

    setResending(true)
    setMessage(null)

    try {
      const { error } = await auth.resendVerification(email)
      if (error) throw error
      
      setMessage({ 
        type: "success", 
        text: "Verification email sent! Please check your inbox and click the verification link." 
      })
    } catch (error: unknown) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "An error occurred" })
    } finally {
      setResending(false)
    }
  }

  if (checkingVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-400/30 to-purple-400/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-indigo-400/30 to-blue-400/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <Card className="w-full max-w-md bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 shadow-2xl relative z-10">
          <CardContent className="p-8">
            <div className="text-center">
              {/* Animated Loading Icon */}
              <div className="relative mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg relative overflow-hidden">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                </div>
                <div className="absolute inset-0 w-16 h-16 mx-auto">
                  <div className="w-full h-full border-2 border-blue-400/30 rounded-2xl animate-ping" />
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Verifying Your Email</h3>
              <p className="text-gray-600 dark:text-gray-400">Please wait while we confirm your email address...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isVerified) {
    return <VerificationSuccessLoader email={email || ''} duration={3000} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 relative">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large background orbs */}
        <div className="absolute -top-20 -right-20 sm:-top-40 sm:-right-40 w-60 h-60 sm:w-80 sm:h-80 bg-gradient-to-r from-blue-400/30 to-purple-400/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-20 -left-20 sm:-bottom-40 sm:-left-40 w-60 h-60 sm:w-80 sm:h-80 bg-gradient-to-r from-indigo-400/30 to-blue-400/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 sm:w-96 sm:h-96 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* Floating Icons - Responsive positioning */}
        <div className="absolute top-10 left-10 sm:top-20 sm:left-20 animate-float">
          <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 text-blue-400/60" />
        </div>
        <div className="absolute top-16 right-16 sm:top-32 sm:right-32 animate-float" style={{ animationDelay: '1s' }}>
          <Shield className="w-3 h-3 sm:w-5 sm:h-5 text-purple-400/60" />
        </div>
        <div className="absolute bottom-16 left-16 sm:bottom-32 sm:left-32 animate-float" style={{ animationDelay: '2s' }}>
          <Users className="w-3 h-3 sm:w-5 sm:h-5 text-indigo-400/60" />
        </div>
        <div className="absolute bottom-10 right-10 sm:bottom-20 sm:right-20 animate-float" style={{ animationDelay: '3s' }}>
          <Clock className="w-3 h-3 sm:w-5 sm:h-5 text-blue-400/60" />
        </div>
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header Spacer */}
        <div className="flex-1 flex items-center justify-center py-8 sm:py-12 lg:py-16">
          <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg mx-4 sm:mx-6 lg:mx-8">

            <Card className="w-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-0 shadow-2xl">
        <CardHeader className="text-center pb-6 sm:pb-8 pt-8 sm:pt-12">
          {/* Animated Email Icon */}
          <div className="flex items-center justify-center mb-6 sm:mb-8">
            <div className="relative">
              {/* Glow Effect */}
              <div className="absolute inset-0 w-16 h-16 sm:w-20 sm:h-20 mx-auto">
                <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl blur-lg opacity-50 animate-pulse" />
              </div>
              
              {/* Main Icon Container */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl flex items-center justify-center shadow-2xl relative overflow-hidden">
                <Mail className="w-8 h-8 sm:w-10 sm:h-10 text-white relative z-10" />
                
                {/* Shimmer Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
              </div>
              
              {/* Rotating Ring */}
              <div className="absolute inset-0 w-16 h-16 sm:w-20 sm:h-20 mx-auto">
                <div className="w-full h-full border-4 border-transparent border-t-blue-500 border-r-purple-500 rounded-3xl animate-spin" style={{ animationDuration: '3s' }} />
              </div>
            </div>
          </div>
          
          <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-3 sm:mb-4">
            Check Your Email
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400 text-base sm:text-lg leading-relaxed">
            We&apos;ve sent a verification link to <br />
            <strong className="text-blue-600 dark:text-blue-400 text-lg sm:text-xl">{email}</strong>
          </CardDescription>
        </CardHeader>
        
        <CardContent className="px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8 space-y-6 sm:space-y-8">
          {/* Steps Card */}
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 p-4 sm:p-6 lg:p-8 rounded-2xl border border-blue-200/50 dark:border-blue-800/50 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-4 left-4 w-2 h-2 bg-blue-500 rounded-full" />
              <div className="absolute top-8 right-8 w-1 h-1 bg-purple-500 rounded-full" />
              <div className="absolute bottom-6 left-8 w-1.5 h-1.5 bg-indigo-500 rounded-full" />
              <div className="absolute bottom-4 right-4 w-2 h-2 bg-blue-500 rounded-full" />
            </div>
            
            <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-4 sm:mb-6 flex items-center text-base sm:text-lg">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-blue-500" />
              Follow these steps:
            </h4>
            
            <div className="grid gap-3 sm:gap-4">
              {[
                { step: 1, text: "Check your email inbox (and spam folder)", icon: Mail },
                { step: 2, text: "Look for an email from VulnScope", icon: Shield },
                { step: 3, text: "Click the verification link in the email", icon: CheckCircle },
                { step: 4, text: "You'll be automatically redirected to the dashboard", icon: Sparkles }
              ].map((item, index) => (
                <div key={index} className="flex items-start space-x-3 sm:space-x-4 p-2 sm:p-3 rounded-xl hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all duration-200">
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white text-xs sm:text-sm font-bold">{item.step}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 sm:space-x-3 flex-1">
                    <item.icon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0" />
                    <p className="text-blue-800 dark:text-blue-200 font-medium text-sm sm:text-base">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {message && (
            <Alert className={`${message.type === "error" ? "border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800" : "border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800"} rounded-xl`}>
              <AlertDescription className={message.type === "error" ? "text-red-800 dark:text-red-200" : "text-green-800 dark:text-green-200"}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3 sm:space-y-4">
            <Button
              onClick={handleResendVerification}
              disabled={resending || !email}
              className="w-full h-12 sm:h-14 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold text-base sm:text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] rounded-xl relative overflow-hidden group"
            >
              {resending ? (
                <RefreshCw className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
              ) : (
                <Mail className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" />
              )}
              <span className="relative z-10">
                {resending ? "Sending..." : "Resend Verification Email"}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </Button>

            {onBack && (
              <Button
                onClick={onBack}
                variant="ghost"
                className="w-full h-10 sm:h-12 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium rounded-xl transition-all duration-200"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Sign Up
              </Button>
            )}
          </div>

          <div className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 bg-gray-50/80 dark:bg-gray-700/50 p-4 sm:p-6 rounded-xl border border-gray-200/50 dark:border-gray-600/50">
            <p className="flex items-center justify-center space-x-2">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Didn&apos;t receive the email? Check your spam folder or try resending.</span>
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
