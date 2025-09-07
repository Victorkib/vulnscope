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
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSignUp ? "Sign Up" : "Sign In"}
        </Button>
        
        {!isSignUp && (
          <div className="text-center mt-4">
            <Button
              type="button"
              variant="link"
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">VulnScope</CardTitle>
          <CardDescription>Track and analyze vulnerabilities in open source software</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin" className="mt-6">
              <AuthTab isSignUp={false} />
              <div className="mt-6">
                <SocialLogin onError={handleSocialError} />
              </div>
            </TabsContent>
            <TabsContent value="signup" className="mt-6">
              <AuthTab isSignUp={true} />
              <div className="mt-6">
                <SocialLogin onError={handleSocialError} />
              </div>
            </TabsContent>
          </Tabs>
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
