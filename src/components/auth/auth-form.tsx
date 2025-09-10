"use client"

import { useState } from "react"
import { auth } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import PasswordResetForm from "./password-reset-form"
import EmailVerificationForm from "./email-verification-form"
import SocialLogin from "./social-login"

export default function AuthForm() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [showPasswordReset, setShowPasswordReset] = useState(false)
  const [showEmailVerification, setShowEmailVerification] = useState(false)
  const [signupEmail, setSignupEmail] = useState("")

  const handleAuth = async (email: string, password: string, isSignUp: boolean) => {
    setLoading(true)
    setMessage(null)

    try {
      if (isSignUp) {
        const { error } = await auth.signUp(email, password)
        if (error) throw error
        
        // Store the email and show verification form
        setSignupEmail(email)
        setShowEmailVerification(true)
      } else {
        const { error } = await auth.signIn(email, password)
        if (error) throw error
      }
    } catch (error: unknown) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "An error occurred" })
    } finally {
      setLoading(false)
    }
  }

  const AuthTab = ({ isSignUp }: { isSignUp: boolean }) => {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    return (
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleAuth(email, password, isSignUp)
        }}
        className="space-y-6"
      >
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-12 px-4 border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500/20 dark:focus:border-blue-400 dark:focus:ring-blue-400/20 transition-all duration-200"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="h-12 px-4 border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500/20 dark:focus:border-blue-400 dark:focus:ring-blue-400/20 transition-all duration-200"
          />
        </div>
        <Button 
          type="submit" 
          className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]" 
          disabled={loading}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSignUp ? "Create Account" : "Sign In"}
        </Button>
        
        {!isSignUp && (
          <div className="text-center mt-4">
            <Button
              type="button"
              variant="link"
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              onClick={() => setShowPasswordReset(true)}
            >
              Forgot your password?
            </Button>
          </div>
        )}
      </form>
    )
  }

  const handleSocialError = (error: string) => {
    setMessage({ type: "error", text: error })
  }

  if (showPasswordReset) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <PasswordResetForm onBack={() => setShowPasswordReset(false)} />
      </div>
    )
  }

  if (showEmailVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <EmailVerificationForm 
          email={signupEmail} 
          onBack={() => setShowEmailVerification(false)} 
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4">
      <div className="w-full max-w-md">
        {/* Logo and Branding */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            VulnScope
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Track and analyze vulnerabilities in open source software
          </p>
        </div>

        <Card className="w-full shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardContent className="p-8">
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100 dark:bg-gray-700">
                <TabsTrigger 
                  value="signin" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-600"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger 
                  value="signup"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-600"
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>
              <TabsContent value="signin" className="mt-0">
                <AuthTab isSignUp={false} />
                <div className="mt-6">
                  <SocialLogin onError={handleSocialError} />
                </div>
              </TabsContent>
              <TabsContent value="signup" className="mt-0">
                <AuthTab isSignUp={true} />
                <div className="mt-6">
                  <SocialLogin onError={handleSocialError} />
                </div>
              </TabsContent>
            </Tabs>
            {message && (
              <Alert className={`mt-6 ${message.type === "error" ? "border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800" : "border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800"}`}>
                <AlertDescription className={message.type === "error" ? "text-red-800 dark:text-red-200" : "text-green-800 dark:text-green-200"}>
                  {message.text}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
          <p>Secure • Reliable • Professional</p>
        </div>
      </div>
    </div>
  )
}
