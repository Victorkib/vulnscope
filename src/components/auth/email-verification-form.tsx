"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { auth } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, Mail, RefreshCw, ArrowLeft } from "lucide-react"

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
            }, 2000)
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-2">Verifying email...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-green-600">Email Verified!</CardTitle>
            <CardDescription>
              Your email has been successfully verified. You can now access all features.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {message && (
              <Alert className={`mb-4 ${message.type === "error" ? "border-red-500" : "border-green-500"}`}>
                <AlertDescription>{message.text}</AlertDescription>
              </Alert>
            )}
            <Button 
              onClick={() => router.push("/dashboard")} 
              className="w-full"
            >
              Continue to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Verify Your Email</CardTitle>
          <CardDescription>
            We&apos;ve sent a verification link to <strong>{email}</strong>. 
            Please check your email and click the link to verify your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">What to do next:</h4>
            <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>1. Check your email inbox (and spam folder)</li>
              <li>2. Look for an email from VulnScope</li>
              <li>3. Click the verification link in the email</li>
              <li>4. You&apos;ll be automatically redirected to the dashboard</li>
            </ol>
          </div>

          {message && (
            <Alert className={`${message.type === "error" ? "border-red-500" : "border-green-500"}`}>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleResendVerification}
              disabled={resending || !email}
              variant="outline"
              className="w-full"
            >
              {resending && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              Resend Verification Email
            </Button>

            {onBack && (
              <Button
                onClick={onBack}
                variant="ghost"
                className="w-full text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Sign Up
              </Button>
            )}
          </div>

          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            <p>Didn&apos;t receive the email? Check your spam folder or try resending.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
